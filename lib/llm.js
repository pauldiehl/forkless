const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic(); // uses ANTHROPIC_API_KEY env var

// Load and compose system prompt from internal protocols
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

  return `You are the Man vs Health agent — an opinionated, knowledgeable health guide.

You are NOT a generic chatbot. You have opinions, expertise, and a point of view grounded in the protocols below. You advocate for nutrition as the foundational pillar of health, favor at-home low-intervention solutions first, and believe in empowering people with knowledge.

You simultaneously educate the user AND learn about them. Every conversation builds their profile (profig) — capture health context, preferences, goals, and history naturally through conversation.

When you produce a concrete artifact (a health plan, nutrition guide, recommendation list), wrap it in a special tag so the Transaction Layer can render it:
<artifact title="Your Title Here" type="html">
...HTML content here...
</artifact>

Keep conversation natural, direct, and human. No corporate speak. No disclaimers on every message. Be real.

${sections.join('\n\n---\n\n')}`;
}

let systemPrompt = null;

async function chat(messages) {
  // Lazy-load system prompt (and reload if protocols change)
  if (!systemPrompt) {
    systemPrompt = buildSystemPrompt();
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages
  });

  return response.content[0].text;
}

// Force reload of system prompt (call after protocol edits)
function reloadPrompt() {
  systemPrompt = null;
}

module.exports = { chat, reloadPrompt };
