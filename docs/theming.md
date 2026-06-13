# Theming, Fonts & Icons

Every diagram accepts an optional `theme`, and most node-based types accept per-element styling. All of it lives in the same JSON.

## Theme presets

The quickest option — set `theme` to a preset name:

```json
{ "type": "flowchart", "theme": "dark", "nodes": [/* ... */], "edges": [] }
```

| Preset | Look |
|---|---|
| `"light"` | Default — light background, blue accents. |
| `"dark"` | Dark navy background, light text (see the [CI/CD example](./examples/31_dark_cicd_pipeline.png)). |
| `"pastel"` | Soft warm background, pink/violet accents. |
| `"mono"` | Neutral grayscale. |

Themes apply across **all** render strategies (graph, data-viz, flow, canvas).

## Custom theme object

For full control, pass an object instead of a preset name. All fields are optional and merge over the defaults:

```json
{
  "type": "architecture",
  "theme": {
    "background": "#0f172a",
    "nodeBackground": "#1e293b",
    "nodeBorder": "#38bdf8",
    "nodeText": "#e2e8f0",
    "edgeColor": "#94a3b8",
    "edgeLabelColor": "#cbd5e1",
    "fontFamily": "Outfit"
  },
  "nodes": [/* ... */],
  "edges": [/* ... */]
}
```

| Field | Applies to |
|---|---|
| `background` | Canvas background |
| `nodeBackground` / `nodeBorder` / `nodeText` | Default node fill / stroke / label |
| `edgeColor` / `edgeLabelColor` | Connector lines / edge labels |
| `fontFamily` | All text (see Fonts) |
| `customFontUrl` | A custom `@font-face` source (see Fonts) |
| `customIcons` | Map of custom SVG icons (see Icons) |

> When you omit `edgeLabelColor`, Glyphic auto-contrasts it against the background.

## Per-element color

Override an individual node's color via `metadata.color` (the border and text auto-derive for contrast):

```json
{ "id": "cache", "label": "Redis", "shape": "cylinder", "metadata": { "color": "#ef4444" } }
```

Pie slices (`data[].color`), Sankey nodes (`color`), and ERD/Class entities (`color`) take a color directly.

## Fonts

### Google Fonts

Set `fontFamily` to any Google Font name — Glyphic injects the `@import` automatically:

```json
{ "theme": { "fontFamily": "Fira Code" } }
```

`fontFamily` is restricted to letters, numbers, spaces, hyphens, and underscores.

### Custom `.ttf`

Point `customFontUrl` at an **HTTPS** `.ttf`/`.otf`:

```json
{ "theme": { "fontFamily": "MyBrand", "customFontUrl": "https://cdn.example.com/MyBrand.ttf" } }
```

> The SVG references the font by URL. To make a custom font appear in the **rasterized PNG**, also pass the font bytes as the `fontBuffer` argument to [`processDiagram`](./api.md) — resvg cannot fetch remote fonts at rasterization time.

## Icons

### FontAwesome (built in)

Give any node an `icon` using the FontAwesome free **solid** (`fas-`) or **brands** (`fab-`) prefix:

```json
{ "id": "db", "label": "PostgreSQL", "shape": "database", "icon": "fas-database" }
{ "id": "aws", "label": "S3", "shape": "cloud", "icon": "fab-aws" }
```

The crisp vector path is injected directly into the SVG — no plugins or CSS. Unknown icon names are skipped (the node simply renders without an icon).

### Custom SVG icons

Provide your own via `theme.customIcons` (a name → raw SVG map) and reference the name with `icon`:

```json
{
  "theme": { "customIcons": { "my-logo": "<svg viewBox=\"0 0 24 24\">…</svg>" } },
  "nodes": [{ "id": "svc", "label": "My Service", "icon": "my-logo" }]
}
```

Custom SVG is **sanitized** on output (scripts, event handlers, and foreign objects are stripped) so the result is safe to embed in a browser.

## Accessibility

Every rendered SVG includes `role="img"` and a `<title>` derived from the diagram's `title`, so screen readers announce it correctly. Set a meaningful `title` on each diagram.
