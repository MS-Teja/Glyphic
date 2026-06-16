import { ErdDiagramType } from "@glyphicjs/schema";
import { LayoutResult } from "./types.js";
import { layoutNodeEdgeDiagram } from "./elk-adapter.js";

// Map ERD cardinality to an existing crow's-foot marker (drawn at the target end).
const cardinalityToArrow = (c?: string): string => {
  switch (c) {
    case "one-to-one":
      return "one-one";
    case "one-to-many":
    case "many-to-one":
      return "crow-one";
    case "many-to-many":
    case "zero-or-many":
      return "crow-zero-many";
    case "zero-or-one":
      return "zero-one";
    default:
      return "crow";
  }
};

// Entities render as `table`-shape nodes; attributes become column rows.
export function layoutErdDiagram(diagram: ErdDiagramType): Promise<LayoutResult> {
  const nodes = diagram.entities.map((e) => ({
    id: e.id,
    label: e.label ?? e.id,
    shape: "table",
    metadata: {
      color: e.color,
      columns: (e.attributes ?? []).map(
        (a) => `${a.key ? a.key + " " : ""}${a.name}${a.type ? ": " + a.type : ""}`
      )
    }
  }));

  const edges = diagram.relationships.map((r) => ({
    source: r.from,
    target: r.to,
    label: r.label,
    arrow: cardinalityToArrow(r.cardinality),
    style: "solid"
  }));

  return layoutNodeEdgeDiagram({
    type: "erd",
    direction: diagram.direction ?? "LR",
    routing: "orthogonal",
    nodes,
    edges
  } as any);
}
