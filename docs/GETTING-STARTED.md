# Getting Started with Forkless

## What is Forkless?

Forkless is a conversational commerce engine. It provides two layers:

1. **Agent Layer** — A conversation UI where users talk to an AI agent grounded in your domain knowledge
2. **Transaction Layer** — A resource viewer that renders the artifacts your agent produces

Together they create a conversation-first experience where the UI materializes around what the conversation discovers.

## Setup

### 1. Install

```bash
git clone https://github.com/pauldiehl/forkless.git my-project
cd my-project
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3000
```

### 3. Configure Your Project

```bash
cp project.json.example project.json
```

Edit `project.json`:
```json
{
  "name": "Your Brand Name",
  "slug": "your-brand",
  "description": "What your brand does",
  "theme": "default",
  "protocols": "./protocols/internal/",
  "port": 3000
}
```

### 4. Write Your Protocols

The protocols in `protocols/internal/` are what make your agent opinionated. Edit each:

- **knowledge.md** — Your domain expertise. What does your brand know deeply?
- **targets.md** — Who you serve. What are their pain points?
- **governance.md** — Rules of engagement. Ethical guardrails. Communication style.
- **capacities.md** — What your agent can do right now. What it can't.
- **reasoning.md** — How the agent thinks (usually keep the default).

### 5. Run

```bash
npm start
# → http://localhost:3000
```

## Architecture

```
User ←→ Agent Layer (conversation) ←→ Claude API
                ↕
        Transaction Layer (artifacts viewer)
                ↕
    Capabilities (runners) + Artifacts (generated content)
```

### Agent Layer Modes

- **Collapsed** — Floating button, transaction layer gets full viewport
- **Minimal** — Bottom half, conversation visible
- **Full** — Full overlay, conversation dominates

### Transaction Layer

Renders whatever the agent produces:
- HTML pages, reports, plans
- Markdown documents
- Email templates
- Interactive tools (runners)
- Images, PDFs

### Capabilities

Registered tools the agent can create and use:
- **Runners** — Node.js scripts executed in the UI
- **Viewers** — HTML UIs that display artifacts
- **Generators** — Produce stored artifacts

### Artifacts

Generated content stored on disk:
- Each artifact has an ID, type, and file path
- Registered in `artifacts/registry.json`
- Viewable via deep links: `/?viewer=TYPE&artifact=ID`

## Adding to Your Project

### Custom Themes

Create `core/themes/my-theme.json`:
```json
{
  "name": "My Theme",
  "colors": {
    "primary": "#6366f1",
    "background": "#101014",
    "surface": "#18181b",
    "text": "#fafafa"
  }
}
```

Reference in `project.json`: `"theme": "my-theme"`

### External Protocols (Web 4.0)

Place `.well-known/*.json` files in `protocols/external/` to make your brand discoverable:
- `governance.json` — What you are, what you value
- `haves.json` — What you offer
- `needs.json` — What you need
- `payments.json` — How you exchange value

## Example: Man vs Health

See `examples/mvh/` for a complete example of a health platform built on Forkless, including domain knowledge, governance, theme, and a full handover document.

---

*For architecture details, see [architecture.md](./architecture.md)*
