import { ClassDiagramType } from "@glyphic/schema";
import { LayoutResult } from "./types.js";
import { layoutNodeEdgeDiagram } from "./elk-adapter.js";

// Map a UML relationship to an existing marker; dashed for implements/dependency.
const relToArrow = (type?: string): string => {
  switch (type) {
    case "inheritance":
    case "extends":
    case "implements":
      return "inheritance";
    case "composition":
      return "composition";
    case "aggregation":
      return "aggregation";
    case "dependency":
      return "dependency";
    default:
      return "forward";
  }
};

const isDashed = (type?: string): boolean => type === "implements" || type === "dependency";

// Classes render as `class`-shape nodes; attributes/methods become rows.
export function layoutClassDiagram(diagram: ClassDiagramType): Promise<LayoutResult> {
  const nodes = diagram.classes.map((c) => ({
    id: c.id,
    label: c.label ?? c.id,
    shape: "class",
    metadata: {
      color: c.color,
      attributes: c.attributes ?? [],
      methods: c.methods ?? []
    }
  }));

  const edges = diagram.relationships.map((r) => ({
    source: r.from,
    target: r.to,
    label: r.label,
    arrow: relToArrow(r.type),
    style: isDashed(r.type) ? "dashed" : "solid"
  }));

  return layoutNodeEdgeDiagram({
    type: "class",
    direction: diagram.direction ?? "TB",
    routing: "orthogonal",
    nodes,
    edges
  } as any);
}
