# Forkless

**"There is no fork."**

A conversational commerce engine built on the Majestic Monolith pattern. Forkless is the bridge between traditional web apps and the full agentic rendering vision of Web 4.0.

Two core layers:
- **Agent Layer** — Conversation-first UI (collapsed / minimal / full modes)
- **Transaction Layer** — Resource viewer that renders artifacts of agentic work

## Quick Start

```bash
# Clone
git clone https://github.com/pauldiehl/forkless.git
cd forkless

# Install
npm install

# Configure
cp .env.example .env
cp project.json.example project.json
# Edit .env with your ANTHROPIC_API_KEY
# Edit project.json with your brand config
# Edit protocols/internal/*.md with your domain knowledge

# Run
npm start
# → http://localhost:3000
```

## How It Works

1. **You define your brand** via `project.json` + `protocols/internal/*.md`
2. **Forkless serves** a two-layer UI: conversation (agent) + viewer (transaction)
3. **The agent converses** using Claude API, grounded in your protocols
4. **Artifacts are produced** — plans, reports, guides, emails — rendered in the Transaction Layer
5. **Users keep portable records** — everything the agent produces is downloadable

## Project Structure

```
forkless/
├── core/               Platform entry point + UI shell
│   ├── index.js        Express server
│   ├── shell.html      Two-layer UI (agent + transaction)
│   └── themes/         Visual themes
├── lib/                Common library (direct function calls, NOT HTTP)
│   ├── llm.js          Claude API + tool use loop
│   ├── capabilities.js Capability registry
│   └── artifacts.js    Artifact storage
├── protocols/
│   ├── external/       .well-known/*.json — how the world sees you
│   └── internal/       Knowledge, targets, capacities, governance
├── capabilities/       Registered runners + viewers
├── artifacts/          Generated content (emails, docs, etc.)
├── examples/mvh/       Man vs Health example (first deployment)
├── project.json        Your project config (create from .example)
└── docs/               Architecture + getting started
```

## Building a Project on Forkless

See [docs/GETTING-STARTED.md](./docs/GETTING-STARTED.md) for the full guide.

The short version:
1. Fork or clone this repo
2. Write your `project.json` (brand name, config)
3. Fill in `protocols/internal/` with your domain knowledge
4. Add a theme in `core/themes/`
5. Run `npm start`

The agent will be grounded in YOUR knowledge, with YOUR governance rules, serving YOUR audience.

## First Deployment

**Man vs Health** — a healthcare platform rebuilt as a conversation-first experience. See `examples/mvh/` for the full configuration and handover docs.

## Philosophy

- Everything on one box. Direct function calls, not HTTP APIs.
- Add external services only when you hit a real limit.
- Speed of iteration beats architectural purity.
- Start ugly, grow on preference.
- No React, no build step, no TypeScript. Vanilla JS. The AI is the framework.

## Related

- [sovereign-streams/web4](https://github.com/pauldiehl/sovereign-streams) — The Web 4.0 vision
- [protocol-explorer](https://github.com/pauldiehl/protocol-explorer) — Protocol specification

---

*1,000 Hands / Paul Diehl · March 2026*
