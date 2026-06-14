# Styles & Aspect-Ratio Framing

Two top-level fields shape the *look* of any diagram, independently of its content and colors:

- **`style`** — the visual personality: shape geometry, spacing, stroke weight, fills.
- **`aspectRatio`** — the frame the diagram is fitted into.

Both are optional and apply to every diagram type. `theme` (colors/fonts), `style` (geometry), and `aspectRatio` (frame) compose freely.

---

## Styles

`style` is a preset bundling corner radius, border weight, fill treatment, label weight, and node/edge spacing. It is **separate from `theme`**: `theme` decides the palette, `style` decides the geometry.

```json
{ "type": "architecture", "style": "compact", "theme": "dark", "nodes": [/* ... */], "edges": [] }
```

| Preset | Look | Best for |
|---|---|---|
| `"compact"` *(default)* | Dense spacing, soft **tinted** fills, rounded corners, thin borders, a subtle drop shadow. | Most diagrams — the friendly, modern default. |
| `"clean"` | The classic Glyphic look: solid fills, square-ish corners, 2px borders, roomier spacing. | Matching diagrams made before styles existed. |
| `"minimal"` | **Outline-only** nodes (no fill), hairline borders, generous whitespace. | Wireframes, understated docs. |
| `"sketch"` | Hand-drawn: shapes and edges get a deterministic "rough" wobble. | Brainstorms, playful or low-fidelity diagrams. |

### How fills work per style

When a node sets `metadata.color` (or `data[].color`, etc.), the style decides how that color is used:

- **compact / sketch** — the color becomes a **light tint** fill with the full color as the border (the eraser.io-style look).
- **clean** — the color **fills** the shape solidly, with a darker derived border.
- **minimal** — the color is the **border** only; the fill is transparent.

Nodes without an explicit color fall back to the theme's `nodeBackground` / `nodeBorder`.

### Notes

- `sketch` roughens the common shapes (rectangles, rounded, diamonds, hexagons) and edge paths. Structural shapes (cylinders, class/table boxes, actors) stay crisp for legibility. The wobble is seeded by geometry, so renders are **deterministic** (snapshot-safe).
- Styles also drive **layout spacing** for graph diagrams, so `compact` is genuinely denser than `clean`, not just restyled.
- Styling for the data/timeline families (pie, gantt, timeline, journey, kanban, sankey, git) is best-effort — those types are already visually tuned and are not roughened by `sketch`.

---

## Aspect-ratio framing

By default Glyphic frames most diagrams to a clean **16:9** (landscape) or **9:16** (portrait) by **padding** — it adds whitespace and centers the content. It never scales or crops, so text stays crisp and nothing is lost.

```json
{ "type": "flowchart", "direction": "LR", "aspectRatio": "16:9", "nodes": [/* ... */], "edges": [] }
```

### `aspectRatio` values

| Value | Behavior |
|---|---|
| `"auto"` *(default)* | Pick a sensible ratio from the diagram type and direction (see below). |
| `"16:9"` / `"9:16"` / `"4:3"` / `"3:4"` / `"1:1"` | Force that exact ratio (bypasses the outlier guard). |
| `"none"` | Disable framing; emit content at its natural size. |

### What `auto` picks

Auto-framing applies only to the **direction-based graph types** — `flowchart` and `architecture` — where snapping to a slide-friendly frame is genuinely useful:

- `direction` `LR` / `RL` → **16:9**
- `direction` `TB` / `BT` → **9:16**

**Every other type** (sequence, gantt, timeline, erd, class, c4, pie, quadrant, sankey, git, mindmap, kanban, state, treemap, canvas) keeps its **natural aspect ratio** — these diagrams have their own intrinsic proportions, and forcing them into a frame would just add empty space. You can still frame any of them explicitly with `aspectRatio`.

### The outlier guard

Even for `flowchart` / `architecture`, `auto` framing is skipped when hitting the target would leave the content filling less than ~62% of the padded axis (e.g. a long single-row left-to-right pipeline). Padding that far would float a sliver of content in a sea of whitespace, so Glyphic keeps the natural size instead. Set an explicit `aspectRatio` to override this and force the frame.

---

See [theming](./theming.md) for colors and fonts, and the [diagram types reference](./diagram-types.md) for per-type fields.
