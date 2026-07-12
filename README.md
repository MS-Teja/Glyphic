<div align="center">
  <h1>Glyphic</h1>
  <p><b>A diagram is data, not a drawing.</b></p>
  <p>Your model describes the diagram as typed JSON; Glyphic renders it — deterministic SVG &amp; PNG across 18 types, validated before it draws, with no DSL and no headless browser. Diagram infrastructure for LLMs and agents that you own and build on.</p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@glyphicjs/core"><img src="https://img.shields.io/npm/v/@glyphicjs/core?label=%40glyphicjs%2Fcore&color=e2502f" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@glyphicjs/mcp-server"><img src="https://img.shields.io/npm/v/@glyphicjs/mcp-server?label=mcp-server&color=e2502f" alt="mcp-server npm version" /></a>
  <a href="https://www.npmjs.com/package/@glyphicjs/core"><img src="https://img.shields.io/npm/dm/@glyphicjs/core?label=downloads&color=222" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/license-FSL%20%2F%20MIT-222" alt="License: FSL / MIT" />
  <a href="https://github.com/sponsors/MS-Teja"><img src="https://img.shields.io/badge/sponsor-%E2%9D%A4-e2502f?logo=githubsponsors" alt="Sponsor" /></a>
</p>

<p align="center">
  <a href="https://glyphic.web.app/generate">Live playground</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="./docs/examples/README.md">Examples Gallery</a> ·
  <a href="./docs/README.md">Documentation</a> ·
  <a href="#supported-diagrams">18 Diagram Types</a>
</p>

<p align="center">
  <img src="./docs/examples/00_sketch_architecture.png" alt="Sketch architecture diagram" width="480" />
  <img src="./docs/examples/00_freeform_canvas.png" alt="Freeform canvas dashboard" width="360" />
</p>

---

## Quick Start

Glyphic gives an LLM structured data in and hands you a finished diagram out. Use it three ways.

### 1. MCP server — add to your AI agent in 30 seconds

It runs over stdio via `npx`, no install:

```bash
# Claude Code
claude mcp add glyphic -- npx -y @glyphicjs/mcp-server
```

For Cursor, Claude Desktop, VS Code, Windsurf, and Antigravity, add it to your client's MCP config:

```json
{
  "mcpServers": {
    "glyphic": { "command": "npx", "args": ["-y", "@glyphicjs/mcp-server"] }
  }
}
```

Then just ask: *"Draw an ERD for a blog with users, posts, and comments."* The model emits the JSON, calls the tool, and the rendered diagram appears inline. See the [MCP setup guide](./docs/mcp.md).

### 2. Library

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

### 3. Self-hosted HTTP API

Need it behind your own endpoint? Glyphic can be self-hosted as an HTTP service that wraps the exact same engine — same schema in, same SVG/PNG/React Flow out — so your product or platform can generate diagrams without shipping the library to every client.

## Who it's for

- **Agent & LLM-app builders** — expose diagram generation as a single tool call and let the model describe it, not draw it.
- **Platform teams** — embed diagram generation directly in your product behind one validated schema.
- **CI & docs pipelines** — deterministic, byte-identical, versionable output with no Chromium to install or babysit.
- **React developers** — get interactive React Flow JSON out of the box, not just static images.

## What

**Glyphic is infrastructure for generating diagrams from structured data.** You give it a strict, semantic JSON document — arrays of `nodes` and `edges`, or `entities`, or `commits` — and it returns a polished diagram as:

- **SVG** — pure, scalable vector markup (accessible: `role="img"` + `<title>`).
- **PNG** — high-resolution raster, rendered natively via Rust (`@resvg/resvg-js`).
- **React Flow JSON** — nodes/edges mapped for an interactive React Flow canvas.

It supports **18 diagram types** (architecture, sequence, ERD, UML class, state machines, flowcharts, Gantt, timelines, Sankey, Git trees, mindmaps, pie, quadrant, user journeys, Kanban, C4, treemaps, and a freeform canvas) behind a single validated schema.

## Why

Yes — a modern LLM can draw a clean six-box flowchart as raw SVG. Go ask one; for a single throwaway diagram, that's the right tool. This isn't a bet that models "can't draw."

The problem is that a **drawn SVG is a dead picture.** It comes out different every generation, it falls apart exactly where real diagrams live — many nodes and later edits — and to change one box you regenerate the whole thing and it drifts. Glyphic treats the diagram as **data**: your model describes what it *means* as typed JSON, and a real engine renders it. Three reasons that holds up no matter how good the model gets:

1. **A machine-authoring contract, not a DSL.** The input is a strict [Zod](https://zod.dev) schema. Malformed model output comes back as a precise, fixable error *before* anything renders — so generate → validate → fix → render loops are trivial. DSLs like Mermaid parse-or-crash on a single typo (`-->|label|`).
2. **Deployable as infrastructure.** Layout is computed by real graph engines ([`elkjs`](https://github.com/kieler/elkjs), [`d3-hierarchy`](https://github.com/d3/d3-hierarchy)/`d3-sankey`) and SVG is rasterized to PNG by Rust ([`@resvg/resvg-js`](https://github.com/yisibl/resvg-js)) — no DOM, no headless browser, no Chromium. It runs in a CI job, a Lambda, an agent loop, or a Docker container as a normal Node dependency. This stays true regardless of model capability.
3. **Cheap and intact at scale.** Hand-drawing a large diagram means emitting thousands of coordinate tokens — slow, costly, and liable to blow the model's output limit and truncate into a broken render. Your model emits compact semantic JSON instead; the heavy geometry is generated deterministically.

And because a real engine owns the layout, the diagram **scales and stays editable**: it nests clusters and routes edges around obstacles where hand-placed SVG turns into diagonal lines cutting through boxes, its output is byte-identical (versionable, snapshot-testable), and the JSON stays a source of truth you can diff and re-render — not a house of cards of absolute coordinates.

<p align="center">
  <img src="./docs/examples/00_raw_svg_vs_glyphic.png" alt="The same 44-node architecture: a frontier model's one-shot raw SVG (edges tangled diagonally through boxes) above Glyphic's rendering of the identical JSON (nested tiers, routed edges)" width="760" />
  <br/>
  <sub><b>The same 44-node spec.</b> Top: a current frontier model asked for raw SVG — the boxes are fine, but the edges cut diagonally through shapes and the result can't be edited without regenerating it. Bottom: Glyphic renders the identical JSON — nested tiers, edges routed around obstacles, still an editable source of truth.</sub>
  <br/>
  <sub><i>Method: both produced by the same model (Claude Opus 4.8) from one brief — the top by asking it to hand-write SVG in a single pass; the bottom by asking it to emit Glyphic's typed JSON, then rendering with <code>@glyphicjs/core</code> (ELK layout + resvg, no browser). Same author, same content — only the draw-vs-describe boundary differs.</i></sub>
</p>

## How it compares

| Feature | Glyphic | Claude Artifacts | Mermaid | D2 |
|---|---|---|---|---|
| **Input format** | Typed JSON (Zod schema) | Natural language → SVG | Text DSL | Text DSL |
| **Renders without a browser** | ✅ Rust (resvg) | N/A (cloud-only) | ❌ Puppeteer/Chromium | ✅ Go binary |
| **Model-agnostic** | ✅ Any JSON-capable LLM | ❌ Claude only | ✅ | ✅ |
| **Schema validation** | ✅ Zod + fixable errors | ❌ | ❌ Parse-or-crash | ❌ |
| **Native MCP server** | ✅ `@glyphicjs/mcp-server` | N/A (built-in to Claude) | ❌ | ❌ |
| **React Flow output** | ✅ Interactive nodes/edges | ❌ | ❌ | ❌ |
| **Deterministic output** | ✅ Byte-identical | ❌ | ⚠️ Mostly | ✅ |
| **License** | FSL → Apache-2.0 | Proprietary | MIT | MPL-2.0 |

See the [full comparison + benchmarks](./docs/blog/comparison.md).

## Features

- 🧩 **18 diagram types** behind one validated schema — [see them all](#supported-diagrams).
- 🎨 **Theming** — built-in presets (`"theme": "dark"`, plus `light` / `pastel` / `mono`) or a full custom palette. [Theming guide](./docs/theming.md).
- 🖌️ **Styles** — visual personality presets: `"style": "compact"` (default), `clean`, `minimal`, or hand-drawn `sketch`. [Styles guide](./docs/styles.md).
- 📺 **Aspect-ratio framing** — auto-fits diagrams to clean 16:9 / 9:16 frames (or set `"aspectRatio"`), by padding — never cropping.
- 🔤 **Fonts** — any Google Font (`"theme": { "fontFamily": "Outfit" }`) or your own `.ttf`.
- 🖼️ **Native icons** — drop in any FontAwesome icon (`"icon": "fas-database"`, `"icon": "fab-aws"`) or your own SVG via `customIcons`.
- 📐 **Real layout** — `elkjs` + `d3` compute nesting (VPCs/clusters), crow's-foot/UML markers, and edge routing *around* obstacles — staying clean at the node counts where hand-placed SVG tangles into diagonals through boxes.
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

- 📌 **[Introducing Glyphic: diagrams as data for LLMs and agents](./docs/blog/introducing-glyphic.md)** — start here
- 🏗️ **[Why Glyphic is infrastructure, not an app](./docs/blog/why-glyphic-is-infrastructure.md)**
- 🎨 **[Everything Glyphic can do](./docs/blog/everything-glyphic-can-do.md)**
- ⚖️ **[Glyphic vs. the alternatives](./docs/blog/comparison.md)**
- 🤖 **[Why AI-drawn diagrams don't scale](./docs/blog/why-llms-cant-draw-svg.md)**
- 🔬 **[Is the AI-diagram comparison fair? A note on method](./docs/blog/is-the-comparison-fair.md)**

## Support

- 🐛 **Issues & feature requests** — [github.com/MS-Teja/Glyphic/issues](https://github.com/MS-Teja/Glyphic/issues)
- 📚 **Documentation** — [docs home](./docs/README.md)
- ❤️ **Sponsor development** — [github.com/sponsors/MS-Teja](https://github.com/sponsors/MS-Teja)

## License

[LICENSE](./LICENSE) — FSL / MIT.

---

<div align="center">
  <b>Give your AI structured data. Let Glyphic handle the drawing.</b>
</div>
