# Diagram Types Reference

Every diagram is one JSON object whose `type` field selects the shape. This page lists all **18 types** with their key fields and a minimal example. See rendered output in the [gallery](./examples/README.md), and styling in [theming](./theming.md).

## Shared fields

Every type accepts these (all optional):

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Diagram title; also becomes the SVG `<title>` for accessibility. |
| `theme` | preset name or object | `"light"` / `"dark"` / `"pastel"` / `"mono"`, or a [custom theme](./theming.md). Controls **colors**. |
| `style` | preset name | `"compact"` (default) / `"clean"` / `"minimal"` / `"sketch"`. Controls **shape geometry, spacing, and stroke** — see [styles](./styles.md). |
| `aspectRatio` | preset name | `"auto"` (default) / `"16:9"` / `"9:16"` / `"1:1"` / `"4:3"` / `"3:4"` / `"none"`. Frames the output by padding — see [styles](./styles.md#aspect-ratio-framing). |
| `exportFormat` | `string[]` | Hint for consumers (MCP/API): any of `"png"`, `"svg"`, `"react-flow"`. Default `["png"]`. The core library always returns SVG + PNG regardless. |

All arrays are capped (e.g. ≤1000 nodes) to bound render cost.

## Reference: shapes & arrows (graph types)

**Node `shape`** (flowchart / architecture): `rectangle` (default), `rounded`, `cylinder`, `cloud`, `diamond`, `hexagon`, `person`, `database`, `service`, `table`, `class`, `state_start`, `state_end`.

**Edge `style`:** `solid` (default), `dashed`, `dotted`.

**Edge `arrow`:** `forward` (default), `back`, `both`, `none`, `open`, `inheritance`, `composition`, `aggregation`, `dependency`, `crow`, `crow-one`, `crow-zero-many`, `zero-one`, `one-one`.

---

## flowchart / architecture

General node-edge graphs laid out by `elkjs`. `architecture` is the same shape as `flowchart` and adds nested groups (VPCs/clusters) via `groupId`.

| Field | Type | Notes |
|---|---|---|
| `direction` | `"TB"\|"BT"\|"LR"\|"RL"` | Default `TB`. |
| `routing` | `"orthogonal"\|"polyline"\|"splines"` | Default `orthogonal`. |
| `nodes[]` | `{ id, label, shape?, groupId?, icon?, x?, y?, width?, height?, metadata? }` | `id` is alphanumeric/underscore/hyphen. `groupId` nests this node inside another. `metadata.color` tints it; `metadata.attributes`/`methods`/`columns` fill `class`/`table` shapes. |
| `edges[]` | `{ source, target, label?, style?, arrow?, metadata? }` | |

```json
{
  "type": "architecture",
  "nodes": [
    { "id": "web", "label": "Web", "shape": "rounded", "icon": "fab-react" },
    { "id": "db", "label": "Postgres", "shape": "database", "icon": "fas-database" }
  ],
  "edges": [{ "source": "web", "target": "db", "label": "SQL" }]
}
```

## sequence

Temporal participant/message flow with lifelines.

| Field | Type | Notes |
|---|---|---|
| `participants[]` | `{ id, label, shape? }` | ≥2. `shape`: `actor` / `service` (default) / `database`. |
| `messages[]` | `{ source, target, label, type? }` | ≥1, in order. `type`: `sync` (default) / `async` / `return`. `source === target` draws a self-message. |

```json
{
  "type": "sequence",
  "participants": [{ "id": "u", "label": "User", "shape": "actor" }, { "id": "api", "label": "API" }],
  "messages": [{ "source": "u", "target": "api", "label": "GET /me", "type": "sync" }]
}
```

## state

State machine. Maps to node/edge layout with start/end markers.

| Field | Type | Notes |
|---|---|---|
| `direction` | `"TB"\|"BT"\|"LR"\|"RL"` | Default `TB`. |
| `states[]` | `{ id, label?, kind?, parent? }` | `kind`: `state` (default) / `initial` / `final` / `composite`. `parent` nests into a composite state. |
| `transitions[]` | `{ from, to, label? }` | |

```json
{
  "type": "state",
  "states": [{ "id": "s", "kind": "initial" }, { "id": "on", "label": "On" }, { "id": "e", "kind": "final" }],
  "transitions": [{ "from": "s", "to": "on" }, { "from": "on", "to": "e", "label": "shutdown" }]
}
```

## erd

Entity-relationship diagram. Entities render as tables; relationships use crow's-foot markers.

| Field | Type | Notes |
|---|---|---|
| `direction` | `"TB"\|"BT"\|"LR"\|"RL"` | Default `LR`. |
| `entities[]` | `{ id, label?, color?, attributes?[] }` | `attributes[]` = `{ name, type?, key? }`, `key`: `PK` / `FK`. |
| `relationships[]` | `{ from, to, label?, cardinality? }` | `cardinality`: `one-to-one`, `one-to-many`, `many-to-one`, `many-to-many`, `zero-or-one`, `zero-or-many`. |

```json
{
  "type": "erd",
  "entities": [
    { "id": "users", "attributes": [{ "name": "id", "type": "uuid", "key": "PK" }] },
    { "id": "posts", "attributes": [{ "name": "author_id", "type": "uuid", "key": "FK" }] }
  ],
  "relationships": [{ "from": "users", "to": "posts", "cardinality": "one-to-many", "label": "writes" }]
}
```

## class

UML class diagram. Classes render with attribute/method compartments.

| Field | Type | Notes |
|---|---|---|
| `direction` | `"TB"\|"BT"\|"LR"\|"RL"` | Default `TB`. |
| `classes[]` | `{ id, label?, color?, attributes?[], methods?[] }` | `attributes`/`methods` are arrays of strings (e.g. `"+ area(): number"`). |
| `relationships[]` | `{ from, to, label?, type? }` | `type`: `association`, `inheritance`, `extends`, `implements`, `composition`, `aggregation`, `dependency`. |

```json
{
  "type": "class",
  "classes": [
    { "id": "Shape", "methods": ["+ area(): number"] },
    { "id": "Circle", "attributes": ["- r: number"] }
  ],
  "relationships": [{ "from": "Circle", "to": "Shape", "type": "inheritance" }]
}
```

## c4

C4 context/container diagram with conventional element styling.

| Field | Type | Notes |
|---|---|---|
| `direction` | `"TB"\|"BT"\|"LR"\|"RL"` | Default `TB`. |
| `elements[]` | `{ id, label, kind?, description?, parent? }` | `kind`: `person`, `system` (default), `external`, `container`, `database`, `boundary`. `parent` nests into a boundary/system. |
| `relationships[]` | `{ from, to, label?, technology? }` | `technology` renders as `[…]` on the edge. |

```json
{
  "type": "c4",
  "elements": [
    { "id": "u", "label": "Customer", "kind": "person" },
    { "id": "sys", "label": "Banking System", "kind": "system" }
  ],
  "relationships": [{ "from": "u", "to": "sys", "label": "Uses", "technology": "HTTPS" }]
}
```

## mindmap

Radial node-edge layout with automatic branch coloring.

| Field | Type | Notes |
|---|---|---|
| `nodes[]` | `{ id, label, icon?, shape? }` | `shape`: `rectangle` / `rounded` (default) / `cloud`. |
| `edges[]` | `{ source, target, label? }` | |

```json
{
  "type": "mindmap",
  "nodes": [{ "id": "root", "label": "Idea" }, { "id": "a", "label": "Branch A" }],
  "edges": [{ "source": "root", "target": "a" }]
}
```

## gantt

Project schedule with sections, tasks, dependencies, and a time axis.

| Field | Type | Notes |
|---|---|---|
| `dateFormat` | `string` | e.g. `"generic"` for numeric units. |
| `sections[]` | `{ id?, label, tasks[] }` | |
| `…tasks[]` | `{ id, label, start, end?, duration?, dependencies?[] }` | Each task **must** have `end` **or** `duration`. `start`/`end` are dates or numbers. |

```json
{
  "type": "gantt",
  "sections": [{
    "label": "Build",
    "tasks": [
      { "id": "api", "label": "API", "start": 0, "duration": 5 },
      { "id": "ui", "label": "UI", "start": 3, "duration": 5, "dependencies": ["api"] }
    ]
  }]
}
```

## timeline

Chronological periods, each a column of event cards.

| Field | Type | Notes |
|---|---|---|
| `periods[]` | `{ label, events[] }` | `events` is an array of strings. |

```json
{
  "type": "timeline",
  "periods": [
    { "label": "2024", "events": ["Founded", "Seed round"] },
    { "label": "2025", "events": ["Public beta"] }
  ]
}
```

## journey

User journey map. Stages → tasks with a 1–5 satisfaction score.

| Field | Type | Notes |
|---|---|---|
| `sections[]` | `{ label, tasks[] }` | |
| `…tasks[]` | `{ label, score, actors?[] }` | `score` is 1–5 (drives the card color). |

```json
{
  "type": "journey",
  "sections": [{
    "label": "Onboard",
    "tasks": [{ "label": "Sign up", "score": 2, "actors": ["User"] }]
  }]
}
```

## kanban

Board of columns and cards.

| Field | Type | Notes |
|---|---|---|
| `columns[]` | `{ label, cards[] }` | |
| `…cards[]` | `{ label, assignee?, tag?, priority? }` | `priority`: `low` / `medium` / `high` (drives the accent color). |

```json
{
  "type": "kanban",
  "columns": [{
    "label": "In Progress",
    "cards": [{ "label": "Fix login bug", "priority": "high", "assignee": "Sam", "tag": "bug" }]
  }]
}
```

## pie

Pie chart with leader-line labels.

| Field | Type | Notes |
|---|---|---|
| `width`/`height`/`cx`/`cy`/`radius` | `number?` | Optional geometry overrides. |
| `legend` | `boolean` | Show a color legend. Default `false`. |
| `data[]` | `{ label, value, color?, explode? }` | `value` ≥ 0 (treated as a percentage); `explode` offsets the slice outward. |

```json
{
  "type": "pie",
  "legend": true,
  "data": [{ "label": "A", "value": 60 }, { "label": "B", "value": 40 }]
}
```

## quadrant

2×2 matrix with labeled axes and plotted points.

| Field | Type | Notes |
|---|---|---|
| `xAxis` | `{ left, right }` | Axis end labels. |
| `yAxis` | `{ bottom, top }` | |
| `points[]` | `{ label, x, y }` | `x`/`y` in `0.0`–`1.0`. |

```json
{
  "type": "quadrant",
  "xAxis": { "left": "Low", "right": "High" },
  "yAxis": { "bottom": "Low", "top": "High" },
  "points": [{ "label": "Item", "x": 0.8, "y": 0.7 }]
}
```

## sankey

Proportional flow diagram (`d3-sankey`).

| Field | Type | Notes |
|---|---|---|
| `nodes[]` | `{ id, label?, color? }` | ≥2. |
| `edges[]` | `{ source, target, value }` | ≥1; `value` ≥ 0 = flow thickness. |

```json
{
  "type": "sankey",
  "nodes": [{ "id": "a", "label": "Source" }, { "id": "b", "label": "Sink" }],
  "edges": [{ "source": "a", "target": "b", "value": 100 }]
}
```

## git

Git commit graph with branches, merges, and tags.

| Field | Type | Notes |
|---|---|---|
| `commits[]` | `{ id, message?, branch, parents?[], tag? }` | Two `parents` = a merge. If `parents` is omitted, the previous commit on the same `branch` is the parent. |

```json
{
  "type": "git",
  "commits": [
    { "id": "c1", "message": "init", "branch": "main" },
    { "id": "c2", "message": "feature", "branch": "dev", "parents": ["c1"] },
    { "id": "c3", "message": "merge", "branch": "main", "parents": ["c1", "c2"], "tag": "v1.0" }
  ]
}
```

## treemap

Hierarchical value rectangles (squarified, `d3-hierarchy`).

| Field | Type | Notes |
|---|---|---|
| `width`/`height` | `number?` | Canvas size (default 900×600). |
| `root` | recursive node | `{ label, value?, color?, children?[] }`. Leaves carry `value`; parents sum their children. Bounded to depth ≤12 / ≤2000 nodes. |

```json
{
  "type": "treemap",
  "root": {
    "label": "root",
    "children": [
      { "label": "src", "value": 90 },
      { "label": "tests", "value": 40 }
    ]
  }
}
```

## canvas

Freeform absolute-positioned SVG — bypasses the layout engine entirely. Use for fully custom visuals.

| Field | Type | Notes |
|---|---|---|
| `width`/`height` | `number` | Required canvas size. |
| `elements[]` | discriminated union by `type` | `rect`, `circle`, `ellipse`, `path`, `polygon`, `line`, `text`, `raw-svg`, `group` (recursive). Bounded by depth/element count. |

```json
{
  "type": "canvas",
  "width": 300,
  "height": 160,
  "elements": [
    { "type": "rect", "x": 20, "y": 20, "width": 260, "height": 120, "rx": 12, "fill": "#1e293b" },
    { "type": "text", "x": 150, "y": 80, "content": "Hello", "textAnchor": "middle", "fill": "#fff", "fontSize": 24 }
  ]
}
```

---

Need the exact validation rules? They live in [`packages/schema/src/diagram.ts`](../packages/schema/src/diagram.ts) — the single source of truth.
