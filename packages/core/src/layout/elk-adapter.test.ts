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
      for (let i = 0; i < points.length - 1; i++) {
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
});
