import ELK from "elkjs/lib/elk.bundled.js";
import type { NodeEdgeDiagramType } from "@glyphicjs/schema";
import type { LayoutResult, LayoutNode, LayoutEdge, LayoutEdgeSegment } from "./types.js";
import { unknownIdError } from "./validation.js";
import { measureTextWidth, wrapTextToWidth } from "../text-metrics.js";
import { type StyleTokens, DEFAULT_STYLE } from "../render/style.js";

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

// `algorithm` is not schema-borne: registry.ts injects it post-parse to force
// mindmaps onto ELK's radial layout. Model it as an optional extension rather
// than reaching through `as any`.
type NodeEdgeLayoutInput = NodeEdgeDiagramType & { algorithm?: string };

// ELK's hierarchical edge routing (edges crossing a compound/group node's
// boundary, e.g. from a nested service out to a sibling of its container)
// stitches per-level segments together in a pass that skips its own
// edge-edge spacing solver — so two unrelated edges' orthogonal trunks can
// land a few px apart regardless of elk.spacing.edgeEdge. This walks every
// edge's raw point sequence, finds axis-aligned segments (from different
// edges) that run too close over an overlapping range, and fans them out.
// Shifting only the shared perpendicular coordinate keeps each edge's path
// orthogonal for free: a horizontal run's neighbors are vertical, so they
// only ever compare x — nudging y never breaks them, and vice versa.
const OVERLAP_TOLERANCE = 0.5;
const MIN_SEGMENT_GAP = 24;
const SEGMENT_SPACING = 24;
// Shifted trunks must keep this much clearance from leaf-node boxes.
const NODE_CLEARANCE = 8;

interface OrthoSegmentRef {
  edgeIdx: number;
  points: { x: number; y: number }[];
  i: number;
  orientation: "h" | "v";
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Leaf nodes only: group containers legitimately have edges routed through
// their interior, so they are not obstacles for the separation pass.
function collectLeafRects(nodes: LayoutNode[], out: Rect[] = []): Rect[] {
  for (const n of nodes) {
    if (n.children && n.children.length > 0) {
      collectLeafRects(n.children, out);
    } else {
      out.push({ x: n.x, y: n.y, w: n.width, h: n.height });
    }
  }
  return out;
}

// Distance from a point to an axis-aligned segment (for deciding whether an
// edge label belongs to a segment that is about to be shifted).
function distToOrthoSegment(p: { x: number; y: number }, p0: { x: number; y: number }, p1: { x: number; y: number }): number {
  const cx = Math.min(Math.max(p.x, Math.min(p0.x, p1.x)), Math.max(p0.x, p1.x));
  const cy = Math.min(Math.max(p.y, Math.min(p0.y, p1.y)), Math.max(p0.y, p1.y));
  return Math.hypot(p.x - cx, p.y - cy);
}

function segmentsTooClose(a: OrthoSegmentRef, b: OrthoSegmentRef): boolean {
  const ap0 = a.points[a.i];
  const ap1 = a.points[a.i + 1];
  const bp0 = b.points[b.i];
  const bp1 = b.points[b.i + 1];
  if (a.orientation === "h") {
    if (Math.abs(ap0.y - bp0.y) > MIN_SEGMENT_GAP) return false;
    const aMin = Math.min(ap0.x, ap1.x);
    const aMax = Math.max(ap0.x, ap1.x);
    const bMin = Math.min(bp0.x, bp1.x);
    const bMax = Math.max(bp0.x, bp1.x);
    return aMax > bMin && bMax > aMin;
  }
  if (Math.abs(ap0.x - bp0.x) > MIN_SEGMENT_GAP) return false;
  const aMin = Math.min(ap0.y, ap1.y);
  const aMax = Math.max(ap0.y, ap1.y);
  const bMin = Math.min(bp0.y, bp1.y);
  const bMax = Math.max(bp0.y, bp1.y);
  return aMax > bMin && bMax > aMin;
}

// Exported for unit tests only — layoutNodeEdgeDiagram is the real caller.
export function separateOverlappingOrthogonalSegments(edges: LayoutEdge[], nodes: LayoutNode[]): void {
  const leafRects = collectLeafRects(nodes);
  const segments: OrthoSegmentRef[] = [];

  edges.forEach((edge, edgeIdx) => {
    for (const sec of edge.sections) {
      // A plain array of references — mutating a point here mutates the
      // real section object (startPoint/bendPoints/endPoint are shared, not
      // copied), so every segment touching that point sees the shift.
      const points = [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint];
      // Terminal segments (touching startPoint/endPoint) are anchored to a
      // node port and must never be shifted perpendicular — that detaches
      // the edge from its node, leaving tails floating in empty space (e.g.
      // a wide fan-out's stubs all leave the same node a few px apart, which
      // is legitimate, not an overlap). Shifting a terminal segment's
      // neighboring trunk is safe: it only lengthens the anchored stub along
      // its own axis.
      for (let i = 1; i < points.length - 2; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const dx = Math.abs(p0.x - p1.x);
        const dy = Math.abs(p0.y - p1.y);
        if (dy <= OVERLAP_TOLERANCE && dx > OVERLAP_TOLERANCE) {
          segments.push({ edgeIdx, points, i, orientation: "h" });
        } else if (dx <= OVERLAP_TOLERANCE && dy > OVERLAP_TOLERANCE) {
          segments.push({ edgeIdx, points, i, orientation: "v" });
        }
      }
    }
  });

  const used = new Array(segments.length).fill(false);
  for (let a = 0; a < segments.length; a++) {
    if (used[a]) continue;
    const cluster = [segments[a]];
    used[a] = true;
    let grew = true;
    while (grew) {
      grew = false;
      for (let b = 0; b < segments.length; b++) {
        if (used[b] || segments[b].orientation !== cluster[0].orientation) continue;
        if (cluster.some((s) => segmentsTooClose(s, segments[b]))) {
          cluster.push(segments[b]);
          used[b] = true;
          grew = true;
        }
      }
    }

    const perEdge = new Map<number, OrthoSegmentRef[]>();
    for (const s of cluster) {
      if (!perEdge.has(s.edgeIdx)) perEdge.set(s.edgeIdx, []);
      perEdge.get(s.edgeIdx)!.push(s);
    }
    if (perEdge.size < 2) continue; // only the same edge crossing itself — leave it alone

    const orientation = cluster[0].orientation;
    const constantOf = (s: OrthoSegmentRef) => (orientation === "h" ? s.points[s.i].y : s.points[s.i].x);
    const ordered = Array.from(perEdge.entries())
      .map(([edgeIdx, segs]) => ({ edgeIdx, segs, constant: constantOf(segs[0]) }))
      .sort((x, y) => x.constant - y.constant);

    // Free corridor for one entry's shifted constant: the original constant
    // is collision-free (ELK routed there), so walk outward to the nearest
    // leaf-node box whose span overlaps any of the entry's segments and stop
    // NODE_CLEARANCE short of it. A clamped shift may leave residual overlap
    // between edges, but a trunk through a node box is worse.
    const corridorFor = (segs: OrthoSegmentRef[], orig: number): { lower: number; upper: number } => {
      let lower = Number.NEGATIVE_INFINITY;
      let upper = Number.POSITIVE_INFINITY;
      for (const s of segs) {
        const p0 = s.points[s.i];
        const p1 = s.points[s.i + 1];
        const lo = orientation === "h" ? Math.min(p0.x, p1.x) : Math.min(p0.y, p1.y);
        const hi = orientation === "h" ? Math.max(p0.x, p1.x) : Math.max(p0.y, p1.y);
        for (const r of leafRects) {
          const rLo = orientation === "h" ? r.x : r.y;
          const rHi = orientation === "h" ? r.x + r.w : r.y + r.h;
          if (rHi <= lo || rLo >= hi) continue; // no span overlap — not an obstacle
          const perpLo = orientation === "h" ? r.y : r.x;
          const perpHi = orientation === "h" ? r.y + r.h : r.x + r.w;
          if (perpLo >= orig) upper = Math.min(upper, perpLo - NODE_CLEARANCE);
          else if (perpHi <= orig) lower = Math.max(lower, perpHi + NODE_CLEARANCE);
          // else: original constant already runs through this box's band —
          // ELK put it there (or it's the source/target box); don't constrain.
        }
      }
      return { lower, upper };
    };

    const n = ordered.length;
    const center = (ordered[0].constant + ordered[n - 1].constant) / 2;
    ordered.forEach((entry, idx) => {
      const desired = center + (idx - (n - 1) / 2) * SEGMENT_SPACING;
      const { lower, upper } = corridorFor(entry.segs, entry.constant);
      const target = lower > upper ? entry.constant : Math.min(Math.max(desired, lower), upper);
      const delta = target - entry.constant;
      if (Math.abs(delta) < OVERLAP_TOLERANCE) return;

      // Decide before shifting whether this edge's label rides on one of the
      // segments being moved (vs. some other segment of the same edge), so
      // it can be shifted by the same delta and stay attached to its line.
      const edge = edges[entry.edgeIdx];
      let moveLabel = false;
      if (edge.labelPosition) {
        const movedPoints = new Set(entry.segs.map((s) => s.points[s.i]));
        let minMoved = Number.POSITIVE_INFINITY;
        let minOther = Number.POSITIVE_INFINITY;
        for (const sec of edge.sections) {
          const pts = [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint];
          for (let k = 0; k < pts.length - 1; k++) {
            const dist = distToOrthoSegment(edge.labelPosition, pts[k], pts[k + 1]);
            if (movedPoints.has(pts[k])) minMoved = Math.min(minMoved, dist);
            else minOther = Math.min(minOther, dist);
          }
        }
        moveLabel = minMoved <= minOther + 1;
      }

      for (const segRef of entry.segs) {
        const p0 = segRef.points[segRef.i];
        const p1 = segRef.points[segRef.i + 1];
        if (orientation === "h") { p0.y += delta; p1.y += delta; }
        else { p0.x += delta; p1.x += delta; }
      }
      if (moveLabel && edge.labelPosition) {
        if (orientation === "h") edge.labelPosition.y += delta;
        else edge.labelPosition.x += delta;
      }
    });
  }
}

export async function layoutNodeEdgeDiagram(diagram: NodeEdgeLayoutInput, style: StyleTokens = DEFAULT_STYLE): Promise<LayoutResult> {
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
               maxChars = Math.max(maxChars, (`${String(key)}: ${String(val)}`).length);
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
        "elk.nodeLabels.placement": "INSIDE V_TOP H_CENTER",
        // Group containers don't inherit the root graph's spacing options, so
        // without these their children fall back to ELK's 20px defaults. That
        // leaves alleys between in-group nodes too narrow for edge routing:
        // the renderer needs an 18px straight runway on each side of a bend
        // for arrowheads, and boundary-crossing edges get shoved into (or
        // through) the neighboring boxes.
        "elk.spacing.nodeNode": String(style.nodeSpacing),
        "elk.layered.spacing.nodeNodeBetweenLayers": String(style.layerSpacing),
        "elk.spacing.edgeNode": "30",
        "elk.spacing.edgeEdge": "30",
        "elk.layered.spacing.edgeEdgeBetweenLayers": "30"
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
      // biome-ignore lint/performance/noDelete: must remove the key (not set to undefined) so ELK auto-sizes this container from its children; `= undefined` leaves the key present and elkjs may treat that differently, changing layout output.
      delete parent.width;
      // biome-ignore lint/performance/noDelete: see justification above.
      delete parent.height;
    } else {
      rootNodes.push(elkNode);
    }
  }

  // Fail fast on edges that reference nodes outside the input set, rather than
  // letting elkjs throw an opaque error deep in its layout pass. This message is
  // generic ("node") because this adapter also serves state/erd/class/c4 (which
  // map from/to -> source/target) and mindmap/architecture.
  const nodeIdSet = new Set(diagram.nodes.map((n) => n.id));
  diagram.edges.forEach((e, idx) => {
    if (!nodeIdSet.has(e.source))
      throw unknownIdError({ kind: "Edge", index: idx, field: "source", badId: e.source, knownIds: nodeIdSet });
    if (!nodeIdSet.has(e.target))
      throw unknownIdError({ kind: "Edge", index: idx, field: "target", badId: e.target, knownIds: nodeIdSet });
  });

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
        if ((`${curLine} ${w}`).trim().length > maxEdgeChars) {
          if (curLine) { lines++; maxLen = Math.max(maxLen, curLine.length); }
          curLine = w;
        } else {
          curLine = curLine ? `${curLine} ${w}` : w;
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

  const algorithm = diagram.algorithm || "layered";

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": algorithm,
      "elk.direction": direction,
      "elk.spacing.nodeNode": String(style.nodeSpacing),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(style.layerSpacing),
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
    let minInDegree = Number.POSITIVE_INFINITY;
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
  const edgeIdMap = new Map(diagram.edges.map((e, idx) => [`e${idx}`, e] as const));

  // 6 distinct colors for mindmap branches
  const mindmapColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  // Transform ELK output back to our LayoutResult
  const mapElkNode = (n: any, offsetX = 0, offsetY = 0, depth = 0, branchIndex = -1): LayoutNode => {
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
    if (originalNode?.metadata) {
      node.metadata = { ...originalNode.metadata };
    }

    // "standalone" lives as its own schema field (not under metadata) since
    // it's a first-class authoring concept, not free-form data — fold it into
    // metadata here so the renderer's single existing metadata-based styling
    // path (see scene-builder.ts's buildNodeShape) can pick it up.
    if (originalNode?.standalone) {
      node.metadata!.standalone = true;
    }

    // Copy icon
    if (originalNode?.icon) {
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
      for (const e of n.edges) {
        // ELK may route the edge in a specific container, indicated by e.container.
        const containerId = e.container || n.id;
        const edgeOffsetX = containerId === "root" ? 0 : (nodeCoords.get(containerId)?.x || 0);
        const edgeOffsetY = containerId === "root" ? 0 : (nodeCoords.get(containerId)?.y || 0);

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
      }
    }

    if (n.children) {
      for (const child of n.children) {
        extractEdges(child);
      }
    }
  };

  extractEdges(layout);
  separateOverlappingOrthogonalSegments(mappedEdges, mappedNodes);

  return {
    width: layout.width ?? 800,
    height: layout.height ?? 600,
    nodes: mappedNodes,
    edges: mappedEdges
  };
}
