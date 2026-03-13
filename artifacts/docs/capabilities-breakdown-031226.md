# Man vs Health Platform Capabilities

## Viewers (3 total)
Interactive UI components that render content in the Transaction Layer.

### execute-command
- **Type:** Viewer  
- **Description:** Terminal-style UX for running scripts with arguments and streaming log output
- **Function:** Loads runners with command+args pre-filled, displays streaming output

### markdown
- **Type:** Viewer  
- **Description:** Renders markdown documents with styled output and source toggle
- **Function:** Displays markdown artifacts with clean typography and source view

### email-viewer
- **Type:** Viewer  
- **Description:** Renders email templates with preview/source toggle and metadata display
- **Function:** Previews HTML emails with template variables resolved

## Runners (2 total)
Node.js scripts executed in the ExecuteCommand viewer with streaming output.

### hello-world
- **Type:** Runner  
- **Description:** Greeting script — takes a name, logs hello in 3 languages
- **Args:** `--name` (required)
- **Function:** Demo script showing basic argument handling and output streaming

### disk-usage-monitor
- **Type:** Runner  
- **Description:** Checks disk usage, warns if any mount exceeds threshold
- **Args:** `--threshold` (default: 80)
- **Function:** System monitoring utility with configurable alerting

## Generators (1 total)
Tools that create artifacts stored in the artifacts/ directory.

### email-template-generator
- **Type:** Generator  
- **Description:** Generates SES-ready HTML email templates from a prompt via LLM
- **Output:** HTML email templates with template variables like {{name}}, {{unsubscribe_url}}
- **Auto-loads:** Generated templates automatically open in email-viewer

## Architecture Notes

- **Runners** execute in ExecuteCommand viewer with streaming logs
- **Generators** produce artifacts that load in appropriate viewers
- **Viewers** are standalone HTML UIs in the Transaction Layer
- All capabilities use CommonJS (require()), no ESM or React
- Future: Services will handle external API calls (SES, etc.)

## Current Artifacts
- `mean-clean-lean-promo` (email-template): The Fat Loss Secret They Don't Want You to Know