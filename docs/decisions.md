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
