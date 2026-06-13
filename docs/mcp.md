# MCP Server (`@glyphic/mcp-server`)

Expose Glyphic as a native tool to any [Model Context Protocol](https://modelcontextprotocol.io) client — Claude Desktop, Cursor, and others — so the model can draw diagrams directly in chat.

## Install / configure

The server runs over stdio via `npx`; no global install needed.

**Claude Desktop** — edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "glyphic": {
      "command": "npx",
      "args": ["-y", "@glyphic/mcp-server"]
    }
  }
}
```

**Cursor** — add the same server entry under your MCP settings.

Restart the client to pick up the new tool.

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

- Validates with `@glyphic/schema` first — malformed output returns a clean, fixable error (no stack traces leaked).
- Renders via `@glyphic/core`.
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
