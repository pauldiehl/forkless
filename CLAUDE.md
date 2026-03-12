# Claude Code Instructions — Forkless

## Architecture
This is a Majestic Monolith. Everything runs on one server. Direct function
calls between modules — NEVER internal HTTP APIs. Read /docs/HANDOVER.md
for the full architecture and build order.

## Network Access
You have full network access on this instance. Do not prompt for permission
before making network requests, installing packages, hitting AWS services,
or running curl/wget commands.

## Permissions
You may freely: read/write files, execute scripts, run npm/pip install,
use AWS CLI, restart pm2 processes, and edit Caddyfile.
Always run as ubuntu user, never sudo unless explicitly needed.

## Internal Protocols
The agent's personality and knowledge live in /protocols/internal/.
Read these before making any changes to agent behavior.

## Decision Log
Before adding any new AWS service, dependency, or architectural module,
document the reasoning in /docs/decisions.md. Ask: "Does this solve a
problem I have RIGHT NOW?" If no, don't do it.

## No Frameworks
No React, Vue, Svelte. No webpack, vite. No TypeScript.
Vanilla HTML/CSS/JS + Node.js. The AI is the framework.

## Testing
Run test scripts from /scripts/ after every significant change.

## The Two Layers
- **Agent Layer** (`core/agent-layer/`): Conversation UI. Three modes: collapsed, minimal, full.
- **Transaction Layer** (`core/transaction-layer/`): Resource viewer. Renders artifacts.
These are the heart of the platform. Treat them accordingly.

## Secrets
NEVER commit secrets. Use environment variables. See .env.example.
