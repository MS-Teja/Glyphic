# MCP Server

Glyphic's [Model Context Protocol](https://modelcontextprotocol.io) server exposes diagram rendering as a native tool to any MCP-capable client — Claude Desktop, Claude Code, Cursor, and others — so the model can draw diagrams directly in chat.

> Prefer zero local setup? A hosted MCP server (HTTP, API key) is available from your account at [glyphic.web.app](https://glyphic.web.app) — no `npx`, no local config. The rest of this page covers the free local stdio server.

## Quick install

```bash
claude mcp add glyphic -- npx -y @glyphicjs/mcp-server
```

Or add this to your client's MCP config:

```json
{
  "mcpServers": {
    "glyphic": { "command": "npx", "args": ["-y", "@glyphicjs/mcp-server"] }
  }
}
```

The server runs over **stdio** via `npx` — no global install, no process to keep
running. See [Per-client setup](#per-client-setup) below for exactly where each
client's config lives.

## Per-client setup

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
3. Receives the PNG inline and a note about where the files were saved (if saving succeeded).

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
- Saves files locally per the rules in [Output files](#output-files) below.

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

## Output files

By default, `render_diagram` writes rendered files to **`~/Desktop/Glyphic Diagrams/`**,
named `<sanitized_title>_<timestamp>_<6-hex-chars>.png` / `.svg` / `.json`.

Two environment variables control this:

- **`GLYPHIC_OUTPUT_DIR`** — overrides the output directory. Set it to an
  **absolute path** — many MCP clients launch the server with `cwd=/`, so a
  relative path won't resolve where you expect.
- **`GLYPHIC_NO_SAVE`** — set to `1` or `true` to disable file saving entirely;
  the tool still returns the diagram inline.

Set them in the `env` block of your client's MCP config, alongside `command` / `args`:

```json
{
  "mcpServers": {
    "glyphic": {
      "command": "npx",
      "args": ["-y", "@glyphicjs/mcp-server"],
      "env": { "GLYPHIC_OUTPUT_DIR": "/path/to/diagrams" }
    }
  }
}
```

If writing to the output directory fails — for example, in a headless or
read-only environment — the server logs a warning to stderr and still returns
the diagram inline as base64 PNG. It never fails a render just because a file
couldn't be written to disk.

On startup, the server prints a short banner to stderr with its version, links
to docs/issues, and the resolved output directory, so you can always confirm
where it's writing.

## Troubleshooting

- **Tool not appearing** — fully quit and reopen the client after editing the config; check JSON validity.
- **Nothing renders** — ensure `npx` can reach npm; the first run downloads the package.
- **Where are my files?** — `~/Desktop/Glyphic Diagrams/` by default, or wherever `GLYPHIC_OUTPUT_DIR` points. Check the startup banner on stderr for the resolved directory. If `GLYPHIC_NO_SAVE` is set, nothing is written to disk — the diagram is still returned inline in the conversation.
