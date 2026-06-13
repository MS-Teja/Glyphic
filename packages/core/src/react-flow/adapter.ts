import { LayoutResult, LayoutNode, LayoutEdge } from "../layout/types.js";

export interface ReactFlowNode {
  id: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  type?: string;
  style?: Record<string, any>;
  parentNode?: string;
  extent?: 'parent';
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface ReactFlowConfig {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

export function exportToReactFlow(layout: LayoutResult): ReactFlowConfig {
  const nodes: ReactFlowNode[] = [];
  const edges: ReactFlowEdge[] = [];

  const processNode = (node: LayoutNode, parentId?: string) => {
    nodes.push({
      id: node.id,
      position: { x: node.x, y: node.y },
      data: {
        label: node.label,
        shape: node.shape,
        icon: node.icon,
        metadata: node.metadata,
      },
      type: "custom", // Users will map this to their custom React components
      style: {
        width: node.width,
        height: node.height,
      },
      ...(parentId ? { parentNode: parentId, extent: 'parent' } : {}),
    });

    if (node.children) {
      for (const child of node.children) {
        processNode(child, node.id);
      }
    }
  };

  for (const node of layout.nodes) {
    processNode(node);
  }

  for (const edge of layout.edges) {
    let edgeType = "default";
    if (edge.style === "dashed" || edge.style === "dotted") {
      edgeType = "straight"; // React flow supports straight, step, smoothstep, bezier
    } else {
      edgeType = "smoothstep";
    }

    edges.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: edgeType,
      animated: edge.style === "dashed",
      style: {
        strokeDasharray: edge.style === "dashed" ? "5,5" : edge.style === "dotted" ? "2,2" : "none",
      }
    });
  }

  return { nodes, edges };
}
