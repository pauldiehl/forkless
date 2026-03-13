# Forkless Platform Architecture & Operation Guide

## Overview

Forkless is a capability-driven platform where agents can create, register, and compose different types of functionality. The architecture is built around four core component types that work together to provide a rich interactive experience.

## Component Architecture

### 1. Runners (Node.js Scripts)
- **Purpose**: Executable scripts that perform tasks
- **Technology**: Plain Node.js with CommonJS (`require()`)
- **Execution**: Runs in the ExecuteCommand viewer with streaming logs
- **Examples**: System monitoring, data processing, file operations
- **Key Constraint**: No ESM imports, no React - pure Node.js only

### 2. Generators (Artifact Creators)
- **Purpose**: Create structured content/files stored as artifacts
- **Output**: Files stored in `artifacts/` directory
- **Examples**: Email templates, reports, configuration files
- **Integration**: Generated artifacts automatically load in appropriate viewers

### 3. Viewers (UI Components)
- **Purpose**: Display and interact with content
- **Technology**: Standalone HTML applications
- **Current Viewers**:
  - `execute-command`: Terminal-style interface for running scripts
  - `markdown`: Styled markdown renderer with source toggle
  - `email-viewer`: Email template preview with metadata
- **Loading**: Via deep links or automatic artifact association

### 4. Services (External Integrations)
- **Purpose**: Connect to external APIs and services
- **Status**: Future capability
- **Examples**: SES email sending, payment processing, data APIs

## Current Capabilities

### Registered Capabilities
- **hello-world** (runner): Multi-language greeting script with name parameter
- **disk-usage-monitor** (runner): System disk usage checker with threshold warnings
- **email-template-generator** (generator): LLM-powered HTML email template creation

### Active Artifacts
- **mean-clean-lean-promo** (email-template): Health/fitness promotional email
- **capabilities-breakdown-031226** (markdown): Platform capability documentation
- **forkless-platform-guide** (markdown): User guide documentation

## Transaction Layer

The Transaction Layer is Forkless's unified interface that dynamically loads different viewers based on the content type and user action.

### Deep Link Format
```
localhost:3000/?viewer=VIEWER_NAME&artifact=ARTIFACT_ID
```

### Auto-Loading Behavior
- Generators automatically trigger appropriate viewers
- Email templates → email-viewer
- Markdown documents → markdown viewer
- Runners → ExecuteCommand with pre-filled parameters

## Agent Interaction Patterns

### Reasoning Protocol
Every agent follows a 4-step decision tree:
1. **Conversation vs Request**: Determine if action is needed
2. **Resource Type**: Building new vs using existing
3. **Existence Check**: New capability vs existing capability
4. **Information Sufficiency**: Build immediately vs ask for clarification

### Response Rules
- **Succinct**: 1-2 lines maximum for confirmations
- **Action-Oriented**: Show don't tell - load relevant UI immediately
- **Deep Links Required**: Always provide localhost:3000 URLs for artifacts
- **Long Content Rule**: >5 lines or structured data must use `generate_markdown`

## Man vs Health Agent

The current active agent specializes in health and nutrition guidance with these characteristics:

### Domain Focus
- Nutrition-first approach to health
- At-home solutions and low-intervention methods
- Education over prescription
- Personal accountability and consistency

### Capabilities
- Health intake conversations
- Nutrition guidance and meal planning
- Allergy education and immunotherapy awareness
- Sleep optimization recommendations
- Personalized health plan generation

### Ethical Constraints
- No medical diagnosis or prescription
- Always encourage professional medical consultation when appropriate
- Transparent about limitations and scope
- Privacy-focused data handling

## Development Patterns

### Creating New Runners
```javascript
// Use create_runner function with:
// - Unique kebab-case ID
// - CommonJS require() syntax only
// - Command-line argument handling
// - Error handling and logging
```

### Creating New Generators
```javascript
// Use appropriate generator function (e.g., generate_email_template)
// - Unique artifact ID
// - Appropriate content format
// - Metadata for viewer display
```

### Viewer Integration
- Viewers auto-detect content type
- Deep links enable direct access
- Source/preview toggles for development
- Responsive design for various screen sizes

## Future Roadmap

### Planned Enhancements
- Service layer for external API integration
- User authentication and profig management
- Real-time collaboration features
- Enhanced artifact versioning
- Mobile-optimized viewers

### Extension Points
- Custom viewer development
- Agent specialization system
- Plugin architecture for domain-specific tools
- API endpoints for third-party integration

## Best Practices

### For Agents
- Always register new functionality as capabilities
- Use compound capabilities when possible
- Provide immediate feedback through UI loading
- Follow the mandatory deep link pattern

### For Development
- Keep runners simple and focused
- Design viewers for reusability
- Maintain clear separation between data and presentation
- Document capabilities thoroughly

### For Users
- Bookmark deep links for frequently used artifacts
- Use the Transaction Layer as the primary interface
- Leverage agent reasoning for complex tasks
- Provide feedback for continuous improvement