# Forkless — Future Phases

**Beyond Phase 1: The Road from Self-Adopting to Self-Propagating**
**Author:** Paul Diehl (1,000 Hands / Milliprime) & Claude (Anthropic)
**Date:** March 2026
**Status:** DO NOT EXECUTE YET — This is the blueprint for what comes after Phase 1

---

> Phase 1 is the foundation: one EC2, one product (Man vs Health), one agent, one transaction layer. Everything that follows builds on that foundation without breaking it. Each phase is triggered by a real constraint or opportunity, not by anticipation.

---

## The Maturity Model

Forkless follows a three-stage maturity path. Each stage unlocks new capabilities and new kinds of value.

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  SELF-ADOPTING              SELF-DEVELOPING           SELF-PROPAGATING │
│  (Phase 1)                  (Phases 2-3)              (Phases 4-5)     │
│                                                                        │
│  Stand up identity          Build with the platform   Deliver to others│
│  Deploy governance          Multiple products         Dream in a Box   │
│  Ground the agent           Agent marketplace         Client graduation│
│  Prove the pattern          Waystation architecture   Coalition growth │
│                                                                        │
│  "I exist and I             "I build on what          "I give this to  │
│   know what I do"            I've built"               others"         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Self-Adopting (Phase 1 — NOW)

You stand up your sovereign identity. You deploy protocols. You ground your agent in opinionated knowledge. You prove the Agent/Transaction Layer pattern works with a real product (Man vs Health). You learn what the system needs by building for yourself first.

This is where you get good at the pattern.

### Self-Developing (Phases 2-3)

The platform becomes productive. You run multiple products on it. The Waystation goes live (your always-on cloud proxy). The internal protocol library grows rich. New services spin up as modules within the monolith. The agent gets smarter because it has more knowledge, more profigs, more conversation history to draw from.

This is where the platform earns its name.

### Self-Propagating (Phases 4-5)

You deliver the pattern to others. Dream in a Box: build a complete business system for a client, deliver it with seed capital, run it on your infrastructure, graduate them to independence. The Coalition grows because you can hand someone a working system, not a pitch deck.

This is where sovereignty scales.

---

## Phase 2: Multi-Product + Infrastructure Hardening

**Trigger:** Phase 1 is running, MVH has real users, and you want to build a second product.

### What Gets Built

**Good Vibes on Forkless** — The second product deployment. Session-based media streaming with governance protocols. Proves the platform supports more than one service.

**Shared Protocol Library** — Internal protocols that apply across products get extracted to a shared location. Health knowledge stays in MVH. Communication style, ethical guardrails, and governance patterns become platform-level.

**Database Migration** — If SQLite hits limits, move to DynamoDB or RDS Postgres. The `lib/db.js` wrapper means application code barely changes — just swap the connection.

**S3 Integration** — When artifacts (PDFs, images, health plans) outgrow local disk. Add `lib/storage.js` wrapper. Artifacts get stored in S3 with metadata in the database.

**Scheduler** — Background jobs for: profig maintenance, metric computation, dream beacon triage, protocol updates. Use pm2 cron or a simple Node scheduler. No AWS Step Functions yet.

### Infrastructure Changes

| Change | Trigger | Cost Impact |
|--------|---------|-------------|
| t3.medium → t3.large (or xlarge) | Memory/CPU contention | +$30-100/mo |
| Add DynamoDB | SQLite performance limits | ~$5-25/mo (on-demand) |
| Add S3 | Disk filling with artifacts | ~$5/mo initially |
| Add SES | Email notifications needed | ~$0.10/1000 emails |

### Scaling Exit Ramp (from Majestic Monolith doc)

| Phase | Trigger | Action |
|-------|---------|--------|
| DB | Disk or DB contention | Move to RDS. App code barely changes (connection string) |
| Files | Disk filling with uploads | Move to S3. Add storage.js wrapper |
| Compute | Heavy jobs slowing instance | Move to Lambda via SAM. Already in /lambda/ folder |
| Scale out | Traffic outgrowing one box | AMI snapshot → second instance → ALB in front |
| Split | Module needs independent deploy | Extract to separate service |

Each phase is triggered by a real constraint. Document the trigger in `/docs/decisions.md`.

---

## Phase 3: The Waystation

**Trigger:** You need always-on availability even when the EC2 is down, or you want public-facing agent interactions that don't require the monolith to be running.

### What Is the Waystation

The Waystation is your sovereign cloud proxy — an always-on serverless endpoint that handles ~80% of interactions without touching your EC2. It sits between the public internet and your local machine.

```
Public Internet
      │
      ▼
┌─────────────────────┐
│    WAYSTATION        │    ← Lambda + API Gateway + DynamoDB
│    (always on)       │       Handles: discovery, protocol exchange,
│                      │       simple queries, queuing, auto-responses
│    ~80% handled here │
└─────────┬───────────┘
          │ ~20% forwarded
          ▼
┌─────────────────────┐
│    FORKLESS EC2      │    ← Your Majestic Monolith
│    (your machine)    │       Handles: deep conversations, artifact
│                      │       generation, admin, complex decisions
└─────────────────────┘
```

### What the Waystation Handles

- **Discovery**: responds to `.well-known/*` protocol requests
- **Protocol exchange**: serves governance, haves, needs, payments
- **Simple queries**: answers basic questions using cached knowledge
- **Queue management**: accepts inbound messages, queues for processing
- **Auto-responses**: LLM-powered responses for routine interactions
- **Health checks**: confirms your sovereign identity is live

### What Gets Forwarded to EC2

- Deep agent conversations requiring full profig access
- Artifact generation (health plans, reports, interactive docs)
- Admin operations
- Complex decisions requiring full internal protocol access
- Anything the Waystation LLM isn't confident about

### Technology

| Component | Service | Cost |
|-----------|---------|------|
| API endpoint | API Gateway | ~$3.50/million requests |
| Logic | Lambda (Node.js) | ~$0.20/million invocations |
| Storage | DynamoDB | ~$1.25/million writes |
| LLM | Anthropic API (Haiku for simple, Sonnet for complex) | ~$0.25-2/1000 requests |

Total for moderate traffic: $10-30/month.

### Architecture Reference

Full Waystation architecture documented in [sovereign-streams/web4/WAYSTATION-ARCHITECTURE.md](https://github.com/pauldiehl/sovereign-streams).

---

## Phase 4: Dream in a Box — Client Delivery

**Trigger:** The platform is stable, you've built at least one business system for yourself, and you've identified your first client.

### The Vision

Dream in a Box is the delivery mechanism for 1KH client business systems:

1. **You build the dream** — a complete business system for a target client, on your infrastructure
2. **You deliver it with seed capital** — real value, real money, before they've paid a dollar
3. **This buys trust** — they're a success story before they're a customer
4. **They run on your infra initially** — low cost, your management
5. **When they grow, they graduate** — to their own AWS account, their own data, their own company

This is the trojan horse: by delivering the dream first, you earn the right to onboard them to your ecosystem.

### AWS Organizations Structure

```
Management Account (paul@jemini.io)
├── YOUR Organizational Unit
│   └── Your monolith EC2, your apps, your tooling
│
├── Clients OU
│   ├── Client A Account (client-a@1kh.io)
│   │   └── t3.medium EC2 — their instance, your code, their data
│   ├── Client B Account
│   └── Client C Account
│
└── Graduated OU (transitional — accounts leaving org)
    └── Client A (moving to standalone) — 30 day transition
```

### Client Lifecycle

**Phase A — Subdomain on Your Monolith**
First clients start on your box. `client-a.yourplatform.com` reverse-proxied to a separate pm2 process. Traffic is low, cost is near zero, iteration is fast.

**Phase B — Own EC2 in Child Account**
When the client has real users and real revenue, graduate them to their own EC2 in a child AWS account. Their data stays on their instance. You manage it remotely via `OrganizationAccountAccessRole`.

**Phase C — Full Graduation**
The client is growing. They want their own domain, their own account, full ownership. One AWS Organizations call removes them from your org. All their resources stay exactly where they are. Billing transfers. You hand them the keys. Clean break.

### Cost Model Per Client

| Item | Monthly Cost |
|------|-------------|
| t3.medium EC2 | ~$30 |
| 20GB gp3 EBS | ~$2 |
| Elastic IP | ~$0 (when attached) |
| Data transfer | ~$3 |
| **Total** | **~$35-50/mo** |

A $99/mo service subscription covers 2x the infrastructure cost with margin.

### Build This When

You are onboarding your second client. Client #1 teaches you what to parameterize. Don't pre-build the client bootstrap script — build it from actual experience.

---

## Phase 5: Coalition + Convergent Syndication

**Trigger:** Multiple products running, multiple clients served, the protocol ecosystem is maturing.

### What Gets Built

**Agent-to-Agent Communication** — Your Waystation talks to other Waystations. Coalition members' agents negotiate with yours via governance protocols. "I'll have my people talk to your people" — at machine speed.

**Convergent Syndication** — Finding users who need your products through protocol-level discovery. Not marketing. Not ads. Agents finding agents. A user's agent discovers that MVH's health protocols match what the user has been asking for → connection happens automatically.

**The Agent Exchange** — The decentralized marketplace where agents build trust through on-chain transaction history. Your products are discoverable. Your reputation is verifiable. Your governance is transparent.

**Multi-Agent Support** — Users bring their own agents. The governance protocol guides what the experience should be. The user's agent interprets it. Different users get different experiences from the same provider.

### Relationship to Web 4.0

This is where Forkless becomes a full Web 4.0 implementation:

| Web 4.0 Concept | Phase 5 Implementation |
|-----------------|----------------------|
| Encounters | Agent-to-agent P2P interactions with Coalition members |
| Convergent Syndication | Protocol-level user discovery |
| Agent Exchange | Trust marketplace for agent reputation |
| Agentic Rendering | User's agent generates their own UI from your governance protocol |
| Self-Sovereign Trust | Transaction history as trust signal |

---

## The Longer Horizon

### Lambda for Heavy Compute

When agent conversations need to process images (food photos for nutrition analysis), generate video (personalized health visualizations), or run batch jobs (aggregate analytics across profigs), offload to Lambda via SAM. The `/lambda/` directory is already in the project structure, waiting for concrete need.

### CloudFormation / SAM Templates

When the infrastructure becomes complex enough to warrant infrastructure-as-code:
- EC2 + security groups + Elastic IP
- DynamoDB tables
- Lambda functions + API Gateway
- S3 buckets + policies
- IAM roles

Not needed until Phase 3-4. Manual setup is fine for Phase 1-2.

### The Forkless SDK

If the pattern proves out, extract it: a toolkit for anyone to stand up their own Agent/Transaction Layer platform. The conversation UI, the artifact viewer, the profig system, the protocol structure — packaged as a starting point.

This is the Self-Propagating endgame: not just delivering dreams to clients, but giving them the ability to deliver dreams to their own clients.

---

## Phase Triggers Summary

| Phase | Trigger | Key Deliverable |
|-------|---------|----------------|
| **1 (NOW)** | You exist | MVH on Forkless, Agent/Transaction Layer, profig, protocols |
| **2** | MVH has real users, second product needed | Good Vibes, DB migration, S3, scheduler |
| **3** | Need always-on availability | Waystation (serverless proxy) |
| **4** | First client identified | Dream in a Box, AWS Organizations, client delivery |
| **5** | Coalition growing, protocol ecosystem maturing | Agent Exchange, Convergent Syndication, multi-agent |

Each phase teaches you something the next phase needs. Trust the sequence. Don't build Phase 3 infrastructure during Phase 1. Document the urge in `/docs/decisions.md` and move on.

---

## Architecture Reference Documents

- [sovereign-streams/web4/WAYSTATION-ARCHITECTURE.md](https://github.com/pauldiehl/sovereign-streams) — Three-layer node infrastructure
- [sovereign-streams/web4/AGENTIC-RENDERING.md](https://github.com/pauldiehl/sovereign-streams) — Full agentic rendering architecture + AR1
- [sovereign-streams/web4/AGENTIC-PROGRESSION.md](https://github.com/pauldiehl/sovereign-streams) — Four stages: Engineering → Rendering → Execution → Self-Actualization
- [sovereign-streams/web4/COALITION.md](https://github.com/pauldiehl/sovereign-streams) — Coalition model, Encounters, radical generosity
- [sovereign-streams/web4/CONVERGENT-SYNDICATION.md](https://github.com/pauldiehl/sovereign-streams) — How products find users
- [sovereign-streams/web4/PRODUCT-PORTFOLIO.md](https://github.com/pauldiehl/sovereign-streams) — Full product lineup and priorities

---

*Each phase here will get its own detailed handover document when the time comes. For now, focus on Phase 1. Get MVH running on Forkless. Everything else follows.*
