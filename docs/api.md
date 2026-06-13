# Core API (`@glyphic/core`)

The library entry point for rendering diagrams in your own Node application.

```bash
npm install @glyphic/core @glyphic/schema
```

## `processDiagram(input, fontBuffer?)`

```typescript
import { processDiagram } from "@glyphic/core";

function processDiagram(
  input: unknown,
  fontBuffer?: ArrayBuffer
): Promise<RenderResult>;
```

### Parameters

| Param | Type | Notes |
|---|---|---|
| `input` | `unknown` | A diagram object (or raw JSON). Validated against `DiagramInput`; **throws `ZodError`** if invalid. |
| `fontBuffer` | `ArrayBuffer?` | Optional `.ttf`/`.otf` bytes embedded into the **PNG** so a custom font appears in the raster. (The SVG references fonts by name/URL; resvg can't fetch remote fonts at rasterization time.) |

### Returns `RenderResult`

```typescript
interface RenderResult {
  svg: string;                 // scalable vector markup (includes role="img" + <title>)
  png: Buffer;                 // high-resolution PNG (rendered at 2× by default)
  metadata: { width: number; height: number };
  reactFlow?: ReactFlowConfig; // present for node/edge & flow diagrams
}
```

- `svg` and `png` are **always** produced.
- `reactFlow` is present for graph/flow diagrams and omitted for `pie`, `quadrant`, and `canvas`.

## Examples

### Render to files

```typescript
import { processDiagram } from "@glyphic/core";
import { writeFileSync } from "node:fs";

const result = await processDiagram({
  type: "erd",
  title: "Blog schema",
  entities: [
    { id: "users", attributes: [{ name: "id", type: "uuid", key: "PK" }] },
    { id: "posts", attributes: [{ name: "id", type: "uuid", key: "PK" }, { name: "author_id", type: "uuid", key: "FK" }] }
  ],
  relationships: [{ from: "users", to: "posts", cardinality: "one-to-many", label: "writes" }]
});

writeFileSync("erd.svg", result.svg);
writeFileSync("erd.png", result.png);
```

### Validate first (handle errors yourself)

```typescript
import { DiagramInput } from "@glyphic/schema";
import { processDiagram } from "@glyphic/core";

const parsed = DiagramInput.safeParse(modelOutput);
if (!parsed.success) {
  // surface parsed.error.issues back to the model to self-correct
  return;
}
const result = await processDiagram(parsed.data);
```

### Embed a custom font in the PNG

```typescript
import { readFileSync } from "node:fs";

const ttf = readFileSync("./Outfit.ttf");
const result = await processDiagram(
  { type: "flowchart", theme: { fontFamily: "Outfit" }, nodes: [{ id: "a", label: "Hi" }], edges: [] },
  ttf.buffer
);
```

## Error handling

- **Invalid input** → `ZodError` (from `processDiagram`'s internal `DiagramInput.parse`). Inspect `err.issues`.
- **Rasterization failure** → `RasterizationError` (exported from `@glyphic/core`) wrapping the underlying resvg error.

```typescript
import { processDiagram, RasterizationError } from "@glyphic/core";
import { ZodError } from "@glyphic/schema";

try {
  await processDiagram(input);
} catch (err) {
  if (err instanceof ZodError) { /* invalid diagram */ }
  else if (err instanceof RasterizationError) { /* SVG → PNG failed */ }
}
```

See the [Diagram Types reference](./diagram-types.md) for every input shape and [Theming](./theming.md) for styling.
