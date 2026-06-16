import { C4DiagramType } from "@glyphicjs/schema";
import { LayoutResult } from "./types.js";
import { layoutNodeEdgeDiagram } from "./elk-adapter.js";

// C4 element kind -> node shape (reuses the existing shape renderers).
const KIND_SHAPE: Record<string, string> = {
  person: "person",
  system: "rounded",
  external: "rounded",
  container: "rectangle",
  database: "database",
  boundary: "rounded"
};

// Conventional C4 colors (boundary inherits the theme).
const KIND_COLOR: Record<string, string | undefined> = {
  person: "#08427b",
  system: "#1168bd",
  external: "#8b8b8b",
  container: "#438dd5",
  database: "#3b5bdb",
  boundary: undefined
};

export function layoutC4Diagram(diagram: C4DiagramType): Promise<LayoutResult> {
  const nodes = diagram.elements.map((e) => ({
    id: e.id,
    label: e.description ? `${e.label}\n${e.description}` : e.label,
    shape: KIND_SHAPE[e.kind] ?? "rounded",
    groupId: e.parent,
    metadata: { color: KIND_COLOR[e.kind] }
  }));

  const edges = diagram.relationships.map((r) => ({
    source: r.from,
    target: r.to,
    label: r.technology ? `${r.label ?? ""} [${r.technology}]`.trim() : r.label,
    arrow: "forward",
    style: "solid"
  }));

  return layoutNodeEdgeDiagram({
    type: "c4",
    direction: diagram.direction ?? "TB",
    routing: "orthogonal",
    nodes,
    edges
  } as any);
}
