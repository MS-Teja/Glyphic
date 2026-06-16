import { NodeEdgeDiagramType } from "@glyphicjs/schema";
import { LayoutResult, LayoutNode, LayoutEdge, LayoutEdgeSegment } from "./types.js";

// A direct canvas layout adapter that bypasses ELK auto-layout.
// It explicitly uses the x, y, width, and height provided by the LLM in the schema.
// Edges are simply drawn straight between centers. pure-svg.ts will automatically
// calculate exact perimeter intersections so lines don't bleed into the shapes.
export async function layoutCanvasDiagram(diagram: NodeEdgeDiagramType): Promise<LayoutResult> {
  const nodes: LayoutNode[] = [];
  const nodeMap = new Map<string, LayoutNode>();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

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

  // Create edges with straight-line routing. Skip edges referencing missing
  // nodes rather than drawing degenerate (0,0) lines.
  const edges: LayoutEdge[] = diagram.edges
    .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
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
    width: maxX === -Infinity ? 800 : maxX + 40,
    height: maxY === -Infinity ? 600 : maxY + 40,
    nodes,
    edges
  };
}
