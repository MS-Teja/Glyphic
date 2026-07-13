import { type LayoutResult, type LayoutNode, LayoutEdge } from "../layout/types.js";

export interface ReactFlowNode {
  id: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  type?: string;
  style?: Record<string, any>;
  parentId?: string;
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

  // LayoutNode.x/y are always absolute (the same convention the SVG renderer
  // uses — see scene-builder.ts's buildNodeShape, which draws every node,
  // nested or not, straight off node.x/y in one shared coordinate space).
  // React Flow's `parentId`/`extent: 'parent'` mechanism instead expects a
  // child's `position` to be relative to its parent, so nested nodes need the
  // parent's absolute origin subtracted out — otherwise React Flow adds the
  // parent's position back on top, pushing every descendant off to the side.
  const processNode = (node: LayoutNode, parentId?: string, parentAbsX = 0, parentAbsY = 0) => {
    nodes.push({
      id: node.id,
      position: { x: node.x - parentAbsX, y: node.y - parentAbsY },
      data: {
        label: node.label,
        shape: node.shape,
        icon: node.icon,
        metadata: node.metadata,
        // Lets a consumer style a container (e.g. a "Kubernetes Cluster"
        // boundary) differently from a leaf node — the same distinction the
        // SVG renderer draws in scene-builder.ts's buildNodeLabel.
        isGroup: !!(node.children && node.children.length > 0),
      },
      type: "custom", // Users will map this to their custom React components
      style: {
        width: node.width,
        height: node.height,
      },
      ...(parentId ? { parentId, extent: 'parent' } : {}),
    });

    if (node.children) {
      for (const child of node.children) {
        processNode(child, node.id, node.x, node.y);
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
