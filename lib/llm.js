const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const { createScript, listCapabilities, getCapability } = require('./capabilities');

const client = new Anthropic();

// ========================================
// TOOLS the agent can use
// ========================================
const tools = [
  {
    name: 'create_capability',
    description: 'Create a new script capability. Writes the script file and registers it in the capability registry. After creating, you should tell the user it\'s ready and suggest loading it in the ExecuteCommand component.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Unique kebab-case identifier (e.g. "hello-world")' },
        name: { type: 'string', description: 'Human-readable name' },
        description: { type: 'string', description: 'What this capability does (1 line)' },
        filename: { type: 'string', description: 'Script filename (e.g. "hello-world.js")' },
        code: { type: 'string', description: 'The full script source code' },
        args: {
          type: 'array',
          description: 'Arguments the script accepts',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Arg flag (e.g. "--name")' },
              placeholder: { type: 'string', description: 'Placeholder text for the input' },
              required: { type: 'boolean' }
            },
            required: ['name', 'placeholder']
          }
        }
      },
      required: ['id', 'name', 'description', 'filename', 'code']
    }
  },
  {
    name: 'list_capabilities',
    description: 'List all registered capabilities with their IDs, names, and descriptions.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'load_capability',
    description: 'Load a script capability into the ExecuteCommand UI component in the Transaction Layer. The ExecuteCommand component (execute-command.html) is a terminal-style UI that lets users run scripts with args and see live log output. You NEVER create a script version of ExecuteCommand — it already exists as an HTML component. You only create scripts that RUN INSIDE it.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Capability ID of the SCRIPT to load (not the component itself)' }
      },
      required: ['id']
    }
  }
];

// ========================================
// TOOL EXECUTION
// ========================================
function executeTool(name, input) {
  switch (name) {
    case 'create_capability': {
      const cap = createScript(input);
      return { success: true, capability: cap };
    }
    case 'list_capabilities': {
      const caps = listCapabilities();
      return { capabilities: caps.map(c => ({ id: c.id, name: c.name, description: c.description, type: c.type })) };
    }
    case 'load_capability': {
      const cap = getCapability(input.id);
      if (!cap) return { error: `Capability '${input.id}' not found` };
      // Return the load instruction — the frontend will handle rendering
      return {
        success: true,
        action: 'load_transaction_layer',
        capability: cap
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ========================================
// SYSTEM PROMPT
// ========================================
function buildSystemPrompt() {
  const protocolDir = path.join(__dirname, '..', 'protocols', 'internal');
  const files = ['reasoning.md', 'knowledge.md', 'governance.md', 'targets.md', 'capacities.md'];

  const sections = [];
  for (const file of files) {
    const filePath = path.join(protocolDir, file);
    if (fs.existsSync(filePath)) {
      sections.push(fs.readFileSync(filePath, 'utf8'));
    }
  }

  // Load current capability registry for context
  const caps = listCapabilities();
  const capList = caps.length
    ? caps.map(c => `- ${c.id}: ${c.description} (${c.type})`).join('\n')
    : '(none registered yet)';

  return `You are the Man vs Health agent — an opinionated, knowledgeable health guide built on the Forkless platform.

You are NOT a generic chatbot. You have opinions, expertise, and a point of view grounded in the protocols below.

## Capability System

You can create, list, and load capabilities. Capabilities are reusable scripts and components that compound over time.

Current registered capabilities:
${capList}

CRITICAL ARCHITECTURE:
- ExecuteCommand is an HTML UI COMPONENT (execute-command.html) — it already exists. NEVER create a script called execute-command.
- Scripts are Node.js files that run INSIDE the ExecuteCommand component via /api/exec.
- Scripts must use require() (CommonJS), NOT import (ESM). No React. No frontend frameworks. Plain Node.js.

When a user asks you to build something executable (a script, tool, utility):
1. Use create_capability to write the Node.js script and register it
2. Use load_capability to load it in the ExecuteCommand component in the Transaction Layer
3. Confirm in 1-2 lines max

When a user asks to run/test something that already exists:
1. Use load_capability to load it
2. Confirm in 1 line

## Artifacts

For non-capability content (plans, guides, reports), wrap in artifact tags:
<artifact title="Title" type="html">
...HTML content...
</artifact>

## Response Style

Follow the reasoning protocol. Be succinct. 1-2 lines for actions. Show, don't tell. No preamble.

${sections.join('\n\n---\n\n')}`;
}

let systemPrompt = null;

// ========================================
// CHAT (with tool use loop)
// ========================================
async function chat(messages) {
  if (!systemPrompt) {
    systemPrompt = buildSystemPrompt();
  }

  let currentMessages = [...messages];
  let toolActions = []; // collect load actions for the frontend

  // Tool use loop — keep going until the model produces a final text response
  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages: currentMessages
    });

    // Check if there are tool uses
    const toolUses = response.content.filter(b => b.type === 'tool_use');

    if (toolUses.length === 0) {
      // No tool calls — extract text and return
      const textBlock = response.content.find(b => b.type === 'text');
      const text = textBlock ? textBlock.text : '';
      return { text, actions: toolActions };
    }

    // Execute tools and build tool_result messages
    const assistantContent = response.content;
    const toolResults = [];

    for (const toolUse of toolUses) {
      const result = executeTool(toolUse.name, toolUse.input);

      // Collect load actions
      if (result.action === 'load_transaction_layer') {
        toolActions.push(result);
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result)
      });
    }

    // Add assistant message + tool results to continue the loop
    currentMessages.push({ role: 'assistant', content: assistantContent });
    currentMessages.push({ role: 'user', content: toolResults });
  }
}

function reloadPrompt() {
  systemPrompt = null;
}

module.exports = { chat, reloadPrompt };
