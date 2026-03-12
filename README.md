# Forkless

**"There is no fork."**

The sovereign development platform for 1,000 Hands. Built on the Majestic Monolith. Powered by Claude Code + OpenClaw.

Forkless is where the Layer Cake gets baked — the bridge between AI sprinkles on existing apps and the full agentic rendering vision of Web 4.0. It's the Agent/Transaction Layer architecture: a conversation-first agent paired with a resource viewer that renders the artifacts of agentic work.

---

## What's Here

```
forkless/
├── infra/              EC2 launch, bootstrap, snapshots, dev session
├── core/               Platform entry point
│   ├── agent-layer/    Conversation UI (collapsed / minimal / full)
│   └── transaction-layer/  Resource viewer (HTML, images, PDFs, artifacts)
├── lib/                Common library (direct function calls, NOT HTTP)
├── protocols/
│   ├── external/       .well-known/*.json — how the world sees you
│   └── internal/       Knowledge, targets, capacities, governance, metrics
├── services/           Business logic modules (built as needed)
├── users/              Profig store (flexible user profiles)
├── queue/              Action queue (founder reviews)
├── scripts/            Test and seed scripts
├── lambda/             Heavy compute offload (Phase 2+)
└── docs/               Architecture docs, decisions, handover
```

## First Deployment

**Man vs Health** — AR1 conversation experience. Four health journeys + portal + admin, rebuilt from scratch as a conversation-first agentic system.

## Philosophy

Everything on one box. Direct function calls, not HTTP APIs. Add AWS services only when you hit a real limit. Speed of iteration beats architectural purity. Start ugly, grow on preference.

See [docs/HANDOVER.md](./docs/HANDOVER.md) for the full Phase 1 plan.
See [docs/FUTURE-PHASES.md](./docs/FUTURE-PHASES.md) for what comes after.

## Related

- [sovereign-streams/web4](https://github.com/pauldiehl/sovereign-streams) — The Web 4.0 vision docs
- [protocol-explorer](https://github.com/pauldiehl/protocol-explorer) — Protocol specification and demo

---

*1,000 Hands / Paul Diehl · March 2026*
