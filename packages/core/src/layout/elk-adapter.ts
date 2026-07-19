import ELK from "elkjs/lib/elk.bundled.js";
import type { NodeEdgeDiagramType } from "@glyphicjs/schema";
import type { LayoutResult, LayoutNode, LayoutEdge, LayoutEdgeSegment } from "./types.js";
import { unknownIdError } from "./validation.js";
import { measureTextWidth, wrapTextToWidth } from "../text-metrics.js";
import { type StyleTokens, DEFAULT_STYLE } from "../render/style.js";
import { iconExists } from "../render/icon-adapter.js";

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

// The box ELK is told an edge label occupies (14-char greedy wrap, matching
// the renderer's legacy edge-label wrap). Shared by the ELK edge builder and
// the jog-collapse pass so obstacle boxes always agree with what ELK placed.
export function estimateEdgeLabelSize(label: string): { width: number; height: number } {
  const maxEdgeChars = 14;
  const edgeWords = label.split(" ");
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
  return { width: maxLen * 6.0 + 8 + 10, height: lines * 14 - 4 + 10 };
}

// ELK's `elk.edgeLabels.inline=true` + `placement=CENTER` (see the label
// sizing below, ~:395-423) turns each edge label into a sized dummy node
// that occupies its own layer. The edge is routed through that dummy's
// assigned row/column, then jogs back to its actual port row/column — a
// short perpendicular hop (almost always exactly the inline-label dummy's
// layer offset, well under JOG_MAX) sandwiched between two runs that
// continue in the same direction. No ELK layout option removes these; they
// have to be found and straightened after the fact. Example (main->reviewer
// in the codex-dev-team fixture), raw ELK output:
//   (345,309)(447,309)(447,134)(599,134)(599,112)(702,112)
// collapses to:
//   (345,309)(447,309)(447,112)(702,112)
const JOG_MAX = 24; // hops longer than this may be genuine detours — leave them

// How many times to re-scan a single section for a fresh jog pattern after a
// collapse exposes one (e.g. two jogs chained back-to-back). Sections this
// deep are not expected in practice; the cap is just a safety net.
const JOG_COLLAPSE_MAX_ITERATIONS = 8;

// Classifies a two-point run as a horizontal or vertical axis-aligned
// segment and which way it travels along that axis (+1/-1), so the jog
// pattern can require "continues in the same direction" rather than merely
// "parallel" (a parallel-but-reversed pair is a U-turn, not a jog).
function axisDir(p0: { x: number; y: number }, p1: { x: number; y: number }): { orientation: "h" | "v" | null; sign: number } {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  if (Math.abs(dy) <= OVERLAP_TOLERANCE && Math.abs(dx) > OVERLAP_TOLERANCE) return { orientation: "h", sign: Math.sign(dx) };
  if (Math.abs(dx) <= OVERLAP_TOLERANCE && Math.abs(dy) > OVERLAP_TOLERANCE) return { orientation: "v", sign: Math.sign(dy) };
  return { orientation: null, sign: 0 };
}

// True if the rectangle swept by a run moving from `oldConst` to `newConst`
// (over its span, expanded by NODE_CLEARANCE) intersects a leaf-node box.
// Same clearance budget as the separation pass; unlike that pass this has no
// "already running through this band" exemption — an interior run is being
// moved into territory ELK never routed it through, so any intersection is
// disqualifying.
function sweepBlocked(
  orientation: "h" | "v",
  spanLo: number,
  spanHi: number,
  oldConst: number,
  newConst: number,
  leafRects: Rect[]
): boolean {
  const perpLo = Math.min(oldConst, newConst) - NODE_CLEARANCE;
  const perpHi = Math.max(oldConst, newConst) + NODE_CLEARANCE;
  for (const r of leafRects) {
    const rSpanLo = orientation === "h" ? r.x : r.y;
    const rSpanHi = orientation === "h" ? r.x + r.w : r.y + r.h;
    const rPerpLo = orientation === "h" ? r.y : r.x;
    const rPerpHi = orientation === "h" ? r.y + r.h : r.x + r.w;
    if (rSpanHi <= spanLo || rSpanLo >= spanHi) continue; // no span overlap — not an obstacle
    if (rPerpHi <= perpLo || rPerpLo >= perpHi) continue; // no perpendicular overlap
    return true;
  }
  return false;
}

// Removes redundant points from a section's point sequence: consecutive
// duplicates (a collapsed hop leaves its two endpoints coincident) and
// interior points whose incoming and outgoing runs share an orientation
// (a collapse can leave a straight line "bent" at a point that no longer
// turns). startPoint/endPoint are never dropped — only interior points are
// examined — so the section's endpoints are always preserved.
function simplifyOrthoPoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
  let pts = points;
  let changed = true;
  while (changed && pts.length > 2) {
    changed = false;
    const next: typeof pts = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const prev = next[next.length - 1];
      const cur = pts[i];
      const after = pts[i + 1];
      if (Math.abs(cur.x - prev.x) <= OVERLAP_TOLERANCE && Math.abs(cur.y - prev.y) <= OVERLAP_TOLERANCE) {
        changed = true; // coincident with the point before it — drop
        continue;
      }
      const inHoriz = Math.abs(cur.y - prev.y) <= OVERLAP_TOLERANCE;
      const inVert = Math.abs(cur.x - prev.x) <= OVERLAP_TOLERANCE;
      const outHoriz = Math.abs(after.y - cur.y) <= OVERLAP_TOLERANCE;
      const outVert = Math.abs(after.x - cur.x) <= OVERLAP_TOLERANCE;
      if ((inHoriz && outHoriz) || (inVert && outVert)) {
        changed = true; // doesn't actually turn here anymore — drop
        continue;
      }
      next.push(cur);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

// Finds and applies (at most) one jog collapse in a section's current point
// sequence. Returns true if a collapse was applied (the caller re-derives
// bendPoints and re-scans from scratch, since a collapse can expose an
// adjacent jog); false if no collapsible pattern remains.
interface LabelRect extends Rect {
  edge: LayoutEdge;
}

function collapseOneJog(points: { x: number; y: number }[], edge: LayoutEdge, leafRects: Rect[], labelRects: LabelRect[]): boolean {
  const n = points.length;
  for (let i = 0; i <= n - 4; i++) {
    const a0 = points[i];
    const a1 = points[i + 1];
    const h0 = points[i + 1];
    const h1 = points[i + 2];
    const b0 = points[i + 2];
    const b1 = points[i + 3];

    const aDir = axisDir(a0, a1);
    const bDir = axisDir(b0, b1);
    if (!aDir.orientation || !bDir.orientation) continue;
    if (aDir.orientation !== bDir.orientation || aDir.sign !== bDir.sign) continue; // not parallel-same-direction

    const hopDir = axisDir(h0, h1);
    if (!hopDir.orientation || hopDir.orientation === aDir.orientation) continue; // hop must be perpendicular
    const hopLen = hopDir.orientation === "h" ? Math.abs(h1.x - h0.x) : Math.abs(h1.y - h0.y);
    if (hopLen <= OVERLAP_TOLERANCE || hopLen > JOG_MAX) continue;

    // Terminal segments touch the section's startPoint/endPoint — given the
    // i <= n - 4 bound above, that can only be A touching startPoint (i===0)
    // or B touching endPoint (i+3===n-1); they can never both be interior to
    // a 4-point span. Port-anchored runs must never move (same invariant as
    // the separation pass).
    const aTerminal = i === 0;
    const bTerminal = i + 3 === n - 1;
    if (aTerminal && bTerminal) continue; // genuine port-offset Z — leave it alone

    const orientation = aDir.orientation;
    let moved: [{ x: number; y: number }, { x: number; y: number }];
    let targetConst: number;
    if (aTerminal) {
      moved = [b0, b1];
      targetConst = orientation === "h" ? a0.y : a0.x;
    } else if (bTerminal) {
      moved = [a0, a1];
      targetConst = orientation === "h" ? b0.y : b0.x;
    } else {
      const aLen = orientation === "h" ? Math.abs(a1.x - a0.x) : Math.abs(a1.y - a0.y);
      const bLen = orientation === "h" ? Math.abs(b1.x - b0.x) : Math.abs(b1.y - b0.y);
      if (aLen <= bLen) {
        moved = [a0, a1];
        targetConst = orientation === "h" ? b0.y : b0.x;
      } else {
        moved = [b0, b1];
        targetConst = orientation === "h" ? a0.y : a0.x;
      }
    }

    const oldConst = orientation === "h" ? moved[0].y : moved[0].x;
    const delta = targetConst - oldConst;
    if (Math.abs(delta) <= OVERLAP_TOLERANCE) continue; // already aligned

    const spanLo = orientation === "h" ? Math.min(moved[0].x, moved[1].x) : Math.min(moved[0].y, moved[1].y);
    const spanHi = orientation === "h" ? Math.max(moved[0].x, moved[1].x) : Math.max(moved[0].y, moved[1].y);
    if (sweepBlocked(orientation, spanLo, spanHi, oldConst, targetConst, leafRects)) continue;

    // "Does the label ride this run" — like the separation pass, but measured
    // from the label box CENTER, not its top-left. labelPosition is the box
    // origin, so the top-left sits systematically up-and-left of the text; a
    // label hanging just right of a vertical trunk would otherwise be
    // attributed to the trunk instead of the run it annotates.
    let moveLabel = false;
    if (edge.labelPosition && edge.label) {
      const size = estimateEdgeLabelSize(edge.label);
      const center = { x: edge.labelPosition.x + size.width / 2, y: edge.labelPosition.y + size.height / 2 };
      const distMoved = distToOrthoSegment(center, moved[0], moved[1]);
      let distOther = Number.POSITIVE_INFINITY;
      for (const otherSec of edge.sections) {
        const otherPts = [otherSec.startPoint, ...(otherSec.bendPoints || []), otherSec.endPoint];
        for (let k = 0; k < otherPts.length - 1; k++) {
          if (otherPts[k] === moved[0] && otherPts[k + 1] === moved[1]) continue; // the run itself
          distOther = Math.min(distOther, distToOrthoSegment(center, otherPts[k], otherPts[k + 1]));
        }
      }
      moveLabel = distMoved <= distOther + 1;
    }

    // Edge labels are obstacles too: ELK's jogs often exist precisely to
    // sidestep a label box, and collapsing one drives the line through the
    // text (labels have no opaque background). The edge's OWN label is exempt
    // only when it rides the moved run — it moves along, keeping its offset.
    const labelObstacles = labelRects.filter((r) => !(moveLabel && r.edge === edge));
    if (sweepBlocked(orientation, spanLo, spanHi, oldConst, targetConst, labelObstacles)) continue;

    if (orientation === "h") { moved[0].y = targetConst; moved[1].y = targetConst; }
    else { moved[0].x = targetConst; moved[1].x = targetConst; }
    if (moveLabel && edge.labelPosition) {
      if (orientation === "h") edge.labelPosition.y += delta;
      else edge.labelPosition.x += delta;
    }

    return true;
  }
  return false;
}

// Exported for unit tests only — layoutNodeEdgeDiagram is the real caller.
// See the block comment above JOG_MAX for why this pass exists.
export function collapseAxisAlignedJogs(edges: LayoutEdge[], nodes: LayoutNode[]): void {
  const leafRects = collectLeafRects(nodes);
  // Every placed edge label, sized with the same estimate ELK was given.
  // Rebuilt before each scan because a collapse can move a riding label.
  const buildLabelRects = (): LabelRect[] => {
    const rects: LabelRect[] = [];
    for (const edge of edges) {
      if (edge.label && edge.labelPosition) {
        const size = estimateEdgeLabelSize(edge.label);
        rects.push({ x: edge.labelPosition.x, y: edge.labelPosition.y, w: size.width, h: size.height, edge });
      }
    }
    return rects;
  };

  for (const edge of edges) {
    for (const sec of edge.sections) {
      for (let iter = 0; iter < JOG_COLLAPSE_MAX_ITERATIONS; iter++) {
        const points = [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint];
        if (!collapseOneJog(points, edge, leafRects, buildLabelRects())) break;
        const simplified = simplifyOrthoPoints(points);
        sec.bendPoints = simplified.slice(1, -1);
      }
    }
  }
}

export async function layoutNodeEdgeDiagram(diagram: NodeEdgeLayoutInput, style: StyleTokens = DEFAULT_STYLE): Promise<LayoutResult> {
  const direction = diagram.direction === "TB" ? "DOWN" :
                    diagram.direction === "BT" ? "UP" :
                    diagram.direction === "LR" ? "RIGHT" : "LEFT";

  // An icon slug resolves if it's a real Font Awesome icon OR a key in the
  // diagram theme's customIcons map (the renderer falls back to those).
  const customIcons =
    typeof diagram.theme === "object" && diagram.theme !== null ? diagram.theme.customIcons : undefined;
  const iconResolves = (slug: string) => iconExists(slug) || !!customIcons?.[slug];

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
    
    // Drop icon slugs that don't resolve to a real Font Awesome icon:
    // otherwise the node reserves blank icon space (here) and the renderer
    // pushes the label off-center around an icon that never draws. LLM
    // authors hallucinate slugs often enough that this must degrade to
    // "no icon" instead.
    const icon = node.icon && iconResolves(node.icon) ? node.icon : undefined;

    // Add extra padding if node has an icon
    if (icon && node.shape !== "person" && node.shape !== "class") {
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
      icon,
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
        "elk.layered.spacing.edgeEdgeBetweenLayers": "30",
        // BALANCED node placement (vs the BK default's left/top bias) centers
        // chains within their container, trimming the dead corner regions
        // compound groups otherwise get. Measured across a 6-diagram corpus:
        // ~23% higher content density on a VPC-style architecture, no
        // stress-invariant regressions. (Post-compaction options would be the
        // bigger lever but crash ELK under INCLUDE_CHILDREN.)
        "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED"
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
    const labelSize = e.label ? estimateEdgeLabelSize(e.label) : undefined;
    return {
      id: `e${idx}`,
      sources: [e.source],
      targets: [e.target],
      labels: e.label && labelSize ? [{ text: e.label, width: labelSize.width, height: labelSize.height }] : undefined
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
      // See the group-container options above for why BALANCED.
      "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
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

    // Copy icon (same unknown-slug guard as the sizing pass above, since
    // originalNode carries the raw authored value)
    if (originalNode?.icon && iconResolves(originalNode.icon)) {
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
  // Straighten inline-label jogs first: it turns each collapsed run into a
  // terminal segment, which separateOverlappingOrthogonalSegments already
  // refuses to move, so it cannot reintroduce the jog it just removed.
  collapseAxisAlignedJogs(mappedEdges, mappedNodes);
  separateOverlappingOrthogonalSegments(mappedEdges, mappedNodes);

  return {
    width: layout.width ?? 800,
    height: layout.height ?? 600,
    nodes: mappedNodes,
    edges: mappedEdges
  };
}
