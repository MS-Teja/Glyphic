import ELK from "elkjs/lib/elk.bundled.js";
import { NodeEdgeDiagramType } from "@glyphic/schema";
import { LayoutResult, LayoutNode, LayoutEdge, LayoutEdgeSegment } from "./types.js";
import { measureTextWidth, wrapTextToWidth } from "../text-metrics.js";

const elk = new ELK();

// Default sizes based on shape type
const getDimensions = (shape: string) => {
  switch (shape) {
    case "database":
    case "cylinder":
      return { width: 120, height: 140 };
    case "diamond":
      return { width: 130, height: 130 };
    case "hexagon":
      return { width: 140, height: 70 };
    case "person":
      return { width: 100, height: 140 };
    default:
      return { width: 140, height: 70 };
  }
};

export async function layoutNodeEdgeDiagram(diagram: NodeEdgeDiagramType): Promise<LayoutResult> {
  const direction = diagram.direction === "TB" ? "DOWN" :
                    diagram.direction === "BT" ? "UP" :
                    diagram.direction === "LR" ? "RIGHT" : "LEFT";

  // Process nodes to support nesting (groupId)
  const nodeMap = new Map<string, any>();
  const rootNodes: any[] = [];

  for (const node of diagram.nodes) {
    let dim = getDimensions(node.shape);
    
    // Dynamic dimensions for new shapes
    if (node.shape === "table" || node.shape === "class") {
      let dynamicHeight = (node.shape === "class" && node.icon) ? 44 : 30; // Title bar height (matches render: 44px with icon, 30px without)
      let maxChars = node.label ? node.label.length : 0;
      if (node.metadata) {
         let rowCount = 0;
         if (node.shape === "class" || node.shape === "table") {
           for (const key of ["attributes", "methods", "columns"]) {
             const arr = (node.metadata as any)[key];
             if (Array.isArray(arr)) {
               rowCount += arr.length;
               for (const item of arr) maxChars = Math.max(maxChars, String(item).length);
             }
           }
         } else {
           for (const [key, val] of Object.entries(node.metadata)) {
             if (Array.isArray(val)) {
               rowCount += val.length;
               for (const item of val) maxChars = Math.max(maxChars, String(item).length);
             } else {
               rowCount += 1;
               maxChars = Math.max(maxChars, (String(key) + ": " + String(val)).length);
             }
           }
         }
         const padding = node.shape === "class" ? 16 : 8;
         dynamicHeight += rowCount * 24 + padding;
      } else {
         dynamicHeight = 70; // minimum for empty table/class
      }
      const dynamicWidth = Math.max(180, maxChars * 8 + 30);
      dim = { width: dynamicWidth, height: dynamicHeight };
    }

    // Dynamic height for wrapped text in regular shapes
    if (node.label && node.shape !== "table" && node.shape !== "class") {
      const explicitLines = node.label.split('\n');
      let maxLineWidth = 0;
      for (const el of explicitLines) {
        maxLineWidth = Math.max(maxLineWidth, measureTextWidth(el, 14, 600));
      }
      // Ensure width fits the longest explicit line without breaking words
      dim.width = Math.max(dim.width, maxLineWidth + 30);

      let totalLines = 0;
      for (const el of explicitLines) {
        totalLines += wrapTextToWidth(el, dim.width - 24, 14, 600).length;
      }

      // If text wraps to more than 2 lines overall, expand the height to accommodate
      if (totalLines > 2) {
        dim.height += (totalLines - 2) * 18;
      }
    }
    
    // Add extra padding if node has an icon
    if (node.icon && node.shape !== "person" && node.shape !== "class") {
      dim.height += 40; // Space for icon
      dim.width = Math.max(dim.width, 140); // Ensure width is enough for icon + text
    }

    if (node.shape === "hexagon" || node.shape === "diamond" || node.shape === "cloud") {
      dim.width += 30;
      dim.height += 20;
    }

    const elkNode: any = {
      ...node,
      id: node.id,
      width: node.width || dim.width,
      height: node.height || dim.height,
      layoutOptions: {
        "elk.padding": "[top=40,left=40,bottom=40,right=40]", // Padding for groups
        "elk.direction": direction,
        "elk.alignment": "CENTER",
        "elk.nodeLabels.placement": "INSIDE V_TOP H_CENTER"
      },
      children: []
    };
    if (node.label) {
      elkNode.labels = [{ text: node.label, width: node.label.length * 8 + 10, height: 20 }];
    }
    nodeMap.set(node.id, elkNode);
  }

  // Build hierarchy
  for (const node of diagram.nodes) {
    const elkNode = nodeMap.get(node.id);
    if (node.groupId && nodeMap.has(node.groupId)) {
      const parent = nodeMap.get(node.groupId);
      parent.children.push(elkNode);
      delete parent.width;
      delete parent.height;
    } else {
      rootNodes.push(elkNode);
    }
  }

  const edges = diagram.edges.map((e, idx) => {
    let textWidth = 0;
    let textHeight = 0;
    if (e.label) {
      const maxEdgeChars = 14;
      const edgeWords = e.label.split(" ");
      let maxLen = 0;
      let curLine = "";
      let lines = 0;
      for (const w of edgeWords) {
        if ((curLine + " " + w).trim().length > maxEdgeChars) {
          if (curLine) { lines++; maxLen = Math.max(maxLen, curLine.length); }
          curLine = w;
        } else {
          curLine = curLine ? curLine + " " + w : w;
        }
      }
      if (curLine) { lines++; maxLen = Math.max(maxLen, curLine.length); }
      textWidth = maxLen * 6.0 + 8;
      textHeight = lines * 14 - 4;
    }

    return {
      id: `e${idx}`,
      sources: [e.source],
      targets: [e.target],
      labels: e.label ? [{ text: e.label, width: textWidth + 10, height: textHeight + 10 }] : undefined
    };
  });

  const algorithm = (diagram as any).algorithm || "layered";

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": algorithm,
      "elk.direction": direction,
      "elk.spacing.nodeNode": "60",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.spacing.edgeNode": "30",
      "elk.spacing.edgeEdge": "30",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "30",
      "elk.spacing.portPort": "40",
      "elk.spacing.nodeSelfLoop": "40",
      "elk.edgeLabels.inline": "true",
      "elk.edgeLabels.placement": "CENTER",
      "elk.edgeRouting": algorithm === "radial" ? "SPLINES" : (diagram.routing ? diagram.routing.toUpperCase() : "ORTHOGONAL"),
      "elk.hierarchyHandling": "INCLUDE_CHILDREN"
    },
    children: rootNodes,
    edges: edges
  };

  const layout = await elk.layout(graph);
  
  // Removed TEMP DEBUG file write to prevent EROFS errors in MCP environments

  // 1. Build parentMap and directed adjacency list
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of diagram.nodes) {
    adj.set(node.id, []);
    inDegree.set(node.id, 0);
  }
  for (const edge of diagram.edges) {
    const s = edge.source;
    const t = edge.target;
    if (adj.has(s) && adj.has(t)) {
      adj.get(s)!.push(t);
      inDegree.set(t, (inDegree.get(t) || 0) + 1);
    }
  }

  // Find root of the mindmap/diagram
  let rootId = "root";
  if (!adj.has(rootId) && diagram.nodes.length > 0) {
    let minInDegree = Infinity;
    for (const [id, deg] of inDegree.entries()) {
      if (deg < minInDegree) {
        minInDegree = deg;
        rootId = id;
      }
    }
  }

  // Assign branchIndex to nodes using DFS
  const idToBranchIndex = new Map<string, number>();
  const directChildren = adj.get(rootId) || [];
  directChildren.forEach((childId, i) => {
    const stack = [childId];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const curr = stack.pop()!;
      if (visited.has(curr)) continue;
      visited.add(curr);
      idToBranchIndex.set(curr, i);
      const kids = adj.get(curr) || [];
      for (const kid of kids) {
        if (!visited.has(kid)) {
          stack.push(kid);
        }
      }
    }
  });

  const nodeCoords = new Map<string, { x: number, y: number }>();

  // O(1) lookups back to the original input (avoids O(n^2) find() per node/edge).
  const originalNodeMap = new Map(diagram.nodes.map((n) => [n.id, n] as const));
  const edgeIdMap = new Map(diagram.edges.map((e, idx) => ["e" + idx, e] as const));

  // 6 distinct colors for mindmap branches
  const mindmapColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  // Transform ELK output back to our LayoutResult
  const mapElkNode = (n: any, offsetX: number = 0, offsetY: number = 0, depth: number = 0, branchIndex: number = -1): LayoutNode => {
    const absX = n.x + offsetX;
    const absY = n.y + offsetY;
    
    // Store resolved absolute coordinates
    nodeCoords.set(n.id, { x: absX, y: absY });

    const mapChildren = (childNode: any, idx: number) => {
      let childBranchIndex = branchIndex;
      if (algorithm === "radial" && depth === 0) {
        childBranchIndex = idx;
      }
      return mapElkNode(childNode, absX, absY, depth + 1, childBranchIndex);
    };

    const node: LayoutNode = {
      id: n.id,
      x: absX,
      y: absY,
      width: n.width,
      height: n.height,
      label: n.label || "",
      shape: n.shape || "rectangle",
      icon: n.icon,
      children: n.children ? n.children.map(mapChildren) : undefined,
      metadata: {}
    };

    // Keep existing metadata if we have a match
    const originalNode = originalNodeMap.get(n.id);
    if (originalNode && originalNode.metadata) {
      node.metadata = { ...originalNode.metadata };
    }
    
    // Copy icon
    if (originalNode && originalNode.icon) {
      node.icon = originalNode.icon;
    }

    // Apply mindmap color based on branch traversal
    const finalBranchIdx = idToBranchIndex.has(n.id) ? idToBranchIndex.get(n.id)! : branchIndex;
    if (algorithm === "radial" && finalBranchIdx > -1) {
      node.metadata!.color = mindmapColors[finalBranchIdx % mindmapColors.length];
    }

    return node;
  };

  const mappedNodes = layout.children ? layout.children.map((n: any) => mapElkNode(n, 0, 0, 0, -1)) : [];
  
  const mappedEdges: LayoutEdge[] = [];
  
  const extractEdges = (n: any) => {
    if (n.edges) {
      n.edges.forEach((e: any) => {
        // ELK may route the edge in a specific container, indicated by e.container.
        const containerId = e.container || n.id;
        const edgeOffsetX = containerId === "root" ? 0 : (nodeCoords.get(containerId)?.x || 0);
        const edgeOffsetY = containerId === "root" ? 0 : (nodeCoords.get(containerId)?.y || 0);
        const src = e.sources?.[0];
        const tgt = e.targets?.[0];

        const sections: LayoutEdgeSegment[] = (e.sections || []).map((sec: any) => ({
          startPoint: { x: sec.startPoint.x + edgeOffsetX, y: sec.startPoint.y + edgeOffsetY },
          endPoint: { x: sec.endPoint.x + edgeOffsetX, y: sec.endPoint.y + edgeOffsetY },
          bendPoints: (sec.bendPoints || []).map((bp: any) => ({
            x: bp.x + edgeOffsetX, y: bp.y + edgeOffsetY
          }))
        }));
        
        let labelPosition = undefined;
        if (e.labels && e.labels.length > 0) {
          labelPosition = {
            x: e.labels[0].x + edgeOffsetX,
            y: e.labels[0].y + edgeOffsetY
          };
        }

        // Recover the exact original edge by its id (handles parallel edges
        // that share the same source/target).
        const originalEdge = edgeIdMap.get(e.id);

        mappedEdges.push({
          id: e.id,
          source: e.sources[0],
          target: e.targets[0],
          label: originalEdge?.label,
          style: originalEdge?.style || "solid",
          arrow: originalEdge?.arrow || "forward",
          metadata: originalEdge?.metadata,
          labelPosition,
          sections
        });
      });
    }
    
    if (n.children) {
      n.children.forEach((child: any) => {
        extractEdges(child);
      });
    }
  };

  extractEdges(layout);

  return {
    width: layout.width ?? 800,
    height: layout.height ?? 600,
    nodes: mappedNodes,
    edges: mappedEdges
  };
}
