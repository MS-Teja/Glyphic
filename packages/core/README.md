# @glyphic/core

The heart of the Glyphic diagramming infrastructure. This package houses the mathematical layout adapters and the pure SVG rendering pipeline.

It takes declarative JSON structures validated by `@glyphic/schema` and outputs precisely calculated coordinates, native SVG strings, high-resolution PNG buffers, and React Flow representations.

## How it works under the hood

When you call `processDiagram(payload)`, the engine performs a massive amount of invisible labor:

1. **Adapter Selection:** It looks at `payload.type` (e.g. `architecture`, `sequence`, `gantt`) and selects the appropriate mathematical adapter.
2. **Topological Layout:** 
   - For `flowchart` and `architecture`, it uses a custom `elkjs` adapter to calculate the lowest common ancestors for nested VPCs/groups, route edges orthogonally around shapes, and prevent edge/label intersections.
   - For `sankey`, it uses `d3-sankey` to assign proportional link weights.
   - For `sequence`, it plots a grid matrix of messages against lifelines.
3. **Scene Building:** It maps the raw X/Y coordinates into a `SceneGraph` object, calculating precise arrowhead geometry perimeters so arrows cleanly dock onto circles, diamonds, or database shapes without bleeding into them.
4. **Rasterization:** It transforms the SceneGraph into an inline XML SVG string and passes it into the Rust-powered `@resvg/resvg-js` to instantly drop a crisp PNG buffer.

## Installation

```bash
npm install @glyphic/core
```

## Basic Usage

```typescript
import { processDiagram } from "@glyphic/core";

const payload = {
  type: "mindmap",
  nodes: [
    { id: "core", label: "Central Idea" },
    { id: "sub", label: "Subtopic" }
  ],
  edges: [
    { source: "core", target: "sub" }
  ]
};

// Generates layout and graphics
const result = await processDiagram(payload);

// You have access to:
console.log(result.svg);        // Raw SVG string
console.log(result.png);        // Buffer (can be saved directly to a file)
console.log(result.reactFlow);  // Raw coordinates ready for React Flow
```

## Supported Shape Identifiers

The engine natively knows how to draw the following mathematical paths perfectly (even when resized):
- `rectangle`
- `rounded`
- `cylinder`
- `database`
- `cloud`
- `diamond`
- `hexagon`
- `person` (actor)
- `browser`
- `table`
- `class`

If you supply an `icon: "fas-server"`, it will automatically inject the corresponding FontAwesome SVG vector data directly into the shape!
