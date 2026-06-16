import { StateDiagramType } from "@glyphicjs/schema";
import { LayoutResult } from "./types.js";
import { layoutNodeEdgeDiagram } from "./elk-adapter.js";

const kindToShape = (kind?: string): string =>
  kind === "initial" ? "state_start" : kind === "final" ? "state_end" : "rounded";

// State diagrams are node/edge graphs: states -> nodes, transitions -> edges.
export function layoutStateDiagram(diagram: StateDiagramType): Promise<LayoutResult> {
  const nodes = diagram.states.map((s) => ({
    id: s.id,
    label: s.label ?? s.id,
    shape: kindToShape(s.kind),
    groupId: s.parent
  }));

  const edges = diagram.transitions.map((t) => ({
    source: t.from,
    target: t.to,
    label: t.label,
    arrow: "forward",
    style: "solid"
  }));

  return layoutNodeEdgeDiagram({
    type: "state",
    direction: diagram.direction ?? "TB",
    routing: "orthogonal",
    nodes,
    edges
  } as any);
}
