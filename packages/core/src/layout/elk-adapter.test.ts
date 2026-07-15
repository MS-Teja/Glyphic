import { describe, it, expect } from "vitest";
import { layoutNodeEdgeDiagram } from "./elk-adapter.js";
import type { LayoutEdge } from "./types.js";

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
});
