# Forkless Architecture

## The Two-Layer Pattern

```
┌──────────────────────────────────────────────────────────┐
│                    FORKLESS PLATFORM                      │
│                                                          │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │    AGENT LAYER       │  │   TRANSACTION LAYER       │  │
│  │                      │  │                           │  │
│  │  Conversation UI     │  │   Resource Viewer         │  │
│  │  Voice or text       │  │   HTML, images, PDFs      │  │
│  │  Three modes:        │  │   Interactive docs        │  │
│  │  collapsed/min/full  │  │   Receipts, snapshots     │  │
│  │                      │  │   Portable artifacts      │  │
│  │  Grounded in:        │  │                           │  │
│  │  • Internal protocols│  │   Accumulates over time   │  │
│  │  • Profig            │  │   Downloadable/shareable  │  │
│  │  • Conversation hx   │  │                           │  │
│  └──────────┬───────────┘  └────────────▲─────────────┘  │
│             │                           │                 │
│             └───── produces artifacts ──┘                 │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              PLATFORM CORE                        │    │
│  │  Express/Fastify · LLM wrapper · Profig store     │    │
│  │  Protocol loader · Queue manager                  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              MAJESTIC MONOLITH                     │    │
│  │  Single EC2 · Direct function calls · pm2 · Caddy │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

```
User speaks/types
    │
    ▼
Agent Layer receives input
    │
    ▼
Server composes system prompt from:
  • protocols/internal/knowledge.md
  • protocols/internal/governance.md
  • protocols/internal/targets.md
  • users/{user-id}.json (profig)
  • conversation history
    │
    ▼
Anthropic API (Claude Sonnet) processes
    │
    ▼
Response returns with:
  • Conversational text → displays in Agent Layer
  • Artifacts (if any) → renders in Transaction Layer
  • Profig updates → written to user file
  • Queue items (if any) → added to action queue
```

## Key Principles

1. **The conversation IS the interface** — not a chatbot bolted onto a form
2. **Artifacts are portable records** — more than notifications, they're proof of agentic work
3. **The agent is opinionated** — grounded in real protocols, not generic instructions
4. **Start minimal, grow on preference** — features emerge from demonstrated need
5. **Direct function calls** — no internal HTTP, no message queues, no microservices
