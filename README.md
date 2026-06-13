<div align="center">
  <h1>Glyphic</h1>
  <p><b>Machine-first diagramming infrastructure.</b></p>
</div>

<p align="center">
  Generate beautiful, native SVG and PNG diagrams directly from pure, semantic JSON. Built explicitly for Large Language Models (LLMs) and autonomous agents to create complex visualizations without hallucinating absolute coordinates.
</p>

---

## The Problem with LLM Diagramming

Historically, if an LLM needed to generate a diagram, it had two bad options:
1. **Try to draw it manually (Canvas/SVG):** LLMs lack a visual cortex. If you ask an LLM to draw a flowchart using raw SVG coordinates, the nodes will overlap, the text will overflow, and the connecting lines will pass straight through other elements.
2. **Use a DSL like Mermaid.js:** Mermaid uses a highly finicky domain-specific language (e.g. `-->|label|`). A single syntax error crashes the entire render. Furthermore, Mermaid relies on headless browsers (Puppeteer) to execute its layout logic, making it extremely slow, resource-heavy to run server-side, and aesthetically limited.

## The Glyphic Solution

**Glyphic bypasses headless browsers entirely.** It separates *semantics* (what the diagram means) from *visuals* (where things are drawn).

1. **Machine-First JSON**: The API surface is a strict Zod schema. LLMs output standard JSON arrays of `nodes` and `edges`. This completely eliminates syntax errors.
2. **Native Math Engines**: Glyphic uses powerful underlying directed-graph mathematical engines (`elkjs` and custom topologic adapters) to calculate perfectly routed paths, intersections, and dimensions without a DOM.
3. **Rust-Powered Rasterization**: The layout coordinates are instantly compiled into pure SVG and rasterized into high-resolution PNGs via `@resvg/resvg-js` natively in Node.js, yielding blistering fast performance.

---

## 🔥 Cool Features

- **Native FontAwesome Integration**: Simply provide an icon identifier (e.g., `"icon": "fas-database"` or `"icon": "fab-aws"`) and Glyphic will automatically inject the crisp vector directly into the node. No plugins or CSS required.
- **Custom Theming**: Override the global color palette, default node colors, text colors, and even the edge label colors directly in the JSON. You can also specify Google Fonts (`"fontFamily": "Outfit"`) or provide a direct `.ttf` URL!
- **Multiple Export Formats**: Out of the box, Glyphic doesn't just output static images. You can request:
  - `png` (High-res raster for chat interfaces)
  - `svg` (Pure scalable vector strings)
  - `react-flow` (Fully mapped nodes and edges ready to be dropped into a React Flow interactive frontend)

---

## Supported Diagrams
Glyphic handles the mathematical routing for 13 complex diagram types seamlessly:
- Architecture (Nested VPCs, Clusters)
- Entity-Relationship (ERD) & UML Class
- Sequence & State
- Flowcharts & Timelines (Gantt)
- Sankeys & Git Trees
- Mindmaps, Pies & Quadrant Charts

Check out the [Examples Gallery](./docs/examples/README.md) to see the JSON schemas side-by-side with their rendered outputs.

---

## Monorepo Architecture

This repository is powered by `pnpm` workspaces and Turborepo. It is divided into three core open-source libraries and an optional SaaS application.

### The Libraries (NPM Packages)
- **`@glyphic/schema`**: The pure Zod validation layer. Install this if you want to validate LLM outputs before rendering them.
- **`@glyphic/core`**: The heavy-lifting engine. Takes valid JSON schemas and returns the SVG/PNG buffers.
- **`@glyphic/mcp-server`**: An official Model Context Protocol (MCP) wrapper that allows Claude Desktop and Cursor to use Glyphic natively as a tool!

### The Hosted API
- **`apps/api`**: A production-ready Fastify + BullMQ server. If you don't want to run the heavy math engine inside your own client apps, you can deploy this to Railway or AWS. It provides a highly available REST API (`POST /v1/render`) protected by an API Key.

---

## Quick Start: Using in Claude Desktop

You can use Glyphic right now inside Claude Desktop as a native tool.

1. Open your `claude_desktop_config.json` file.
2. Add the Glyphic MCP Server:

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

3. Restart Claude Desktop.
4. Ask Claude: *"Draw a colorful architecture diagram of a React app talking to an AWS Load Balancer which connects to 3 Node.js EC2 instances and a Postgres database."*
5. Watch Claude output perfect JSON, execute the tool, and instantly display a high-resolution PNG right in the chat!

---

## Developer Guide: Using the Core Engine

If you want to build Glyphic directly into your own Node application (Next.js, Express, etc):

```bash
npm install @glyphic/core @glyphic/schema
```

```typescript
import { processDiagram } from "@glyphic/core";
import { DiagramInputType } from "@glyphic/schema";

// 1. Create a pure JSON semantic definition
const payload: DiagramInputType = {
  type: "architecture",
  nodes: [
    { id: "frontend", label: "Web App", icon: "fab-react", shape: "browser" },
    { id: "db", label: "PostgreSQL", icon: "fas-database", shape: "database" }
  ],
  edges: [
    { source: "frontend", target: "db", label: "SQL Queries" }
  ]
};

// 2. Render instantly
const result = await processDiagram(payload);

// 3. Do what you want with the outputs!
fs.writeFileSync("output.png", result.png);
console.log(result.svg);
console.log(result.reactFlow); // Native React Flow JSON
```

---

## Self-Hosting the API Server

If you prefer to hit an HTTP endpoint, you can easily self-host the `@glyphic/api` package. It uses BullMQ backed by Redis to ensure complex diagram math doesn't block the Node event loop under heavy load.

1. Clone this repository.
2. Install dependencies: `pnpm install`
3. Make sure you have a Redis instance running locally (`docker run -p 6379:6379 redis`).
4. Set environment variables: `REDIS_URL=redis://localhost:6379` and `API_KEY=your_secret`.
5. Start the server: `pnpm --filter @glyphic/api run start`.

You can now hit `POST http://localhost:3000/v1/render` with your JSON!

---

## License
MIT License. Build incredible things.
