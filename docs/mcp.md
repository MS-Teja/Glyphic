# MCP Server (`@glyphicjs/mcp-server`)

Expose Glyphic as a native tool to any [Model Context Protocol](https://modelcontextprotocol.io) client — Claude Desktop, Cursor, and others — so the model can draw diagrams directly in chat.

## Install / configure

The server runs over **stdio** via `npx` — no global install, no process to keep
running. Add Glyphic to your client's MCP config, then restart the client.

Most clients share the same `command` / `args` under a top-level `mcpServers`
key; what differs is *where* the config lives and a couple of key names. Pick
your client below.

### Claude Desktop

`claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "glyphic": { "command": "npx", "args": ["-y", "@glyphicjs/mcp-server"] }
  }
}
```

Fully quit Claude (⌘Q) and reopen — it only reloads MCP servers on a cold start.

### Claude Code

One command in your terminal:

```bash
claude mcp add glyphic -- npx -y @glyphicjs/mcp-server
```

Add `--scope user` to make it available in every project (default is the current
project only). The `--` separates Claude Code's own flags from the server command.

### Cursor

`.cursor/mcp.json` in your project, or `~/.cursor/mcp.json` for all projects:

```json
{
  "mcpServers": {
    "glyphic": { "command": "npx", "args": ["-y", "@glyphicjs/mcp-server"] }
  }
}
```

Then enable it under **Settings → MCP**.

### VS Code (Copilot agent mode)

`.vscode/mcp.json` — note the top-level key is `servers` (not `mcpServers`), and
`type` is required:

```json
{
  "servers": {
    "glyphic": { "type": "stdio", "command": "npx", "args": ["-y", "@glyphicjs/mcp-server"] }
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "glyphic": { "command": "npx", "args": ["-y", "@glyphicjs/mcp-server"] }
  }
}
```

Reload the MCP servers from Cascade after saving.

### Antigravity

`~/.gemini/config/mcp_config.json` (or open **Manage MCP Servers → View raw
config** in the agent panel):

```json
{
  "mcpServers": {
    "glyphic": { "command": "npx", "args": ["-y", "@glyphicjs/mcp-server"] }
  }
}
```

> Glyphic needs Node and `npx` on your `PATH`; the first run downloads the package.
> Restart — or fully quit and reopen — the client after editing its config.

## Using it

Just ask in natural language:

> *"Draw a C4 context diagram for an internet banking system with a customer, the banking system, a mainframe, and an email system."*

The model:

1. Calls **`get_schema`** (if it needs the exact field shapes).
2. Emits a JSON diagram and calls **`render_diagram`**.
3. Receives the PNG inline and a note about where the files were saved.

## Tools

### `get_schema`

No arguments. Returns the full JSON Schema for a diagram input, so the model knows every supported `type` and field.

### `render_diagram`

| Argument | Description |
|---|---|
| `diagram` | A diagram object conforming to [`DiagramInput`](./diagram-types.md). Validated before rendering. |

Behavior:

- Validates with `@glyphicjs/schema` first — malformed output returns a clean, fixable error (no stack traces leaked).
- Renders via `@glyphicjs/core`.
- Returns the PNG as an inline image; includes React Flow JSON in the text response when `exportFormat` requests `"react-flow"`.
- Saves files to **`~/Desktop/Glyphic Diagrams/`** as `<title>_<timestamp>.png` / `.svg` / `_react_flow.json`.

## Choosing outputs

Set `exportFormat` inside the diagram JSON (defaults to `["png"]`):

```json
{
  "diagram": {
    "type": "flowchart",
    "exportFormat": ["png", "svg", "react-flow"],
    "nodes": [{ "id": "a", "label": "Start" }],
    "edges": []
  }
}
```

## Troubleshooting

- **Tool not appearing** — fully quit and reopen the client after editing the config; check JSON validity.
- **Nothing renders** — ensure `npx` can reach npm; the first run downloads the package.
- **Where are my files?** — `~/Desktop/Glyphic Diagrams/`. The assistant also prints the exact paths.
