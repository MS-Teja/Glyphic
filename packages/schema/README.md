# @glyphic/schema

The `@glyphic/schema` package contains the strict Zod specifications and TypeScript definitions for Glyphic's Machine-First Diagramming Infrastructure.

Glyphic is designed to take declarative, semantic JSON structures and perfectly render complex SVG or PNG diagrams, completely bypassing headless browsers and manual positioning.

## Supported Diagram Types

Glyphic currently supports 11+ different diagram types:
- `flowchart`
- `architecture`
- `sequence`
- `erd`
- `class`
- `state`
- `gantt`
- `sankey`
- `mindmap`
- `pie`
- `quadrant`
- `git`
- `canvas` (Absolute positioning override)

## Example Usage

```ts
import { DiagramInput, DiagramInputType } from "@glyphic/schema";

const rawInput = {
  type: "flowchart",
  nodes: [
    { id: "a", label: "Start" },
    { id: "b", label: "End" }
  ],
  edges: [
    { source: "a", target: "b", label: "Proceed" }
  ]
};

// Validates the input against strict Zod rules
const payload: DiagramInputType = DiagramInput.parse(rawInput);
```

## Advanced Theming & Icons

Glyphic schemas allow deep customization without breaking the layout engines:

```json
{
  "type": "architecture",
  "theme": {
    "background": "#0f172a",
    "text": "#f8fafc",
    "primary": "#3b82f6",
    "fontFamily": "Inter"
  },
  "nodes": [
    {
      "id": "db",
      "label": "Users Database",
      "shape": "database",
      "icon": "fas-database",
      "metadata": {
        "color": "#10b981"
      }
    }
  ]
}
```

The schema fully supports dynamic FontAwesome icons (`fas-*` or `fab-*`) natively!
