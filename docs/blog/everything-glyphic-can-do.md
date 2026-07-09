# Everything Glyphic can do

> Feature showcase post. Doubles as dev.to / Hashnode cross-post.
> Suggested tags: `webdev`, `diagrams`, `ai`, `svg`, `design`, `devtools`

One JSON object. Eighteen diagram types. Custom fonts, icons, themes, hand-drawn styles, nested
groups, freeform SVG, and interactive React Flow output — all from a single `processDiagram()`
call.

*(Glyphic is an open-source diagram engine built for AI agents. It turns JSON into SVG/PNG natively without a headless browser.)*

This post is a tour of what Glyphic can actually *do*. Not the architecture pitch or the
"why I built it" story — just the features, with the JSON that drives them.

---

## 4 Styles × Unlimited Themes

Glyphic separates **style** (shape geometry, spacing, stroke weight) from **theme** (colors,
fonts). They compose freely — mix any style with literally any color palette. LLMs can inject exact brand colors or metadata-driven styling per node.

### Styles

Set `"style"` on any diagram:

```json
{ "type": "architecture", "style": "compact", ... }
```

| Style | What it does |
|---|---|
| **compact** *(default)* | Dense spacing, soft tinted fills, rounded corners, subtle drop shadow. |
| **clean** | Solid fills, square corners, 2px borders, roomier spacing. The classic look. |
| **minimal** | Outline-only nodes (no fill), hairline borders, generous whitespace. |
| **sketch** | Deterministic hand-drawn wobble. Yes, deterministic — snapshot-safe. |

### Themes

Set `"theme"` to a preset name:

```json
{ "type": "flowchart", "theme": "dark", ... }
```

Four built-in presets: `light` (default), `dark`, `pastel`, `mono`.

The sketch architecture example shows `"style": "sketch"` in action — every shape gets a wobbly,
hand-drawn feel, but the output is identical across runs (the wobble is seeded by geometry). The
dark CI/CD pipeline shows `"theme": "dark"` with icons and colored nodes.

---

## Custom theme palettes

For full control, pass an object instead of a preset name:

```json
{
  "type": "architecture",
  "theme": {
    "background": "#0f172a",
    "nodeBackground": "#1e293b",
    "nodeBorder": "#6366f1",
    "nodeText": "#f1f5f9",
    "edgeColor": "#475569",
    "edgeLabelColor": "#94a3b8",
    "fontFamily": "Outfit"
  },
  "nodes": [...]
}
```

Every field is optional and merges over the defaults. This is how the Kubernetes microservices
example gets its deep navy palette — a full custom theme object with per-node color overrides.

Available theme fields:

- `background` — canvas background
- `nodeBackground` / `nodeBorder` / `nodeText` — default node styling
- `edgeColor` / `edgeLabelColor` — connector lines and labels
- `fontFamily` — all text (see Fonts below)
- `customFontUrl` — custom `.ttf` or `.otf` source
- `customIcons` — map of custom SVG icons

---

## Google Fonts (one line)

Set `fontFamily` to any Google Font name. Glyphic injects the `@import` automatically:

```json
{ "theme": { "fontFamily": "Outfit" } }
```

That's it. No CDN link, no CSS, no build step. Try `"Fira Code"` for a monospaced technical
look, `"Inter"` for clean sans-serif, or `"Caveat"` for a handwritten feel that pairs nicely
with `"style": "sketch"`.

The cloud architecture example uses Outfit — notice the clean, geometric labels on every node.

### Custom brand fonts

Point `customFontUrl` at an HTTPS `.ttf` or `.otf` for your own brand typeface:

```json
{
  "theme": {
    "fontFamily": "MyBrand",
    "customFontUrl": "https://cdn.example.com/MyBrand.ttf"
  }
}
```

The SVG references the font by URL. To make it appear in the rasterized PNG too, pass the font
bytes as the `fontBuffer` argument to `processDiagram()`:

```typescript
const ttf = readFileSync("./MyBrand.ttf");
const result = await processDiagram(diagramInput, ttf.buffer);
```

---

## FontAwesome icons (built in)

Give any node an `icon` using FontAwesome's free **solid** (`fas-`) or **brands** (`fab-`) prefix:

```json
{ "id": "db", "label": "PostgreSQL", "shape": "database", "icon": "fas-database" }
{ "id": "app", "label": "React App", "shape": "rounded", "icon": "fab-react" }
{ "id": "deploy", "label": "Deploy", "shape": "rounded", "icon": "fas-rocket" }
{ "id": "github", "label": "GitHub", "shape": "rounded", "icon": "fab-github" }
```

The crisp vector path is injected directly into the SVG — no external CSS, no plugins, no
font file. Unknown icon names are simply skipped (the node renders without an icon).

I use these everywhere: `fab-aws`, `fab-docker`, `fas-lock`, `fas-bolt`, `fas-gears`,
`fas-bell`, `fas-chart-line` — they add immediate visual identity to architecture diagrams.

### Custom SVG icons

Provide your own via `theme.customIcons` and reference them by name:

```json
{
  "theme": {
    "customIcons": {
      "my-logo": "<svg viewBox=\"0 0 24 24\">...</svg>"
    }
  },
  "nodes": [
    { "id": "svc", "label": "My Service", "icon": "my-logo" }
  ]
}
```

Custom SVG is sanitized on output (scripts, event handlers, and foreign objects are stripped),
so the result is safe to embed in a browser.

---

## Per-node colors

Override any node's color via `metadata.color`:

```json
{ "id": "cache", "label": "Redis", "shape": "cylinder", "metadata": { "color": "#ef4444" } }
{ "id": "deploy", "label": "Deploy", "shape": "rounded", "metadata": { "color": "#22c55e" } }
```

The style determines how the color is applied:

- **compact / sketch** — the color becomes a light tint fill with the full color as the border
- **clean** — the color fills the shape solidly with a darker derived border
- **minimal** — the color is the border only; fill stays transparent

This means the same `metadata.color` looks different (and appropriate) across styles — you don't
need to adjust anything when switching visual modes.

---

## Colored edges

Highlight specific data flows with `edge.metadata.color`:

```json
{
  "source": "order_svc",
  "target": "kafka",
  "label": "order.created",
  "metadata": { "color": "#22c55e" }
}
```

In the Kubernetes microservices example, I use this to visually separate event flows (green) from
payment integrations (purple) from notification chains (yellow). The color applies to both the
connector line and the label.

---

## Nested groups

Use `groupId` to nest nodes inside container nodes — VPCs, Kubernetes namespaces, clusters,
organizational boundaries:

```json
{
  "nodes": [
    { "id": "vpc", "label": "Production VPC", "shape": "rectangle" },
    { "id": "auth", "label": "Auth Service", "groupId": "vpc", "icon": "fas-lock" },
    { "id": "api", "label": "API Service", "groupId": "vpc", "icon": "fas-gears" },
    { "id": "db_cluster", "label": "Database Cluster", "shape": "rectangle", "groupId": "vpc" },
    { "id": "pg", "label": "PostgreSQL", "shape": "database", "groupId": "db_cluster" }
  ]
}
```

Groups nest arbitrarily deep. ELK computes the layout, routes edges around group boundaries,
and sizes containers to fit their children. The cloud architecture example has a 3-level
hierarchy: VPC → API Cluster → individual services.

---

## Freeform canvas

When the 18 typed diagram types aren't enough, the `canvas` type gives you absolute-positioned
SVG primitives — `rect`, `circle`, `text`, `line`, `path`, `group`, and `raw-svg`:

```json
{
  "type": "canvas",
  "title": "System Health Card",
  "theme": "dark",
  "width": 600,
  "height": 320,
  "elements": [
    { "type": "rect", "x": 30, "y": 30, "width": 540, "height": 260, "rx": 16, "fill": "#1e293b", "stroke": "#334155" },
    { "type": "circle", "cx": 120, "cy": 120, "r": 48, "fill": "#22c55e" },
    { "type": "text", "x": 120, "y": 120, "content": "98%", "textAnchor": "middle", "fill": "#ffffff", "fontSize": 26, "fontWeight": 700 },
    { "type": "text", "x": 200, "y": 100, "content": "System Health", "fill": "#f8fafc", "fontSize": 24, "fontWeight": 700 }
  ]
}
```

This is what "no vendor lock-in" looks like for custom visuals. You're not constrained to
pre-defined node shapes — you have the full power of SVG, expressed as JSON, rendered natively.
Dashboards, status cards, custom data visualizations — anything you can describe as shapes and
text, Glyphic can render.

---

## Aspect-ratio framing

By default, Glyphic auto-frames most diagrams to a clean **16:9** (landscape) or **9:16**
(portrait) by adding whitespace and centering the content. It never scales or crops — text stays
crisp.

```json
{ "type": "flowchart", "direction": "LR", "aspectRatio": "16:9" }
```

Options: `"auto"` (default — picks based on direction), `"16:9"`, `"9:16"`, `"4:3"`, `"3:4"`,
`"1:1"`, or `"none"` (natural size).

There's an outlier guard: if framing to the target would leave the content filling less than ~62%
of the padded axis, Glyphic keeps the natural size instead of floating a tiny diagram in a sea of
whitespace.

---

## Multiple output formats

Every `processDiagram()` call returns three things:

```typescript
const { svg, png, reactFlow } = await processDiagram(input);
```

- **SVG** — pure, scalable vector markup. Includes `role="img"` and `<title>` for accessibility.
- **PNG** — high-resolution raster (2× by default), rendered natively via Rust. No browser.
- **React Flow JSON** — nodes and edges positioned for an interactive React Flow canvas. Embed
  zoomable, pannable diagrams in your product with zero rendering code.

---

## Accessibility

Every SVG includes `role="img"` and a `<title>` derived from the diagram's `title` field, so
screen readers announce it correctly. It's automatic — just set a meaningful `title` on each
diagram.

```json
{ "type": "architecture", "title": "Production VPC topology", ... }
```

---

## The full list

18 first-class diagram types behind one validated schema:

| | | |
|---|---|---|
| Architecture (nested VPCs) | C4 context | Flowchart |
| Sequence | State machine | ERD (crow's-foot) |
| UML Class | Mindmap | Gantt |
| Timeline | User Journey | Kanban |
| Pie | Quadrant | Sankey |
| Git graph | Treemap | Canvas (freeform SVG) |

---

## Try it

**Playground** (no sign-in): [glyphic.web.app/generate](https://glyphic.web.app/generate)

**MCP server** (add to Claude Code / Cursor in 30 seconds):
```bash
claude mcp add glyphic -- npx -y @glyphicjs/mcp-server
```

**Library**:
```bash
npm install @glyphicjs/core @glyphicjs/schema
```

**GitHub**: [github.com/MS-Teja/Glyphic](https://github.com/MS-Teja/Glyphic)

All the JSON sources for the examples mentioned here are in the
[examples gallery](https://github.com/MS-Teja/Glyphic/tree/main/docs/examples).
