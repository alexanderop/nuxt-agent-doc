# Context

Domain vocabulary for this project. Each term has one meaning; use it consistently in code, comments, and commits. Add a term the first time it earns a name.

## Glossary

**Tool renderer**
Client-side counterpart to a server-side MCP tool. Defines how a tool's `UIMessage` part is displayed in chat — either as a chip (icon + streaming/done text, with an optional result component below) or as a takeover (a component that owns the entire render, e.g. `code`). Keyed by tool name. Lives in one registry; the dispatcher in `ChatContent` looks up by `getToolName(part)` and falls back to a generic chip.
