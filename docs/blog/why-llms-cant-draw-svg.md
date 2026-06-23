# Why AI agents can't draw SVG (and what to do instead)

> Canonical post for the Glyphic launch. Doubles as the dev.to / Hashnode cross-post body.
> Suggested tags: `ai`, `llm`, `mcp`, `diagrams`, `webdev`.

Ask any frontier model to "draw an architecture diagram as SVG" and you'll get something
that *looks* like markup and renders like a ransom note: boxes overlapping, labels spilling
past their borders, arrows cutting straight through other shapes. The model wrote valid SVG.
It just can't *see*.

That's the whole problem in one sentence: **a language model has no visual cortex.** It
predicts tokens, not pixels. Asking it to place a node at `x=412, y=088` and route an edge
around three other nodes is asking it to do collision detection and graph layout in its head,
blind, one token at a time. It will confidently get it wrong.

## The two bad options agents have today

**Option 1 — emit raw SVG/Canvas.** This is the blind-pixel-placement problem above. It fails
the moment a diagram has more than a handful of nodes, and it fails *silently* — you get a
picture, it's just a bad one.

**Option 2 — emit a DSL like Mermaid.** Better, because you've handed layout to a real engine.
But now the model has to produce a fragile grammar perfectly: `A -->|yes| B`. One stray pipe,
one missing bracket, and the *entire render crashes* — not "this edge is wrong," but a hard
parse error that takes the whole diagram down. And Mermaid runs its layout in a **headless
browser** (Puppeteer/Chromium), which is heavy, slow, and miserable to run server-side or
inside an agent loop.

Both options ask the model to do the one thing it's worst at (spatial reasoning) or to be
flawless at the one thing it's unreliable at (rigid syntax).

## The fix: separate *meaning* from *layout*

The insight is to give the model a job it's actually good at — describing **what a diagram
means** — and hand the job it's bad at — **where things go** — to a deterministic engine.

So instead of pixels or a DSL, the model emits **plain, typed JSON**:

```json
{
  "type": "flowchart",
  "nodes": [
    { "id": "in", "label": "JSON spec" },
    { "id": "engine", "label": "Layout engine" },
    { "id": "out", "label": "SVG / PNG" }
  ],
  "edges": [
    { "from": "in", "to": "engine" },
    { "from": "engine", "to": "out" }
  ]
}
```

No coordinates. No grammar to typo. Just arrays of `nodes` and `edges` (or `entities`, or
`commits`, depending on the diagram). This is exactly the shape LLMs are reliable at producing.

Then a real layout engine takes over:

- **Graph layout** is computed mathematically (ELK / d3-hierarchy / d3-sankey) — routing,
  intersections, and sizing done properly, the way a human tool would.
- **Rasterization is native** — SVG is compiled to PNG by Rust (`resvg`), directly in Node.
  **No Chromium, no DOM, no Puppeteer.** It deploys anywhere a Node process runs.
- **Validation is a contract, not a crash.** The JSON is checked against a typed schema
  *before* anything renders. Malformed model output comes back as a precise, fixable error
  ("`edges[2].to` references unknown node") — which the agent can correct on the next turn —
  instead of a stack trace that kills the render.

The result: agents produce **correct, good-looking diagrams on the first try**, and you run
the whole thing as an ordinary dependency.

## This is what Glyphic is

[Glyphic](https://github.com/MS-Teja/Glyphic) is that engine. Typed JSON in → deterministic
SVG and PNG out, across **18 diagram types** (architecture, sequence, ERD, UML class, state
machines, flowcharts, Gantt, timelines, Sankey, Git trees, mindmaps, C4, and more) behind a
single validated schema.

You can use it three ways:

- **As an MCP server** — so Claude Code, Cursor, Claude Desktop, and friends can draw diagrams
  as a native tool. Add it to your agent in 30 seconds, no install:

  ```bash
  claude mcp add glyphic -- npx -y @glyphicjs/mcp-server
  ```

  Then ask: *"Draw an ERD for a blog with users, posts, and comments."*

- **As a library** — `npm install @glyphicjs/core @glyphicjs/schema`.
- **As a self-hosted HTTP API.**

There's a [live playground](https://glyphic.web.app/generate) (no sign-in, a few free
generations) if you want to throw JSON at it right now.

## The takeaway

Stop asking models to draw. Ask them to *describe*, and let an engine draw. LLMs are
extraordinary at producing structured descriptions of things and unreliable at spatial
placement — so build the boundary along that line. That's the whole design of Glyphic, and
it's why agents using it get a clean diagram on the first attempt instead of an abstract-art
generator.

*If this resonates, the project is open source — [a star helps](https://github.com/MS-Teja/Glyphic), and feedback/issues are very welcome.*
