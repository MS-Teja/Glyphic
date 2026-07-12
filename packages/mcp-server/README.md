# @glyphicjs/mcp-server

The official [Model Context Protocol](https://modelcontextprotocol.io) server for [Glyphic](https://github.com/MS-Teja/Glyphic). It lets MCP-capable clients — **Claude Desktop**, **Cursor**, and others — generate diagrams as a native tool: the model emits JSON, the tool renders it, and the image comes back inline.

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

See the [full MCP guide](https://github.com/MS-Teja/Glyphic/blob/main/docs/mcp.md) for the exact per-client JSON. Restart
the client, then just ask:

> *"Draw an ERD for a blog: users, posts, and comments with the right relationships."*

The model calls `render_diagram`, the diagram is saved locally, and the PNG is returned in the conversation.

## Tools

| Tool | Description |
|---|---|
| **`get_schema`** | Returns the full JSON Schema of a diagram input, so the model knows every supported type and field. |
| **`render_diagram`** | Validates the supplied `diagram` JSON and renders it. Returns the PNG inline (and React Flow JSON when requested via `exportFormat`). |

By default, rendered files are written to **`~/Desktop/Glyphic Diagrams/`**, named
`<sanitized_title>_<timestamp>_<6-hex-chars>.png` / `.svg` / `.json`, so the model
can tell the user exactly where to find them.

Two environment variables control this:

- **`GLYPHIC_OUTPUT_DIR`** — overrides the output directory. Use an absolute
  path — many MCP clients launch the server with `cwd=/`.
- **`GLYPHIC_NO_SAVE`** — set to `1` or `true` to disable file saving entirely;
  the tool still returns the diagram inline.

If writing to disk fails (e.g. a headless or read-only environment), the server
logs a warning to stderr and still returns the diagram inline as base64 PNG —
it never fails a render just because a file couldn't be saved. On startup, the
server prints a short banner to stderr with its version, docs/issues links, and
the resolved output directory.

## Notes

- Input is validated with `@glyphicjs/schema` **before** rendering — malformed model output comes back as a clean, fixable error rather than a crash, and error messages never leak stack traces.
- Choose outputs with `exportFormat` in the diagram JSON, e.g. `"exportFormat": ["png", "svg", "react-flow"]` (defaults to `["png"]`).

See the [full MCP guide](https://github.com/MS-Teja/Glyphic/blob/main/docs/mcp.md) and the [diagram types reference](https://github.com/MS-Teja/Glyphic/blob/main/docs/diagram-types.md).

## Support

- Issues: [github.com/MS-Teja/Glyphic/issues](https://github.com/MS-Teja/Glyphic/issues)
- Docs: [github.com/MS-Teja/Glyphic/tree/main/docs](https://github.com/MS-Teja/Glyphic/tree/main/docs)
- Sponsor: [github.com/sponsors/MS-Teja](https://github.com/sponsors/MS-Teja)

## License

MIT
