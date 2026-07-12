import type { NodeEdgeDiagramType } from "@glyphicjs/schema";
import type { LayoutResult, LayoutNode, LayoutEdge, LayoutEdgeSegment } from "./types.js";
import { unknownIdError } from "./validation.js";

// A direct canvas layout adapter that bypasses ELK auto-layout.
// It explicitly uses the x, y, width, and height provided by the LLM in the schema.
// Edges are simply drawn straight between centers. pure-svg.ts will automatically
// calculate exact perimeter intersections so lines don't bleed into the shapes.
export async function layoutCanvasDiagram(diagram: NodeEdgeDiagramType): Promise<LayoutResult> {
  const nodes: LayoutNode[] = [];
  const nodeMap = new Map<string, LayoutNode>();

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  // Process nodes
  for (const node of diagram.nodes) {
    const width = node.width || 140;
    const height = node.height || 70;
    const x = node.x ?? 0;
    const y = node.y ?? 0;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);

    const layoutNode: LayoutNode = {
      id: node.id,
      x,
      y,
      width,
      height,
      label: node.label,
      shape: node.shape || "rectangle",
      // Preserve icon and metadata so explicitly-positioned nodes render icons
      // and per-node colors just like auto-laid-out ones.
      icon: node.icon,
      metadata: node.metadata ? { ...node.metadata } : undefined
    };

    nodes.push(layoutNode);
    nodeMap.set(node.id, layoutNode);
  }

  // Fail fast on edges referencing missing nodes rather than silently dropping
  // them (which would draw nothing) or emitting degenerate (0,0) lines.
  diagram.edges.forEach((e, idx) => {
    if (!nodeMap.has(e.source))
      throw unknownIdError({ kind: "Edge", index: idx, field: "source", badId: e.source, knownIds: nodeMap.keys() });
    if (!nodeMap.has(e.target))
      throw unknownIdError({ kind: "Edge", index: idx, field: "target", badId: e.target, knownIds: nodeMap.keys() });
  });

  // Create edges with straight-line routing.
  const edges: LayoutEdge[] = diagram.edges
    .map((e, idx) => {
    const sourceNode = nodeMap.get(e.source)!;
    const targetNode = nodeMap.get(e.target)!;

    const sx = sourceNode.x + sourceNode.width / 2;
    const sy = sourceNode.y + sourceNode.height / 2;
    const tx = targetNode.x + targetNode.width / 2;
    const ty = targetNode.y + targetNode.height / 2;

    const segment: LayoutEdgeSegment = {
      startPoint: { x: sx, y: sy },
      endPoint: { x: tx, y: ty },
      bendPoints: [] // Straight line
    };

    return {
      id: `e${idx}`,
      source: e.source,
      target: e.target,
      label: e.label,
      style: e.style || "solid",
      arrow: e.arrow || "forward",
      sections: [segment]
    };
  });

  return {
    width: maxX === Number.NEGATIVE_INFINITY ? 800 : maxX + 40,
    height: maxY === Number.NEGATIVE_INFINITY ? 600 : maxY + 40,
    nodes,
    edges
  };
}
