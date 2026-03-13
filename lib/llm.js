const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const { createScript, listCapabilities, getCapability } = require('./capabilities');
const { storeArtifact, listArtifacts, readArtifactContent } = require('./artifacts');

const client = new Anthropic();

// ========================================
// TOOLS
// ========================================
const tools = [
  {
    name: 'create_runner',
    description: 'Create a Node.js script (runner) that can be executed in the ExecuteCommand UI. Scripts must use require() (CommonJS). No React, no ESM imports. Plain Node.js only.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Unique kebab-case ID' },
        name: { type: 'string', description: 'Human-readable name' },
        description: { type: 'string', description: 'One-line description' },
        filename: { type: 'string', description: 'Filename (e.g. "my-script.js")' },
        code: { type: 'string', description: 'Full Node.js script source (CommonJS)' },
        args: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              placeholder: { type: 'string' },
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
    name: 'generate_email_template',
    description: 'Generate an SES-ready HTML email template from a prompt. Calls the LLM to produce full HTML with template variables like {{name}}, {{unsubscribe_url}}, etc. Stores as an artifact and can be viewed in the email-viewer.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Unique kebab-case ID for this template (e.g. "mean-clean-lean-promo")' },
        prompt: { type: 'string', description: 'Description of what the email should contain, promote, look like' },
        subject: { type: 'string', description: 'Email subject line' }
      },
      required: ['id', 'prompt', 'subject']
    }
  },
  {
    name: 'generate_markdown',
    description: 'Store a long-form response as a markdown artifact instead of returning it inline. Use this whenever the response would exceed ~5 lines or contains structured data (tables, lists, reports). The markdown will be displayed in the markdown-viewer in the Transaction Layer. Your chat response should be a 1-line summary with context.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Unique kebab-case ID. For temporary docs use a timestamp-based ID like "caps-report-031226"' },
        title: { type: 'string', description: 'Document title' },
        content: { type: 'string', description: 'Full markdown content' }
      },
      required: ['id', 'title', 'content']
    }
  },
  {
    name: 'list_capabilities',
    description: 'List all registered capabilities.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'list_artifacts',
    description: 'List all generated artifacts, optionally filtered by type.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Filter by type (e.g. "email-template")' }
      }
    }
  },
  {
    name: 'load_viewer',
    description: 'Load a viewer in the Transaction Layer. For runners: loads ExecuteCommand with command+args. For artifacts: loads the appropriate viewer (e.g. email-viewer for email templates).',
    input_schema: {
      type: 'object',
      properties: {
        capability_id: { type: 'string', description: 'Capability ID to load (for runners)' },
        artifact_id: { type: 'string', description: 'Artifact ID to view (for generated content)' },
        viewer: { type: 'string', description: 'Viewer to use (e.g. "email-viewer", "execute-command"). Auto-detected if not specified.' }
      }
    }
  }
];

// ========================================
// TOOL EXECUTION
// ========================================
async function executeTool(name, input) {
  switch (name) {
    case 'create_runner': {
      const cap = createScript(input);
      return { success: true, capability: cap };
    }

    case 'generate_email_template': {
      const html = await generateEmailHtml(input.prompt, input.subject);

      // Extract template vars like {{name}}, {{unsubscribe_url}}
      const varMatches = html.match(/\{\{(\w+)\}\}/g) || [];
      const templateVars = [...new Set(varMatches)];

      const artifact = storeArtifact({
        id: input.id,
        type: 'email-template',
        subdir: 'emails',
        filename: `${input.id}.html`,
        content: html,
        metadata: {
          subject: input.subject,
          prompt: input.prompt,
          templateVars
        }
      });

      return {
        success: true,
        artifact,
        action: 'load_viewer',
        viewer: 'email-viewer',
        artifactId: input.id
      };
    }

    case 'generate_markdown': {
      const artifact = storeArtifact({
        id: input.id,
        type: 'markdown',
        subdir: 'docs',
        filename: `${input.id}.md`,
        content: input.content,
        metadata: { title: input.title }
      });

      return {
        success: true,
        artifact,
        action: 'load_viewer',
        viewer: 'markdown',
        artifactId: input.id
      };
    }

    case 'list_capabilities': {
      const caps = listCapabilities();
      return { capabilities: caps.map(c => ({ id: c.id, name: c.name, type: c.type, description: c.description })) };
    }

    case 'list_artifacts': {
      const arts = listArtifacts(input.type);
      const viewerMap = { 'email-template': 'email-viewer', 'markdown': 'markdown' };
      return {
        artifacts: arts.map(a => ({
          id: a.id,
          type: a.type,
          created: a.created,
          metadata: a.metadata,
          deepLink: `http://localhost:3000/?viewer=${viewerMap[a.type] || 'markdown'}&artifact=${a.id}`
        }))
      };
    }

    case 'load_viewer': {
      // Loading a runner in ExecuteCommand
      if (input.capability_id) {
        const cap = getCapability(input.capability_id);
        if (!cap) return { error: `Capability '${input.capability_id}' not found` };
        if (cap.type === 'runner') {
          return {
            success: true,
            action: 'load_viewer',
            viewer: 'execute-command',
            capability: cap
          };
        }
        return { success: true, action: 'load_viewer', viewer: cap.id, capability: cap };
      }

      // Loading an artifact in its viewer
      if (input.artifact_id) {
        const art = readArtifactContent(input.artifact_id);
        if (!art) return { error: `Artifact '${input.artifact_id}' not found` };

        // Auto-detect viewer from artifact type
        let viewer = input.viewer;
        if (!viewer) {
          const caps = listCapabilities();
          const viewerCap = caps.find(c => c.accepts === art.type);
          viewer = viewerCap ? viewerCap.id : null;
        }

        return {
          success: true,
          action: 'load_viewer',
          viewer: viewer || 'email-viewer',
          artifactId: input.artifact_id
        };
      }

      return { error: 'Provide capability_id or artifact_id' };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ========================================
// EMAIL GENERATION (direct LLM call)
// ========================================
async function generateEmailHtml(prompt, subject) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: `You are an expert email template designer. Generate a complete, production-ready HTML email template.

Requirements:
- Full HTML document with inline CSS (email clients don't support external stylesheets)
- Mobile-responsive using max-width tables or media queries
- Use template variables with double curly braces: {{variable_name}}
- Always include: {{first_name}} for personalization, {{unsubscribe_url}} for CAN-SPAM compliance
- Professional, clean design with clear CTA buttons
- Include preheader text
- Test-friendly: should render well in Gmail, Outlook, Apple Mail
- Do NOT wrap in markdown code blocks. Return ONLY the raw HTML.`,
    messages: [{
      role: 'user',
      content: `Generate an HTML email template for:\n\nSubject: ${subject}\n\n${prompt}`
    }]
  });

  let html = response.content[0].text;
  // Strip markdown code blocks if the model wraps them
  html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();
  return html;
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

  const caps = listCapabilities();
  const capList = caps.length
    ? caps.map(c => `- ${c.id} (${c.type}): ${c.description}`).join('\n')
    : '(none)';

  const arts = listArtifacts();
  const artList = arts.length
    ? arts.map(a => `- ${a.id} (${a.type}): ${a.metadata?.subject || ''}`).join('\n')
    : '(none)';

  return `You are the Man vs Health agent on the Forkless platform.

## Architecture

CAPABILITY TYPES:
- runner: Node.js scripts executed in the ExecuteCommand UI (streams logs)
- generator: produces artifacts (files) stored in artifacts/ directory
- viewer: standalone HTML UI that displays artifacts (email-viewer, execute-command, etc.)
- service: calls external APIs (SES, etc.) — future

CRITICAL RULES:
- Runners are plain Node.js (CommonJS require(), no ESM, no React)
- ExecuteCommand (execute-command.html) is a VIEWER — never create a script version of it
- Generators produce artifacts that are viewed in the appropriate viewer
- When generating an email template, it auto-loads in the email-viewer
- When loading a runner, it loads in ExecuteCommand with command+args pre-filled

CURRENT CAPABILITIES:
${capList}

CURRENT ARTIFACTS:
${artList}

## Response Style
Follow the reasoning protocol. 1-2 lines for actions. Show, don't tell.

LONG RESPONSES — MANDATORY RULES:
- If your response would be more than ~5 lines or contains structured data, you MUST use generate_markdown.
- Your chat reply MUST be exactly 1 line: a brief summary + the deep link.
- Format: "Generated [description]. View at http://localhost:3000/?viewer=markdown&artifact=ARTIFACT_ID"
- The markdown viewer loads automatically in the Transaction Layer — the user will see it.
- NEVER put the long content in the chat message. ALWAYS use the tool.

DEEP LINKS — ALWAYS INCLUDE:
- Every time you reference, create, load, or list artifacts, your chat reply MUST include the deep link URL(s).
- Format: http://localhost:3000/?viewer=VIEWER_NAME&artifact=ARTIFACT_ID
- When listing multiple artifacts, include ALL links — one per line.
- This is non-negotiable. The user needs links to click, bookmark, and share.
- NEVER mention an artifact without its clickable link.

${sections.join('\n\n---\n\n')}`;
}

let systemPrompt = null;

// ========================================
// CHAT (tool use loop)
// ========================================
async function chat(messages) {
  if (!systemPrompt) {
    systemPrompt = buildSystemPrompt();
  }

  let currentMessages = [...messages];
  let viewerActions = [];

  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages: currentMessages
    });

    const toolUses = response.content.filter(b => b.type === 'tool_use');

    if (toolUses.length === 0) {
      const textBlock = response.content.find(b => b.type === 'text');
      return { text: textBlock ? textBlock.text : '', actions: viewerActions };
    }

    const assistantContent = response.content;
    const toolResults = [];

    for (const toolUse of toolUses) {
      const result = await executeTool(toolUse.name, toolUse.input);

      if (result.action === 'load_viewer') {
        viewerActions.push(result);
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result)
      });
    }

    currentMessages.push({ role: 'assistant', content: assistantContent });
    currentMessages.push({ role: 'user', content: toolResults });
  }
}

function reloadPrompt() {
  systemPrompt = null;
}

module.exports = { chat, reloadPrompt };
