# Forkless — Phase 1 Handover

**For:** Claude Code + OpenClaw
**From:** Paul Diehl (1,000 Hands / Milliprime)
**Date:** March 2026
**Status:** EXECUTE THIS

---

> "There is no fork." This platform makes the fork unnecessary. The agent converses. The transaction layer renders the artifacts. The user gets what they need without ceremony.

---

## 1. WHAT YOU'RE BUILDING

Forkless is a sovereign development platform — a Majestic Monolith running on a single EC2 instance. It serves as the foundation for all 1KH products, starting with **Man vs Health**.

The platform has two core architectural innovations:

**The Agent Layer** — A conversation-first interface where users talk (voice or text) to an intelligent agent grounded in opinionated knowledge, protocols, and governance. This is NOT a chatbot bolted onto a form. The conversation IS the interface. The traditional UI materializes around what the conversation discovers.

**The Transaction Layer** — A resource viewer that sits behind the Agent Layer. It renders the artifacts of agentic work: HTML pages, images, PDFs, build logs, test interfaces, receipts, snapshots, interactive documents. These artifacts are point-in-time reflections — portable records that extend beyond the scope of any single conversation. A confirmation message of "it's done" is insufficient. The Transaction Layer shows the PROOF and PRODUCT of what the agent did.

Together, they form the **Forkless pattern**: agent converses, transaction layer renders artifacts, user keeps portable records.

---

## 2. INFRASTRUCTURE — THE MAJESTIC MONOLITH

### Philosophy (Never Violate)

- **Direct function calls only** — no internal HTTP APIs between modules
- **Add AWS services only on concrete need** — not anticipation
- **Lambda for heavy compute offload only** — image/video processing, batch jobs
- **S3 for data that outgrows disk** — not for everything by default
- **One process, one codebase, one server** — until there's a measurable reason to split
- **Speed of iteration beats architectural purity**

### Decision Gate

Before adding any new AWS service or splitting any module, ask: "Does this solve a problem I have RIGHT NOW?" If the answer is no, don't do it. Document the decision in `/docs/decisions.md`.

### EC2 Specs

| Property | Value |
|----------|-------|
| Instance type | **t3.medium** (2 vCPU / 4GB RAM) — start cheap |
| OS | Ubuntu 24.04 LTS |
| Storage | 30GB gp3 EBS |
| Region | us-east-1 |
| Public IP | Elastic IP — assign immediately after launch |
| Estimated cost | ~$30/mo On-Demand |

We start with t3.medium. If we hit memory/CPU limits, we scale up to t3.large or t3.xlarge. The monolith pattern makes vertical scaling trivial — stop instance, change type, start instance.

### Setup Sequence

1. Run `infra/ec2-launch.sh` from local machine — provisions instance, security group, key pair
2. SSH in: `ssh -i paul-dev-key.pem ubuntu@YOUR_IP`
3. Run `infra/bootstrap.sh` on the instance — installs Node 20 LTS, pm2, Caddy, git, build tools
4. Authenticate Claude Code (OAuth via Claude.ai Max subscription OR API key)
5. Install OpenClaw: `npm install -g openclaw`
6. Assign Elastic IP in AWS Console
7. Point domain DNS A record to Elastic IP
8. Clone this repo: `git clone https://github.com/pauldiehl/forkless.git ~/apps/forkless`

### SSH Config (Local Mac)

```
Host devbox
  HostName YOUR_ELASTIC_IP
  User ubuntu
  IdentityFile ~/paul-dev-key.pem
  ServerAliveInterval 60
  ServerAliveCountMax 10
```

### Dev Session (tmux)

```bash
# Pane 1: Claude Code
cd ~/apps/forkless && claude

# Pane 2: OpenClaw
openclaw

# Pane 3: Logs
pm2 logs
```

Create `infra/dev-session.sh` to automate this tmux layout.

### Safety

Snapshot before every session where Claude Code or OpenClaw will be making structural changes:

```bash
bash infra/snapshot.sh
```

EBS snapshots cost ~$0.05/GB/month. Cheap insurance.

---

## 3. PROJECT STRUCTURE

```
forkless/
├── CLAUDE.md                    ← Claude Code persistent instructions
├── README.md                    ← Project overview
├── package.json                 ← Node dependencies
│
├── infra/                       ← Infrastructure scripts
│   ├── ec2-launch.sh            ← Provision instance from local
│   ├── bootstrap.sh             ← Install tooling on instance
│   ├── snapshot.sh              ← EBS snapshot before agent sessions
│   ├── dev-session.sh           ← tmux layout for dev
│   └── Caddyfile                ← Reverse proxy config
│
├── core/                        ← Platform core
│   ├── index.js                 ← App entry point (Express or Fastify)
│   ├── router.js                ← Route handler
│   ├── agent-layer/             ← The conversation UI
│   │   ├── index.html           ← Agent Layer shell
│   │   ├── styles.css           ← Agent Layer styles
│   │   └── agent.js             ← Agent Layer logic (mode switching, LLM calls)
│   └── transaction-layer/       ← The resource viewer
│       ├── index.html           ← Transaction Layer shell
│       ├── styles.css           ← Transaction Layer styles
│       └── viewer.js            ← Artifact rendering logic
│
├── lib/                         ← Common library (direct function calls)
│   ├── llm.js                   ← Anthropic API wrapper
│   ├── email.js                 ← SES wrapper (when needed)
│   ├── storage.js               ← S3 wrapper (when needed)
│   └── db.js                    ← Database client (DynamoDB or SQLite to start)
│
├── protocols/
│   ├── external/                ← .well-known/*.json — public-facing protocols
│   │   ├── governance.json
│   │   ├── haves.json
│   │   ├── needs.json
│   │   └── payments.json
│   └── internal/                ← Opinionated knowledge that grounds the agent
│       ├── knowledge.md         ← Domain expertise (MVH health knowledge)
│       ├── targets.md           ← Who we serve and how
│       ├── capacities.md        ← What we can do right now
│       ├── governance.md        ← Rules of engagement, ethical guardrails
│       └── metrics.md           ← What we measure and why
│
├── services/                    ← Business logic modules
│   └── mvh/                     ← Man vs Health service
│       ├── journeys/            ← The 4 health journeys
│       ├── intake.js            ← Conversation intake logic
│       ├── portal.js            ← Portal experience generator
│       └── admin.js             ← Admin functionality
│
├── users/                       ← Profig store
│   └── .gitkeep                 ← User profigs stored here (JSON per user)
│
├── queue/                       ← Action queue
│   └── .gitkeep                 ← Queued items for founder review
│
├── scripts/                     ← Utility scripts
│   ├── test-agent.js            ← Test agent conversation
│   ├── test-transaction.js      ← Test artifact rendering
│   └── seed-protocols.js        ← Seed initial protocol data
│
├── lambda/                      ← Heavy compute (Phase 2+)
│   └── .gitkeep
│
└── docs/
    ├── HANDOVER.md              ← THIS FILE
    ├── FUTURE-PHASES.md         ← Advanced setups, Dream in a Box
    ├── architecture.md          ← Architecture decisions log
    ├── decisions.md             ← Decision log (every "why not" goes here)
    └── runbook.md               ← Ops procedures
```

---

## 4. THE AGENT LAYER — TECHNICAL SPEC

### Three Modes

The Agent Layer has three display modes. The user can toggle between them. Start with minimal as default.

**Collapsed Mode:**
```
┌──────────────────────────────────────────────┐
│                                              │
│            TRANSACTION LAYER                 │
│         (full page, no overlay)              │
│                                              │
│                                              │
│                                              │
│                                    ┌────┐    │
│                                    │ 💬 │    │ ← floating tab button
│                                    └────┘    │
└──────────────────────────────────────────────┘
```
Just a floating button. Tap to expand to minimal. The Transaction Layer gets the full viewport.

**Minimal Mode:**
```
┌──────────────────────────────────────────────┐
│                                              │
│            TRANSACTION LAYER                 │
│           (visible behind)                   │
│                                              │
├──────────────────────────────────────────────┤
│  AGENT LAYER (bottom half)                   │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Conversation log                      │  │
│  │  Agent: How can I help today?          │  │
│  │  You: I want to work on my allergies   │  │
│  │  Agent: Let's talk about that...       │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Type or speak...              [Send]  │  │
│  └────────────────────────────────────────┘  │
│                                     [▼] [▲]  │ ← collapse / expand
└──────────────────────────────────────────────┘
```

**Full Mode:**
```
┌──────────────────────────────────────────────┐
│  AGENT LAYER (full overlay)                  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │  Conversation log                      │  │
│  │  (scrollable, full history)            │  │
│  │                                        │  │
│  │  Agent: Based on what you've told me,  │  │
│  │  here's what I recommend...            │  │
│  │                                        │  │
│  │  [View Plan] [View Nutrition Guide]    │  │ ← these open in Transaction Layer
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Type or speak...              [Send]  │  │
│  └────────────────────────────────────────┘  │
│                                     [▼] [▲]  │
└──────────────────────────────────────────────┘
```

### Agent Layer Behavior

- **Conversation is persistent** — the full conversation log is maintained across sessions (stored in profig or local storage)
- **Voice or text input** — use Web Speech API for voice, standard text input for typing
- **The agent is opinionated** — grounded in internal protocols (knowledge.md, governance.md, etc.). It's not a generic chatbot. It has opinions, expertise, and a point of view
- **The agent captures AND educates** — simultaneously building a profig while sharing knowledge
- **Artifact links** — when the agent produces something (a plan, a report, a guide), it generates a link that opens in the Transaction Layer
- **Mode memory** — remember the user's preferred mode between sessions

### Agent LLM Integration

```javascript
// lib/llm.js — keep it simple
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();  // uses ANTHROPIC_API_KEY env var

async function chat(messages, systemPrompt) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages
  });
  return response.content[0].text;
}

module.exports = { chat };
```

The system prompt is composed from internal protocols at runtime:
```javascript
const knowledge = fs.readFileSync('./protocols/internal/knowledge.md', 'utf8');
const governance = fs.readFileSync('./protocols/internal/governance.md', 'utf8');
const targets = fs.readFileSync('./protocols/internal/targets.md', 'utf8');

const systemPrompt = `You are the Man vs Health agent.
${knowledge}
${governance}
${targets}
`;
```

This is the core of what makes the agent opinionated — it's grounded in real protocols, not generic instructions.

---

## 5. THE TRANSACTION LAYER — TECHNICAL SPEC

### What It Renders

The Transaction Layer is NOT a standard application UI. It is a **resource viewer** — it renders the artifacts produced by the Agent Layer:

- **HTML pages** — personalized portal views, health plans, guides
- **Images** — charts, visualizations, progress graphics
- **PDFs** — downloadable reports, receipts, prescriptions
- **Interactive documents** — forms that feed back into the agent conversation
- **Build logs / test results** — for admin/developer views
- **Snapshots** — point-in-time captures of the user's state

### Key Principle

These artifacts are **portable records**. They are more than notifications. They represent point-in-time reflections of the user's journey that can be kept, shared, exported, and referenced outside the platform. A user should be able to download their Transaction Layer artifacts and take them anywhere.

### Implementation

```
┌─────────────────────────────────────────────┐
│  TRANSACTION LAYER                          │
│                                             │
│  ┌─── Artifact Tabs ───────────────────┐   │
│  │ [My Plan] [Nutrition] [Progress]    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─── Content Area ────────────────────┐   │
│  │                                     │   │
│  │  (renders whatever the agent        │   │
│  │   produced — HTML, image, PDF,      │   │
│  │   interactive form, etc.)           │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Download] [Share] [Back to Agent]         │
│                                             │
└─────────────────────────────────────────────┘
```

- Tabs accumulate as the agent produces artifacts
- Each tab is a named artifact with a timestamp
- Content area uses an iframe or dynamic HTML injection to render artifacts
- Download button exports the artifact as a standalone file
- Share generates a portable link or file

---

## 6. INITIAL IMPLEMENTATION FOCUS — MAN VS HEALTH

### What Exists Today

Man vs Health has a **marketing site** — this STAYS. Do not touch the marketing site. Everything else is being rebuilt from scratch.

### What Gets Rebuilt

**The 4 Health Journeys** — These are the core user paths through Man vs Health. Each journey is a conversation-first experience powered by AR1:

1. **Journey discovery** — The agent helps the user identify which journey(s) fit their needs through conversation
2. **Intake** — The conversation captures the user's health context, history, goals, and preferences. This builds the profig
3. **Plan generation** — Based on the intake, the agent generates a personalized health plan (rendered in Transaction Layer)
4. **Ongoing engagement** — The agent adapts as the user progresses, offering new education, adjusting recommendations, surfacing live dream beacons

Paul will define the specific 4 journeys. The architecture should support ANY journey — the journeys are defined by the internal protocols (knowledge.md, targets.md) not by hardcoded routes.

### The Portal

The portal is what users see in the Transaction Layer — their personalized health experience. It materializes from the conversation, not from a pre-built dashboard. The portal includes:

- Personalized health plan
- Nutrition guidance (MVH's opinionated stance: nutrition is the foundational pillar)
- Progress tracking
- Education content (articles, videos, guides surfaced by the agent)
- Recommendations (at-home, low-intervention solutions favored)
- Live Dream Beacons (user suggestions for features/experiences)

### The Admin

Admin functionality for Paul (the founder/provider):

- View all user profigs
- Review the action queue (items users/agent flagged for founder review)
- View conversation logs (anonymized or permissioned)
- Edit internal protocols (knowledge, targets, capacities, governance)
- Monitor metrics (conversations started, profigs created, artifacts generated, journeys completed)
- Manage the queue (approve/reject/delegate queued actions)

### The Profig

The profig (flexible user profile) is the data structure that makes everything adaptive:

```json5
// users/user-abc123.json
{
  id: "abc123",
  created: "2026-03-15T10:00:00Z",
  // Sparse on day one...
  health: {
    allergies: ["seasonal"],
    current_approach: "benadryl",
    openness_to_alternatives: "high"
  },
  // Rich by session twenty...
  nutrition: {
    dietary_preferences: ["whole foods", "minimal processed"],
    restrictions: ["dairy-light"],
    cooking_comfort: "intermediate",
    meal_prep_willingness: "high"
  },
  journey: {
    active: ["allergy-management"],
    completed: [],
    interests: ["nutrition-foundation", "sleep-optimization"]
  },
  preferences: {
    communication_style: "direct",
    education_depth: "detailed",
    session_length: "medium"
  },
  dreams: [
    { id: "d1", text: "I wish I could see my progress as a timeline", status: "queued", created: "2026-03-20" }
  ]
}
```

The profig is JSON — no rigid schema. New fields emerge as the conversation discovers them. The agent reads the profig at session start and writes to it throughout.

---

## 7. INTERNAL PROTOCOLS — WHAT MAKES THE AGENT OPINIONATED

The agent is NOT a generic assistant. It has opinions, expertise, and a point of view — all grounded in internal protocol documents that Paul writes and maintains.

### protocols/internal/knowledge.md

The domain expertise. For Man vs Health, this includes:
- MVH's health philosophy (nutrition as foundational pillar, at-home solutions, low-intervention first)
- Specific health knowledge (allergies, immunotherapy, nutrition science, sleep, stress)
- Opinions — things the agent believes and advocates for (e.g., "have you heard about the new allergists doing 3-5 year immunotherapy?")
- Things the agent will NOT do (diagnose, prescribe, replace medical professionals)

### protocols/internal/targets.md

Who we serve:
- Target demographics
- Pain points we address
- What "success" looks like for our users
- How we measure impact

### protocols/internal/capacities.md

What the system can do right now:
- Available journeys
- Types of artifacts it can generate
- Integrations available
- Limitations to be honest about

### protocols/internal/governance.md

Rules of engagement:
- Ethical guardrails (what the agent will never do)
- Privacy commitments
- Data handling rules
- Escalation paths (when the agent should hand off to a human)
- Tone and communication guidelines

### protocols/internal/metrics.md

What we measure:
- Conversation quality signals
- Profig growth rate
- Journey completion rates
- Dream beacon patterns
- User retention signals

---

## 8. EXTERNAL PROTOCOLS

These are the `.well-known/*.json` files that make Man vs Health a Web 4.0 entity. Deploy to `manvshealth.com/.well-known/`:

- `governance.json` — What MVH is, what it values, how it operates
- `haves.json` — What MVH offers (health journeys, nutrition expertise, wellness plans)
- `needs.json` — What MVH needs (users, content partners, health professionals)
- `payments.json` — How MVH exchanges value

These already exist in concept from the Protocol Explorer work. Copy the structure, fill in MVH-specific content.

---

## 9. TECHNOLOGY STACK

### Core

| Component | Technology | Why |
|-----------|-----------|-----|
| Runtime | Node.js 20 LTS | Paul's ecosystem, fast, monolith-friendly |
| Server | Express or Fastify | Simple, fast, direct. Pick one |
| Agent Layer UI | Vanilla HTML/CSS/JS | No framework overhead. Agent generates HTML |
| Transaction Layer | Vanilla HTML/CSS/JS + iframe | Resource viewer, renders artifacts |
| LLM | Anthropic API (Claude Sonnet) | Opinionated, high quality, good at conversation |
| Database | SQLite (local) or DynamoDB | SQLite for Phase 1 simplicity. DynamoDB when scaling |
| Process Manager | pm2 | Restart on crash, log management |
| Reverse Proxy | Caddy | Auto HTTPS, simple config |
| Voice | Web Speech API | Built into browsers, zero cost |

### Why Vanilla (No React, No Framework)

The Agent Layer and Transaction Layer are intentionally framework-free:
1. The agent generates HTML — frameworks add complexity without benefit
2. The Transaction Layer renders artifacts — it's a viewer, not an app
3. Fewer dependencies = fewer things to break on a monolith
4. Paul and Claude Code can iterate faster without build steps
5. This IS the Layer Cake philosophy — the AI is the framework

### What NOT to Install

- No React, Vue, Svelte, or any frontend framework
- No webpack, vite, or bundlers
- No TypeScript (plain JS, move fast)
- No ORM (direct DB calls via lib/)
- No Docker (bare metal on EC2)
- No Kubernetes, ECS, or container orchestration

---

## 10. BUILD ORDER

Execute these in order. Each step should be a working, testable increment.

### Step 1: Local Development Setup
- Initialize Node project (`npm init`)
- Install dependencies: `@anthropic-ai/sdk`, `express` (or `fastify`), `better-sqlite3`
- Create `core/index.js` — basic Express server serving static files
- Create placeholder HTML for Agent Layer and Transaction Layer
- Verify: `node core/index.js` → browser shows the UI shell at localhost:3000

### Step 2: Agent Layer UI (Three Modes)
- Build `core/agent-layer/index.html` with collapsed/minimal/full modes
- Implement mode switching (CSS transitions, JS state)
- Add conversation log display (scrollable message list)
- Add text input with send button
- Verify: all three modes work, messages display in the log

### Step 3: LLM Integration
- Create `lib/llm.js` — Anthropic API wrapper
- Write initial `protocols/internal/knowledge.md` for Man vs Health
- Wire agent-layer.js to call the server, which calls the LLM
- Server endpoint: `POST /api/chat` — accepts message, returns agent response
- System prompt composed from internal protocols
- Verify: user types a health question → agent responds with opinionated MVH answer

### Step 4: Transaction Layer
- Build `core/transaction-layer/index.html` — tabbed resource viewer
- Create artifact rendering system (accept HTML/images/PDF from agent)
- Wire agent responses that contain artifacts to open in Transaction Layer
- Add Download and Share buttons
- Verify: agent produces a health plan → it renders in the Transaction Layer as a portable artifact

### Step 5: Profig System
- Create `users/` directory with JSON file-per-user pattern
- Build profig read/write in `lib/db.js` (or standalone `lib/profig.js`)
- Agent reads profig at conversation start, writes during conversation
- Profig grows as conversations happen
- Verify: conversation data persists between sessions, agent references previous context

### Step 6: MVH Journeys + Intake
- Paul defines the 4 health journeys in `protocols/internal/knowledge.md`
- Build journey discovery flow in the agent conversation
- Intake logic: agent captures health context → builds profig
- Plan generation: agent creates personalized plan → renders in Transaction Layer
- Verify: complete end-to-end journey from first conversation to personalized plan

### Step 7: Portal Experience
- Portal materializes in Transaction Layer based on profig
- Dynamic sections: active journey, plan, nutrition, progress, education
- Sections grow/shrink based on profig richness
- Live Dream Beacons: users suggest features → queued for review
- Verify: returning user sees a portal adapted to their profig

### Step 8: Admin
- Admin route (protected by simple auth — even a password in env var is fine for Phase 1)
- View all user profigs
- Review action queue
- Edit internal protocols (inline editor)
- Basic metrics dashboard
- Verify: Paul can see all users, review queued items, update knowledge

### Step 9: External Protocols
- Deploy `.well-known/*.json` to manvshealth.com
- Governance, haves, needs, payments
- Link from Protocol Explorer
- Verify: `manvshealth.com/.well-known/governance.json` returns valid protocol

### Step 10: EC2 Deployment
- Run `infra/ec2-launch.sh` to provision t3.medium
- Run `infra/bootstrap.sh` to install tooling
- Clone repo, install deps, configure Caddy
- Set up pm2 process management
- Point DNS to Elastic IP
- Verify: the full MVH experience works at the production URL

### Step 11: Snapshot + Harden
- Create `infra/snapshot.sh` for EBS snapshots
- Set up pm2 startup (auto-restart on reboot)
- Configure Caddy for HTTPS
- Set up basic error logging
- Document everything in `docs/runbook.md`

---

## 11. SECRETS MANAGEMENT

**NEVER commit secrets to GitHub.** This is a public repo.

Store secrets in environment variables on the EC2 instance:

```bash
# Add to ~/.bashrc on EC2
export ANTHROPIC_API_KEY=sk-ant-YOUR_KEY
export MVH_ADMIN_PASSWORD=your-admin-password
export AWS_REGION=us-east-1
```

For local development, use a `.env` file (already in `.gitignore`):

```
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY
MVH_ADMIN_PASSWORD=local-password
```

Create a `.env.example` file in the repo with placeholder values so Claude Code knows what environment variables are expected.

---

## 12. CLAUDE.md — PERSISTENT INSTRUCTIONS

Create this file at the project root. Claude Code reads it automatically:

```markdown
# Claude Code Instructions — Forkless

## Architecture
This is a Majestic Monolith. Everything runs on one server. Direct function
calls between modules — NEVER internal HTTP APIs. Read /docs/HANDOVER.md
for the full architecture.

## Network Access
You have full network access. Do not prompt for permission before making
network requests, installing packages, or running scripts.

## Permissions
You may freely: read/write files, execute scripts, run npm install,
restart pm2 processes, and edit Caddyfile. Always run as ubuntu user.

## Internal Protocols
The agent's personality and knowledge live in /protocols/internal/.
Read these before making any changes to agent behavior.

## Decision Log
Before adding any new AWS service, dependency, or module, document the
reasoning in /docs/decisions.md. Ask: "Does this solve a problem I have
RIGHT NOW?"

## No Frameworks
No React, Vue, Svelte. No webpack, vite. No TypeScript.
Vanilla HTML/CSS/JS + Node.js. The AI is the framework.

## Testing
Run test scripts from /scripts/ after every significant change.
```

---

## 13. WHAT SUCCESS LOOKS LIKE

Phase 1 is done when:

1. A user can open the MVH app and start a conversation with the agent
2. The agent is opinionated — grounded in MVH health knowledge and protocols
3. The conversation builds a profig (flexible user profile)
4. The agent produces artifacts (health plans, nutrition guides) that render in the Transaction Layer
5. Artifacts are downloadable and portable
6. Returning users see a personalized portal based on their profig
7. Paul can log into admin, see users, review queued items, and edit protocols
8. External protocols are live at manvshealth.com/.well-known/
9. Everything runs on a single t3.medium EC2 instance
10. The experience is better than any health conversation agent that exists

---

## 14. RELATIONSHIP TO WEB 4.0

This project is separate from the `sovereign-streams` repo (which contains Web 4.0 vision docs). Forkless IMPLEMENTS many Web 4.0 concepts but is a standalone platform:

| Web 4.0 Concept | Forkless Implementation |
|-----------------|------------------------|
| Agentic Rendering (AR1) | Agent Layer — conversation-first UI generation |
| The Profig | User data in `users/*.json` |
| Live Dream Beacons | User suggestions queued for review |
| External Protocols | `.well-known/*.json` on manvshealth.com |
| Internal Protocols | `protocols/internal/` — agent knowledge and governance |
| Waystation | Future — the cloud proxy pattern (Phase 2+) |
| Convergent Syndication | Future — finding users who need MVH (Phase 2+) |
| Dream in a Box | Future — client delivery via AWS Organizations (Phase 3+) |

See [FUTURE-PHASES.md](./FUTURE-PHASES.md) for the complete roadmap.

---

*This document is the source of truth for Phase 1. When in doubt, refer here. When adding something not covered here, document the decision in /docs/decisions.md.*
