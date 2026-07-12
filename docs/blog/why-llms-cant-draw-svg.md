# Why AI-drawn diagrams don't scale (and what to do instead)

> Canonical post for the Glyphic launch. Doubles as the dev.to / Hashnode cross-post body.
> Suggested tags: `ai`, `llm`, `mcp`, `diagrams`, `webdev`.

Let's start honest, because the old version of this argument is out of date. Ask a current
frontier model to "draw a small architecture diagram as SVG" and you'll get something
reasonable — aligned boxes, sensible arrows, readable labels. The "models produce overlapping
garbage" complaint is basically dead. If you need one throwaway diagram, just ask the model.

The problem shows up the moment the diagram is *real*. I gave a frontier model a 44-node
architecture — four nested tiers, 38 edges — and asked for raw SVG. The boxes were fine. The
**edges** were a disaster: with nowhere to route them, it drew long diagonal lines straight
through unrelated boxes, piled labels on top of each other, and produced a picture no one could
follow. Then I changed one node, and the entire hand-placed coordinate layout had to be
regenerated from scratch — and came back different.

That points at the real issue. It was never "the model can't see." It's that **a drawing is the
wrong output type.** A drawn SVG is a dead picture: non-reproducible, un-editable, and it breaks
structurally at scale on the one part that isn't a language problem — routing edges around
obstacles over a nested graph is global constraint optimization, not next-token prediction. A
better model doesn't fix that; it's the wrong tool for the job.

## The three bad options agents have today

**Option 1 — emit raw SVG/Canvas.** The model can place boxes, but it's drawing a one-off picture:
different every generation, no validation, and edge routing collapses into diagonals-through-boxes
as soon as the graph is non-trivial. And you can't edit the result — change one node and you
regenerate everything.

**Option 2 — emit a DSL like Mermaid.** Better, because you've handed layout to a real engine.
But now the model has to produce a fragile grammar perfectly: `A -->|yes| B`. One stray pipe,
one missing bracket, and the *entire render crashes* — not "this edge is wrong," but a hard
parse error that takes the whole diagram down. And Mermaid runs its layout in a **headless
browser** (Puppeteer/Chromium), which is heavy, slow, and miserable to run server-side or
inside an agent loop.

**Option 3 — use a closed SaaS feature like Claude Artifacts or Eraser.** They draw beautiful
diagrams, but they are completely vendor-locked. You can't `npm install` them, run them in a CI
pipeline, embed them in your own product, or use them with local open-source LLMs.

None of these give you a diagram as *data you own* — reproducible, validated, editable, and
renderable anywhere.

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

This isn't "models can't draw" — they can, for something small. It's that a *drawing* is the
wrong output type. You want the diagram as **data**: reproducible, validated, editable, and
renderable anywhere. So build the boundary there — let the model do what it's great at
(describing what the diagram means as structured JSON) and let a real engine own the layout. That
line holds no matter how good the models get: it's why a diagram past a couple dozen nodes stays
clean and stays editable, instead of a one-shot picture you can't change.

*If this resonates, the project is open source — [a star helps](https://github.com/MS-Teja/Glyphic), and feedback/issues are very welcome.*
