# @glyphic/core

The rendering engine for [Glyphic](../../README.md). Takes a validated diagram (JSON) and returns **SVG**, a high-resolution **PNG**, and **React Flow** JSON — with no headless browser.

```bash
npm install @glyphic/core @glyphic/schema
```

## Quick start

```typescript
import { processDiagram } from "@glyphic/core";
import { writeFileSync } from "node:fs";

const result = await processDiagram({
  type: "flowchart",
  title: "Login flow",
  direction: "TB",
  nodes: [
    { id: "start", label: "Visit /login", shape: "rounded" },
    { id: "auth", label: "Valid credentials?", shape: "diamond" },
    { id: "ok", label: "Dashboard", shape: "rectangle" },
    { id: "err", label: "Show error", shape: "rectangle", metadata: { color: "#ef4444" } }
  ],
  edges: [
    { source: "start", target: "auth" },
    { source: "auth", target: "ok", label: "yes" },
    { source: "auth", target: "err", label: "no" }
  ]
});

writeFileSync("login.png", result.png);
writeFileSync("login.svg", result.svg);
```

## API

### `processDiagram(input, fontBuffer?)`

```typescript
function processDiagram(
  input: unknown,
  fontBuffer?: ArrayBuffer
): Promise<RenderResult>;
```

- **`input`** — any value; it is validated with `@glyphic/schema`'s `DiagramInput` and **throws a `ZodError`** if invalid. (You can pass an already-parsed object or raw JSON.)
- **`fontBuffer`** *(optional)* — a `.ttf`/`.otf` buffer embedded into the PNG so a custom font appears in the raster (resvg cannot fetch remote font URLs at rasterization time).

```typescript
interface RenderResult {
  svg: string;                 // scalable vector markup (role="img" + <title>)
  png: Buffer;                 // high-resolution PNG (2× by default)
  metadata: { width: number; height: number };
  reactFlow?: ReactFlowConfig; // node/edge & flow diagrams only
}
```

> `svg` and `png` are always produced. `reactFlow` is included for graph/flow diagrams (not for `pie`, `quadrant`, or `canvas`).

## How it works

```
input ──▶ validate (@glyphic/schema)
      ──▶ layout      (registry → elkjs / d3 / custom adapter)
      ──▶ scene graph (shapes, labels, edges, markers)
      ──▶ SVG         (escaped + sanitized output)
      ──▶ PNG         (@resvg/resvg-js, native)
```

Each diagram type is wired in [`src/registry.ts`](./src/registry.ts), which maps a `type` to its layout adapter and render strategy — the single place to extend. See [CONTRIBUTING](../../CONTRIBUTING.md).

## Theming, fonts &amp; icons

Pass a `theme` (preset string or object), a `fontFamily` / `customFontUrl`, and FontAwesome icons or `customIcons` directly in the diagram JSON. See the [theming guide](../../docs/theming.md).

## Dependencies

`elkjs` (graph layout), `d3-hierarchy` / `d3-sankey` / `d3-shape` (data layouts), `@resvg/resvg-js` (rasterization), and `@fortawesome/*` (icons).

## License

MIT
