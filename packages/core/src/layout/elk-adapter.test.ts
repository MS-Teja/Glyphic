import { describe, it, expect } from "vitest";
import { layoutNodeEdgeDiagram, separateOverlappingOrthogonalSegments } from "./elk-adapter.js";
import type { LayoutEdge, LayoutNode } from "./types.js";

// Regression test for a real bug report: edges crossing a compound node's
// boundary (e.g. a service inside a group reaching a sibling outside it)
// can land their orthogonal trunks just a few px apart, reading as one
// overlapping line rather than two distinct edges. ELK's own
// elk.spacing.edgeEdge doesn't help here — it's not consulted for this kind
// of hierarchical edge routing — so this repo applies its own post-layout
// separation pass in elk-adapter.ts.
function minGapBetweenOverlappingSegments(edges: LayoutEdge[]): number {
  const segments: { edgeId: string; orientation: "h" | "v"; constant: number; min: number; max: number }[] = [];

  for (const edge of edges) {
    for (const sec of edge.sections) {
      const points = [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint];
      // Skip terminal segments: stubs anchored at node ports legitimately sit
      // close together (ELK spaces ports ~18px apart on the same node side),
      // and the separation pass intentionally leaves them alone so edges stay
      // attached to their nodes. Only free-floating trunks must keep the gap.
      for (let i = 1; i < points.length - 2; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const dx = Math.abs(p0.x - p1.x);
        const dy = Math.abs(p0.y - p1.y);
        if (dy <= 0.5 && dx > 0.5) {
          segments.push({ edgeId: edge.id, orientation: "h", constant: p0.y, min: Math.min(p0.x, p1.x), max: Math.max(p0.x, p1.x) });
        } else if (dx <= 0.5 && dy > 0.5) {
          segments.push({ edgeId: edge.id, orientation: "v", constant: p0.x, min: Math.min(p0.y, p1.y), max: Math.max(p0.y, p1.y) });
        }
      }
    }
  }

  let minGap = Number.POSITIVE_INFINITY;
  for (let a = 0; a < segments.length; a++) {
    for (let b = a + 1; b < segments.length; b++) {
      const sa = segments[a];
      const sb = segments[b];
      if (sa.orientation !== sb.orientation || sa.edgeId === sb.edgeId) continue;
      const overlaps = sa.max > sb.min && sb.max > sa.min;
      if (!overlaps) continue;
      minGap = Math.min(minGap, Math.abs(sa.constant - sb.constant));
    }
  }
  return minGap;
}

describe("elk-adapter: parallel orthogonal edge separation", () => {
  it("keeps edges that cross a group boundary from overlapping (food-delivery repro)", async () => {
    const diagram = {
      type: "architecture",
      direction: "LR",
      routing: "orthogonal",
      nodes: [
        { id: "client", label: "Mobile App", shape: "person" },
        { id: "gateway", label: "API Gateway", shape: "hexagon" },
        { id: "cluster", label: "Kubernetes Cluster", shape: "rectangle" },
        { id: "auth", label: "Auth Service", shape: "service", groupId: "cluster" },
        { id: "order", label: "Order Service", shape: "service", groupId: "cluster" },
        { id: "payment", label: "Payment Service", shape: "service", groupId: "cluster" },
        { id: "delivery", label: "Delivery Service", shape: "service", groupId: "cluster" },
        { id: "db", label: "Shared Database", shape: "database" },
      ],
      edges: [
        { source: "client", target: "gateway", label: "HTTPS" },
        { source: "gateway", target: "auth" },
        { source: "gateway", target: "order" },
        { source: "order", target: "payment", label: "Async" },
        { source: "order", target: "delivery", label: "Async" },
        { source: "auth", target: "db" },
        { source: "order", target: "db" },
      ],
    } as any;

    const result = await layoutNodeEdgeDiagram(diagram);
    const minGap = minGapBetweenOverlappingSegments(result.edges);

    expect(minGap).toBeGreaterThanOrEqual(20);
  });

  // Regression: the separation pass used to fan out terminal segments too,
  // shifting edge start/end points 24-84px off their node borders — a wide
  // fan-out rendered with its tails floating in empty space next to the
  // source node. Terminal segments are anchored at ports and must stay put.
  it("keeps edge endpoints attached to their nodes under a wide fan-out", async () => {
    const targets = Array.from({ length: 8 }, (_, i) => ({
      id: `t${i}`,
      label: `Target ${i}`,
      shape: "service",
      groupId: "grp",
    }));
    const diagram = {
      type: "architecture",
      direction: "LR",
      routing: "orthogonal",
      nodes: [
        { id: "src", label: "Source", shape: "service" },
        { id: "grp", label: "Group", shape: "rectangle" },
        ...targets,
      ],
      edges: targets.map((t) => ({ source: "src", target: t.id })),
    } as any;

    const result = await layoutNodeEdgeDiagram(diagram);

    const boxes = new Map<string, { x: number; y: number; w: number; h: number }>();
    const walk = (nodes: typeof result.nodes) => {
      for (const n of nodes) {
        boxes.set(n.id, { x: n.x, y: n.y, w: n.width, h: n.height });
        if (n.children) walk(n.children);
      }
    };
    walk(result.nodes);

    const onBorder = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }) => {
      const inX = p.x >= b.x - 1 && p.x <= b.x + b.w + 1;
      const inY = p.y >= b.y - 1 && p.y <= b.y + b.h + 1;
      return inX && inY;
    };

    for (const edge of result.edges) {
      const src = boxes.get(edge.source);
      const tgt = boxes.get(edge.target);
      for (const sec of edge.sections) {
        expect(src && onBorder(sec.startPoint, src), `${edge.source}->${edge.target} start detached`).toBe(true);
        expect(tgt && onBorder(sec.endPoint, tgt), `${edge.source}->${edge.target} end detached`).toBe(true);
      }
    }
  });

  // Direct unit tests for the fan-out pass on synthetic geometry, where we
  // control exactly where trunks and obstacles sit.
  describe("separateOverlappingOrthogonalSegments", () => {
    // Two orthogonal edges whose middle trunks run 10px apart at y=60/70,
    // both spanning x=20..120, with terminal stubs on each end.
    const makeEdges = (): LayoutEdge[] => {
      const mk = (id: string, y: number, labelPosition?: { x: number; y: number }): LayoutEdge => ({
        id,
        source: `${id}src`,
        target: `${id}tgt`,
        style: "solid",
        arrow: "forward",
        label: labelPosition ? `${id}label` : undefined,
        labelPosition,
        sections: [
          {
            startPoint: { x: 0, y: y + 40 },
            bendPoints: [
              { x: 20, y: y + 40 },
              { x: 20, y },
              { x: 120, y },
              { x: 120, y: y + 40 },
            ],
            endPoint: { x: 140, y: y + 40 },
          },
        ],
      });
      return [mk("A", 60, { x: 70, y: 55 }), mk("B", 70, { x: 70, y: 65 })];
    };

    const node = (id: string, x: number, y: number, w: number, h: number): LayoutNode => ({
      id, x, y, width: w, height: h, label: id, shape: "service",
    });

    it("fans overlapping trunks apart and carries their labels along", () => {
      const edges = makeEdges();
      separateOverlappingOrthogonalSegments(edges, []);

      const trunkY = (e: LayoutEdge) => e.sections[0].bendPoints![1].y;
      // center 65, fanned to 65 ± 12
      expect(trunkY(edges[0])).toBeCloseTo(53);
      expect(trunkY(edges[1])).toBeCloseTo(77);
      // labels ride with their trunks (same delta: -7 and +7)
      expect(edges[0].labelPosition!.y).toBeCloseTo(48);
      expect(edges[1].labelPosition!.y).toBeCloseTo(72);
      // endpoints stay anchored
      expect(edges[0].sections[0].startPoint).toEqual({ x: 0, y: 100 });
      expect(edges[0].sections[0].endPoint).toEqual({ x: 140, y: 100 });
    });

    it("clamps the fan so a trunk never enters a node box", () => {
      const edges = makeEdges();
      // Leaf box overlapping the trunks' span, bottom edge at y=50 — the
      // unclamped fan would put edge A's trunk at y=53, only 3px below it.
      const obstacle = node("obs", 40, 20, 40, 30);
      separateOverlappingOrthogonalSegments(edges, [obstacle]);

      const trunkA = edges[0].sections[0].bendPoints![1].y;
      const trunkB = edges[1].sections[0].bendPoints![1].y;
      // clamped to obstacle bottom (50) + NODE_CLEARANCE (8)
      expect(trunkA).toBeCloseTo(58);
      // the unobstructed edge still fans normally
      expect(trunkB).toBeCloseTo(77);
      // label followed the clamped delta (-2), not the desired one (-7)
      expect(edges[0].labelPosition!.y).toBeCloseTo(53);
    });

    it("leaves a label alone when a different segment of its edge shifts", () => {
      const edges = makeEdges();
      // Park A's label on its start stub, far from the trunk.
      edges[0].labelPosition = { x: 5, y: 95 };
      separateOverlappingOrthogonalSegments(edges, []);
      expect(edges[0].labelPosition).toEqual({ x: 5, y: 95 });
    });
  });
});
