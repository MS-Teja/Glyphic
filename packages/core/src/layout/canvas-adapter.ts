import { NodeEdgeDiagramType } from "@glyphic/schema";
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
      shape: node.shape || "rectangle"
    };

    nodes.push(layoutNode);
    nodeMap.set(node.id, layoutNode);
  }

  // Create edges with straight-line routing
  const edges: LayoutEdge[] = diagram.edges.map((e, idx) => {
    const sourceNode = nodeMap.get(e.source);
    const targetNode = nodeMap.get(e.target);

    // Default to 0 if node is missing (should be caught by validation)
    const sx = sourceNode ? sourceNode.x + sourceNode.width / 2 : 0;
    const sy = sourceNode ? sourceNode.y + sourceNode.height / 2 : 0;
    const tx = targetNode ? targetNode.x + targetNode.width / 2 : 0;
    const ty = targetNode ? targetNode.y + targetNode.height / 2 : 0;

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
