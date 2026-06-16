# Glyphic Documentation

Glyphic turns semantic JSON into native SVG/PNG/React-Flow diagrams — for LLMs, agents, and apps. Start with the [project overview](../README.md), then dive in:

## Guides

- **[Diagram Types](./diagram-types.md)** — the schema and a minimal example for all 18 types.
- **[Styles & Aspect-Ratio Framing](./styles.md)** — the `style` presets (compact/clean/minimal/sketch) and `aspectRatio` framing.
- **[Theming, Fonts & Icons](./theming.md)** — presets, custom palettes, Google Fonts, custom `.ttf`, FontAwesome, and custom SVG icons.
- **[Examples Gallery](./examples/README.md)** — every type, rendered, with source JSON.

## Integrations

- **[Core API](./api.md)** — use `@glyphic/core` as a library (`processDiagram`).
- **[MCP Server](./mcp.md)** — wire Glyphic into Claude Desktop / Cursor.

## Concepts

Every diagram is a single JSON object with a `type` discriminator. The pipeline is:

```
validate (Zod)  →  layout (elkjs / d3 / custom)  →  scene graph  →  SVG  →  PNG (resvg)
```

- **Validation** is handled by [`@glyphic/schema`](../packages/schema); invalid input throws a precise `ZodError`.
- **Layout** is chosen per type in [`registry.ts`](../packages/core/src/registry.ts).
- **Output** is always SVG + PNG; React Flow JSON is included for graph/flow types.

All diagrams accept a shared base: `title`, `theme`, `style`, `aspectRatio`, and `exportFormat`.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) — including the 4-step recipe for adding a new diagram type.
