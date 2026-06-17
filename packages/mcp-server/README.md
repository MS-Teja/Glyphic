# @glyphicjs/mcp-server

The official [Model Context Protocol](https://modelcontextprotocol.io) server for [Glyphic](../../README.md). It lets MCP-capable clients — **Claude Desktop**, **Cursor**, and others — generate diagrams as a native tool: the model emits JSON, the tool renders it, and the image comes back inline.

## Setup

The server runs over **stdio** via `npx` — no global install. Add this entry to
your client's MCP config:

```json
{
  "mcpServers": {
    "glyphic": {
      "command": "npx",
      "args": ["-y", "@glyphicjs/mcp-server"]
    }
  }
}
```

Most clients use exactly that; the difference is *where* the config lives and a
couple of key names:

| Client | Config location | Notes |
|---|---|---|
| **Claude Desktop** | `claude_desktop_config.json` | Fully quit (⌘Q) and reopen. |
| **Claude Code** | — | `claude mcp add glyphic -- npx -y @glyphicjs/mcp-server` |
| **Cursor** | `.cursor/mcp.json` (or `~/.cursor/mcp.json`) | Enable under Settings → MCP. |
| **VS Code** | `.vscode/mcp.json` | Top-level key is `servers`; add `"type": "stdio"`. |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` | Reload servers from Cascade. |
| **Antigravity** | `~/.gemini/config/mcp_config.json` | Or Manage MCP Servers → View raw config. |

See the [full MCP guide](../../docs/mcp.md) for the exact per-client JSON. Restart
the client, then just ask:

> *"Draw an ERD for a blog: users, posts, and comments with the right relationships."*

The model calls `render_diagram`, the diagram is saved locally, and the PNG is returned in the conversation.

## Tools

| Tool | Description |
|---|---|
| **`get_schema`** | Returns the full JSON Schema of a diagram input, so the model knows every supported type and field. |
| **`render_diagram`** | Validates the supplied `diagram` JSON and renders it. Returns the PNG inline (and React Flow JSON when requested via `exportFormat`). |

Rendered files are written to **`~/Desktop/Glyphic Diagrams/`** (`<title>_<timestamp>.png` / `.svg` / `_react_flow.json`), so the model can tell the user exactly where to find them.

## Notes

- Input is validated with `@glyphicjs/schema` **before** rendering — malformed model output comes back as a clean, fixable error rather than a crash, and error messages never leak stack traces.
- Choose outputs with `exportFormat` in the diagram JSON, e.g. `"exportFormat": ["png", "svg", "react-flow"]` (defaults to `["png"]`).

See the [full MCP guide](../../docs/mcp.md) and the [diagram types reference](../../docs/diagram-types.md).

## License

MIT
