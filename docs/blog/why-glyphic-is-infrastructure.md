# Why I built Glyphic as infrastructure, not an app

> Canonical post for the developer-facing launch angle. Doubles as dev.to / Hashnode cross-post.
> Suggested tags: `opensource`, `devtools`, `ai`, `llm`, `mcp`, `diagrams`

Claude can draw beautiful diagrams. You've seen the artifacts — custom SVG with thoughtful
layouts, icons, fonts, the works. It's genuinely impressive.

*(Glyphic is an open-source diagram engine built for AI agents. It turns JSON into SVG/PNG natively without a headless browser.)*

So why did I build Glyphic?

Because you can't `npm install` Claude Artifacts. You can't self-host them. You can't pipe
them into a CI job, embed them in your own product, or use them from a local LLM that isn't
Claude. They're a feature of one vendor's chat interface — brilliant, but locked.

And that's the gap. Not visual quality — Claude proves models *can* describe good diagrams.
The gap is **infrastructure**: a way to render diagrams that you own, embed, and run anywhere,
from any model.

## The three options today

If your agent or pipeline needs to produce a diagram, here's what you're choosing between:

**Claude Artifacts.** Beautiful output. But it's Claude-only, cloud-only, and there's no
programmatic API. You can't call it from LangChain, run it in a Lambda, or embed the result in
your SaaS product. It's a feature, not infrastructure.

**Mermaid / D2 / Graphviz.** Open source and embeddable — the right instinct. But Mermaid needs
a **headless browser (Puppeteer)** to render server-side, which means ~300 MB of Chromium, cold
starts measured in seconds, and a browser process in your agent loop. D2 is a Go binary with its
own DSL. Graphviz is a C dependency from the '90s. All of them use text DSLs — fragile grammars
where one typo crashes the whole render.

**Neither** is designed for machines to write and pipelines to consume.

## Glyphic: diagram infrastructure you own

I built Glyphic on a different premise: **the model describes what the diagram means as typed
JSON, and a deterministic engine handles layout and rendering.** No DSL to get wrong. No browser
in the stack. No vendor lock-in.

Here's what that means concretely:

### Works with any LLM

Glyphic takes JSON. Any model that can produce a JSON object — Claude, GPT, Gemini, Llama,
Mixtral, a fine-tuned 7B running on your laptop — can drive it. The input is validated against
a strict Zod schema, so if the model gets something wrong, it gets a fixable error message back
instead of a crash.

There's no coupling to any model provider. Switch models, use multiple models, run locally — it
doesn't matter.

### No headless browser

Every "render a diagram server-side" path I found eventually shelled out to Chromium. Glyphic
doesn't. Layout is computed by mathematical graph engines (ELK, d3-hierarchy, d3-sankey), and
SVG is rasterized to PNG by Rust (`@resvg/resvg-js`) — directly in-process, no DOM, no browser.

What that buys you:
- **Deploy anywhere**: Lambda, Cloud Run, edge workers, CI runners, Docker containers. No
  Chromium to install, no `--no-sandbox` flags, no cold-start tax.
- **Fast**: SVG generation takes ~5-15ms. Full native PNG rasterization takes ~800ms. Still miles ahead of booting Chromium.
- **Small footprint**: The whole engine is a normal `npm install`. No 300 MB binary download.

### Library-first

Glyphic isn't a SaaS dashboard you push diagrams to. It's an npm package:

```bash
npm install @glyphicjs/core @glyphicjs/schema
```

```typescript
import { processDiagram } from "@glyphicjs/core";

const { svg, png, reactFlow } = await processDiagram({
  type: "architecture",
  nodes: [
    { id: "api", label: "API", icon: "fas-bolt" },
    { id: "db", label: "PostgreSQL", shape: "database", icon: "fas-database" },
  ],
  edges: [{ source: "api", target: "db", label: "SQL" }],
});
```

You call a function, you get SVG, PNG, and React Flow JSON back. Embed it in your pipeline,
your product, your CI job. No network call, no API key, no rate limit.

### Self-hostable HTTP API

Need it as a service? Run the HTTP API yourself. Docker, bare metal, your Kubernetes cluster.
Your infra, your data, your SLA. No cloud dependency.

### React Flow output

Every render also produces a React Flow JSON config — nodes and edges positioned and ready for
an interactive canvas. Embed it in your product and let users pan, zoom, and explore the diagram.
No other tool does this.

### Typed schema with validation

The input contract is a Zod schema. It validates before rendering. If the model produces
`edges[2].to` referencing an unknown node, it gets back a precise error — not a stack trace or a
blank page. This makes self-correcting agent loops trivial: render → validate → fix → render.

### 18 diagram types, one schema

Architecture, sequence, ERD, UML class, state machines, flowcharts, Gantt, timelines, Sankey,
Git trees, mindmaps, C4, pie, quadrant, kanban, user journeys, treemaps, and a freeform canvas.
One `import`, one function, one schema.

## Where it fits

I built Glyphic for the places where diagram generation is **infrastructure, not a one-off**:

**CI/CD pipelines.** Generate architecture diagrams as build artifacts. Keep visual documentation
in sync with code — run it in your pipeline, commit the PNGs, snapshot-test the SVG.

**Agent and workflow platforms.** Drop it into LangChain, CrewAI, AutoGen, or your own agent
loop as a diagram-generation tool. Any model, any orchestrator.

**Internal documentation.** Auto-generate ERDs from your schema, architecture diagrams from
infra-as-code, sequence diagrams from API traces. Keep docs fresh without manual drawing.

**SaaS products.** Embed interactive diagrams in your product using the React Flow output. Your
users see polished, zoomable diagrams — you wrote zero rendering code.

**Dev tool companies.** IDE vendors, code intelligence platforms, documentation tools — embed
native diagram rendering without shipping Chromium.

## The license

Glyphic is open source with a fair competition clause.

The **schema** (`@glyphicjs/schema`) and **MCP server** (`@glyphicjs/mcp-server`) are **MIT**.
Use them however you want.

The **core engine** (`@glyphicjs/core`) is **FSL-1.1-ALv2** (Functional Source License). You can
freely use, modify, self-host, and redistribute it for any purpose — the only restriction is you
can't resell it as a competing commercial diagram service. Every version goes **full Apache 2.0**
two years after release.

This means: use it in your product, embed it in your pipeline, self-host it for your team,
fork it and modify it — all fine. Just don't build "Glyphic but as a paid service" and
compete with the project that made it possible.

## Get started

**MCP server** (Claude Code / Cursor / Claude Desktop — 30 seconds, no install):
```bash
claude mcp add glyphic -- npx -y @glyphicjs/mcp-server
```

**Library**:
```bash
npm install @glyphicjs/core @glyphicjs/schema
```

**Playground** (no sign-in): [glyphic.web.app/generate](https://glyphic.web.app/generate)

**GitHub**: [github.com/MS-Teja/Glyphic](https://github.com/MS-Teja/Glyphic)

If you're building agents that need to produce diagrams, I'd love to hear what you're working on.
Feedback and issues are very welcome.

---

*Want to see what it can actually render? Check out [Everything Glyphic can do](./everything-glyphic-can-do.md) for a deep dive into custom fonts, themes, icons, and the freeform canvas.*
