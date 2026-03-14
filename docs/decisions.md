# Decision Log

Record every architectural decision here. Especially decisions NOT to do something.

Format:
```
## [Date] — [Decision]
**Context:** Why this came up
**Decision:** What we decided
**Rationale:** Why
```

---

## 2026-03-12 — Start with t3.medium, not t3.xlarge

**Context:** The Majestic Monolith doc specified t3.xlarge (4 vCPU / 16GB RAM) at ~$130/mo.
**Decision:** Start with t3.medium (2 vCPU / 4GB RAM) at ~$30/mo.
**Rationale:** Phase 1 is a single Node.js app with one product. 4GB is plenty. Vertical scaling is trivial on EC2 — stop, change type, start. Start cheap, scale when we actually need it.

## 2026-03-12 — No frontend frameworks

**Context:** React, Vue, Svelte are industry standard for web UIs.
**Decision:** Vanilla HTML/CSS/JS for Agent Layer and Transaction Layer.
**Rationale:** The Agent Layer generates HTML via LLM. The Transaction Layer is a resource viewer. Frameworks add build steps, dependencies, and complexity with no benefit for this architecture. The AI is the framework. This is the Layer Cake philosophy.

## 2026-03-12 — SQLite before DynamoDB

**Context:** DynamoDB is the natural fit for profigs (JSON documents, flexible schema).
**Decision:** Start with SQLite or flat JSON files. Move to DynamoDB when we hit limits.
**Rationale:** SQLite runs on the monolith with zero config. JSON files are even simpler for profigs (one file per user). No AWS service to provision, no network latency. Phase 1 won't have enough users to need DynamoDB.

## 2026-03-14 — Adopt four operational patterns from Paperclip analysis

**Context:** Analyzed Paperclip (paperclip.ing) — an open-source agent orchestration framework. Their approach is "business as container" vs our "business as protocol." Only ~20% overlap, but four patterns are genuinely excellent and implementation-ready.
**Decision:** Adopt the Heartbeat Pattern, Atomic Budget Enforcement, Task-to-Goal Traceability, and Multi-Company Data Isolation. Do NOT adopt Paperclip as a dependency or framework.
**Rationale:** These are infrastructure patterns, not product opinions. They solve real problems we'll hit: background intelligence (heartbeat), cost control at scale (budget), audit trails (traceability), and multi-brand isolation (companies). Stealing patterns is cheaper than building from scratch and avoids framework lock-in. Implementation priority: Budget → Multi-Company → Heartbeat → Traceability. See docs/OPERATIONAL-PATTERNS.md for full design.
