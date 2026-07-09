<div align="center">
  <h1>Glyphic</h1>
  <p><b>AI agents can generate diagrams from structured JSON — without touching SVG.</b></p>
  <p>Typed JSON in, beautiful native SVG &amp; PNG out, across 18 diagram types. Built for LLMs and autonomous agents — no fragile DSL, no headless browser.</p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@glyphicjs/core"><img src="https://img.shields.io/npm/v/@glyphicjs/core?label=%40glyphicjs%2Fcore&color=e2502f" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@glyphicjs/mcp-server"><img src="https://img.shields.io/npm/v/@glyphicjs/mcp-server?label=mcp-server&color=e2502f" alt="mcp-server npm version" /></a>
  <a href="https://www.npmjs.com/package/@glyphicjs/core"><img src="https://img.shields.io/npm/dm/@glyphicjs/core?label=downloads&color=222" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/license-FSL%20%2F%20MIT-222" alt="License: FSL / MIT" />
</p>

<p align="center">
  <a href="https://glyphic.web.app/generate">Live playground</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="./docs/examples/README.md">Examples Gallery</a> ·
  <a href="./docs/README.md">Documentation</a> ·
  <a href="#supported-diagrams">18 Diagram Types</a>
</p>

> **Add it to your AI agent in 30 seconds** — it runs over stdio via `npx`, no install:
>
> ```bash
> # Claude Code
> claude mcp add glyphic -- npx -y @glyphicjs/mcp-server
> ```
>
> For Cursor, Claude Desktop, VS Code, Windsurf, and Antigravity, see the [MCP setup guide](./docs/mcp.md). Then just ask: *“Draw an ERD for a blog with users, posts, and comments.”*

<p align="center">
  <img src="./docs/examples/00_sketch_architecture.png" alt="Sketch architecture diagram" width="480" />
  <img src="./docs/examples/00_freeform_canvas.png" alt="Freeform canvas dashboard" width="360" />
</p>

---

## What

**Glyphic is infrastructure for generating diagrams from structured data.** You give it a strict, semantic JSON document — arrays of `nodes` and `edges`, or `entities`, or `commits` — and it returns a polished diagram as:

- **SVG** — pure, scalable vector markup (accessible: `role="img"` + `<title>`).
- **PNG** — high-resolution raster, rendered natively via Rust (`@resvg/resvg-js`).
- **React Flow JSON** — nodes/edges mapped for an interactive React Flow canvas.

It supports **18 diagram types** (architecture, sequence, ERD, UML class, state machines, flowcharts, Gantt, timelines, Sankey, Git trees, mindmaps, pie, quadrant, user journeys, Kanban, C4, treemaps, and a freeform canvas) behind a single validated schema.

You can use it three ways: as a **library** (`@glyphicjs/core`), as an **MCP server** (so Claude Desktop / Cursor can draw diagrams as a native tool), or as a **self-hosted HTTP API**.

## Why

If an LLM needs to produce a diagram today, it has three bad options:

1. **Draw raw SVG/Canvas.** LLMs have no visual cortex — ask one to place nodes by absolute coordinate and they overlap, text overflows, and connectors cut straight through other shapes.
2. **Emit a DSL like Mermaid.** Mermaid's syntax is finicky (`-->|label|`) and a single typo crashes the whole render. It also relies on a **headless browser (Puppeteer)** to run its layout, which is slow, heavy, and awkward to run server-side.
3. **Use a closed SaaS feature like Claude Artifacts or Eraser.** They draw beautiful diagrams, but they are completely vendor-locked. You can't `npm install` them, run them in a CI pipeline, embed them in your own product, or use them with local open-source LLMs.

**Glyphic separates _semantics_ (what the diagram means) from _visuals_ (where things are drawn):**

- **Machine-first JSON, not a DSL.** The API surface is a strict [Zod](https://zod.dev) schema. Models emit ordinary JSON arrays — no fragile grammar to get wrong, and validation errors come back as precise, fixable messages instead of a crash.
- **Real layout engines, no DOM.** Routing, intersections, and sizing are computed by mathematical graph engines ([`elkjs`](https://github.com/kieler/elkjs) for graphs, [`d3-hierarchy`](https://github.com/d3/d3-hierarchy)/`d3-sankey` for data) — never a browser.
- **Native rasterization.** SVG is compiled to PNG by Rust (`@resvg/resvg-js`) directly in Node. Fast, light, and deployable anywhere — no Chromium.

The result: agents produce **correct, good-looking diagrams on the first try**, and you run it as a normal Node dependency.

## How

Pick the integration that fits you.

### 1. As a library

```bash
npm install @glyphicjs/core @glyphicjs/schema
```

```typescript
import { processDiagram } from "@glyphicjs/core";
import { writeFileSync } from "node:fs";

const result = await processDiagram({
  type: "architecture",
  title: "Web App",
  nodes: [
    { id: "web", label: "Web App", shape: "rounded", icon: "fab-react" },
    { id: "api", label: "API", shape: "hexagon", icon: "fas-bolt" },
    { id: "db", label: "PostgreSQL", shape: "database", icon: "fas-database" }
  ],
  edges: [
    { source: "web", target: "api", label: "REST" },
    { source: "api", target: "db", label: "SQL" }
  ]
});

writeFileSync("diagram.png", result.png);   // Buffer (high-res PNG)
writeFileSync("diagram.svg", result.svg);   // string (scalable SVG)
console.log(result.reactFlow);              // interactive React Flow JSON
```

See the [Core API reference](./docs/api.md).

### 2. As an MCP server (Claude Desktop / Cursor)

Add it to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "glyphic": { "command": "npx", "args": ["-y", "@glyphicjs/mcp-server"] }
  }
}
```

Restart Claude Desktop and ask: *"Draw an architecture diagram of a React app behind an AWS load balancer talking to 3 Node services and a Postgres database."* Claude emits the JSON, calls the tool, and the rendered PNG appears inline. See the [MCP guide](./docs/mcp.md).

---

## Features

- 🧩 **18 diagram types** behind one validated schema — [see them all](#supported-diagrams).
- 🎨 **Theming** — built-in presets (`"theme": "dark"`, plus `light` / `pastel` / `mono`) or a full custom palette. [Theming guide](./docs/theming.md).
- 🖌️ **Styles** — visual personality presets: `"style": "compact"` (default), `clean`, `minimal`, or hand-drawn `sketch`. [Styles guide](./docs/styles.md).
- 📺 **Aspect-ratio framing** — auto-fits diagrams to clean 16:9 / 9:16 frames (or set `"aspectRatio"`), by padding — never cropping.
- 🔤 **Fonts** — any Google Font (`"fontFamily": "Outfit"`) or your own `.ttf`.
- 🖼️ **Native icons** — drop in any FontAwesome icon (`"icon": "fas-database"`, `"icon": "fab-aws"`) or your own SVG via `customIcons`.
- 📐 **Real layout** — `elkjs` + `d3` compute routing, nesting (VPCs/clusters), and crow's-foot/UML markers with no overlaps.
- ⚡ **Native PNG** — Rust rasterization, no headless browser.
- ♿ **Accessible output** — every SVG ships with `role="img"` and a `<title>`.
- 🔒 **Safe by construction** — strict input validation, SVG output escaping/sanitization, and size limits to resist malicious input.
- 🧪 **Multiple outputs** — SVG, high-res PNG, and React Flow JSON from one call.

## Supported Diagrams

18 first-class types — explore them in the **[Examples Gallery](./docs/examples/README.md)** and the **[Diagram Types reference](./docs/diagram-types.md)**.

| | | |
|---|---|---|
| **Architecture** (nested VPCs/clusters) | **C4** context | **Flowchart** |
| **Sequence** | **State** machine | **ERD** (crow's-foot) |
| **UML Class** | **Mindmap** | **Gantt** |
| **Timeline** | **User Journey** | **Kanban** |
| **Pie** | **Quadrant** | **Sankey** |
| **Git** graph | **Treemap** | **Canvas** (freeform SVG) |

## Monorepo architecture

A `pnpm` + Turborepo monorepo of three open-source libraries.

| Package | What it is |
|---|---|
| [`@glyphicjs/schema`](./packages/schema) | The pure Zod validation layer — the LLM-facing contract. Validate model output before rendering. |
| [`@glyphicjs/core`](./packages/core) | The engine: layout adapters, scene graph, SVG rendering, and rasterization. |
| [`@glyphicjs/mcp-server`](./packages/mcp-server) | Official Model Context Protocol server — exposes Glyphic as a native tool to Claude Desktop / Cursor. |

Adding a new diagram type is one entry in [`packages/core/src/registry.ts`](./packages/core/src/registry.ts) plus a schema and a layout adapter — see [CONTRIBUTING](./CONTRIBUTING.md).

## Documentation

- 📚 [Documentation home](./docs/README.md)
- 🖼️ [Examples gallery](./docs/examples/README.md) — every type, rendered
- 🧩 [Diagram types reference](./docs/diagram-types.md) — schema for all 18 types
- 🖌️ [Styles & aspect-ratio framing](./docs/styles.md)
- 🎨 [Theming, fonts & icons](./docs/theming.md)
- 🛠️ [Core API](./docs/api.md)
- 🔌 [MCP server](./docs/mcp.md)
- 🤝 [Contributing](./CONTRIBUTING.md)

## Blog

- 🏗️ **[Why Glyphic is infrastructure, not an app](./docs/blog/why-glyphic-is-infrastructure.md)**
- 🎨 **[Everything Glyphic can do](./docs/blog/everything-glyphic-can-do.md)**
- ⚖️ **[Glyphic vs. the alternatives](./docs/blog/comparison.md)**
- 🤖 **[Why AI agents can't draw SVG](./docs/blog/why-llms-cant-draw-svg.md)**

## License

[LICENSE](./LICENSE). Build incredible things.
