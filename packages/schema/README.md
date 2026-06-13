# @glyphic/schema

The **Zod validation layer** for [Glyphic](../../README.md) — the strict, machine-first contract that LLMs target. Install this if you want to validate model output (or any untrusted input) *before* handing it to the renderer, or to generate a JSON Schema for tool definitions.

```bash
npm install @glyphic/schema
```

## Why a schema package?

Glyphic's whole premise is that models emit **JSON, not a DSL**. `@glyphic/schema` is that JSON contract, expressed once as a Zod schema and reused everywhere — `@glyphic/core` validates with it, the MCP server exposes it as a tool's `inputSchema`, and the HTTP API rejects bad payloads with it. Every field carries a `.describe()` so the generated JSON Schema is self-documenting for the model.

## Usage

### Validate input

```typescript
import { DiagramInput } from "@glyphic/schema";

// Throws a ZodError with precise, fixable messages on invalid input.
const diagram = DiagramInput.parse(untrustedJson);

// Or handle errors yourself:
const result = DiagramInput.safeParse(untrustedJson);
if (!result.success) {
  console.error(result.error.issues);
}
```

`DiagramInput` is a **discriminated union** on the `type` field, so validation routes to the right shape automatically:

```jsonc
{ "type": "flowchart", "nodes": [/* ... */], "edges": [/* ... */] }
{ "type": "erd",       "entities": [/* ... */], "relationships": [/* ... */] }
{ "type": "pie",       "data": [/* ... */] }
```

### Generate a JSON Schema (for tool/function definitions)

```typescript
import { DiagramInput } from "@glyphic/schema";
import { zodToJsonSchema } from "zod-to-json-schema";

const jsonSchema = zodToJsonSchema(DiagramInput);
// → feed to an LLM tool definition so the model knows the exact shape.
```

## What's exported

- **`DiagramInput`** — the discriminated union of all 18 types.
- **Per-type schemas** — `NodeEdgeDiagram` (flowchart/architecture), `SequenceDiagram`, `PieChart`, `QuadrantChart`, `Mindmap`, `GanttChart`, `SankeyDiagram`, `GitGraph`, `CanvasDiagram`, `StateDiagram`, `ErdDiagram`, `ClassDiagram`, `TimelineDiagram`, `JourneyDiagram`, `KanbanDiagram`, `C4Diagram`, `TreemapDiagram`, plus `ThemeConfig`.
- **Inferred types** — `DiagramInputType`, `NodeEdgeDiagramType`, `ErdDiagramType`, … (one per schema).
- **`z` and `ZodError`** — re-exported so downstream packages share a single Zod instance (keeps `instanceof ZodError` reliable across the workspace).

## Safety built in

The schema is also the first line of defense:

- `.max()` caps on every array (nodes, edges, entities, elements, …) to bound layout/render cost.
- `customFontUrl` must be a valid **HTTPS** URL; `fontFamily` is restricted to safe characters.
- Recursive `canvas`/`treemap` inputs are bounded by depth and total node count.
- Domain rules (e.g. Gantt tasks need an `end` or `duration`, pie values ≥ 0, journey scores 1–5).

See the full field reference in the [Diagram Types documentation](../../docs/diagram-types.md).

## License

MIT
