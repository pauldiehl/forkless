# How the Forkless Platform Works

## Architecture Overview

The Forkless platform is built around **capabilities** — reusable tools that can be runners (scripts), generators (content creators), or viewers (UIs). Everything operates through the Transaction Layer, which provides a unified interface for executing and viewing capabilities.

## Core Components

### 1. Capabilities
Four types of capabilities power the platform:

- **Runner**: Node.js scripts that execute with arguments and stream logs
- **Generator**: Creates artifacts (files) stored in the artifacts/ directory  
- **Viewer**: Standalone HTML UIs that display content
- **Service**: External API integrations (future)

### 2. Transaction Layer
The main interface where all capabilities load. Key viewers include:

- **ExecuteCommand**: Terminal-style UX for running scripts with streaming output
- **Email Viewer**: Renders email templates with preview/source toggle
- **Markdown Viewer**: Styled markdown rendering with source view

### 3. Artifacts System
Generated content is stored as artifacts with metadata:
- Unique kebab-case IDs
- Type classification (email-template, markdown-doc, etc.)
- Auto-loading in appropriate viewers
- Direct link sharing via localhost:3000/?viewer=VIEWER&artifact=ID

## Current Capabilities

### Runners
- `hello-world`: Demo script that greets in 3 languages (takes --name arg)
- `disk-usage-monitor`: Checks disk usage, warns if thresholds exceeded

### Generators  
- `email-template-generator`: Creates SES-ready HTML emails from prompts

### Current Artifacts
- `mean-clean-lean-promo`: Fat loss email template

## How It Works in Practice

1. **User makes a request** → Agent analyzes if it's conversational or requires action
2. **For existing capabilities** → Load in Transaction Layer with pre-filled args
3. **For new capabilities** → Build, register, and load immediately
4. **Long responses** → Stored as markdown artifacts, auto-loaded in viewer
5. **Compound tasks** → Compose existing capabilities when possible

## Technical Rules

### For Runners
- Plain Node.js only (CommonJS require(), no ESM, no React)
- Must accept command-line arguments
- Log output streams to ExecuteCommand viewer
- Error handling and validation built-in

### For Generators
- Produce artifacts in appropriate formats (HTML, markdown, etc.)
- Include metadata (title, description, creation date)
- Auto-load in relevant viewer after generation

### Response Protocol
- **Succinct**: 1-2 lines max for confirmations
- **Show, don't tell**: Load capabilities immediately after creating them
- **No preamble**: Skip explanations, just do and confirm
- **Deep links**: Reference viewable content with direct URLs

## Agent Reasoning Flow

Every request goes through this decision tree:

1. **Conversation or Request?** → Chat vs. action
2. **About a resource?** → Building/using something vs. general question  
3. **New or existing?** → Create capability vs. load existing
4. **Enough info?** → Build immediately vs. ask one clarifying question

## The Man vs Health Domain

This platform currently hosts the Man vs Health agent, focused on:

- Nutrition-first health guidance
- At-home solutions over medical interventions
- Education over prescription
- Personal accountability and empowerment

### Core Capabilities
- Health intake conversations
- Personalized nutrition guidance  
- Allergy/immunotherapy education
- Sleep optimization recommendations
- Doctor visit preparation

### Ethical Guardrails
- Never diagnose or treat medical conditions
- Always recommend professional care for urgent symptoms
- Work alongside existing treatment plans
- Transparent about platform limitations

## What Makes This Different

1. **Capability Composition**: Build once, reuse everywhere
2. **Immediate Execution**: No separate deployment step — create and use instantly
3. **Rich Viewers**: Purpose-built UIs for different content types
4. **Progressive Enhancement**: Capabilities get smarter over time
5. **Domain Expertise**: Specialized knowledge in specific verticals (health, etc.)

The platform emphasizes doing over talking — when you need something built, it gets built and loaded immediately so you can use it right away.