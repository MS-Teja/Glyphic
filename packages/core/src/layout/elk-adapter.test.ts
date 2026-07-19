import { describe, it, expect } from "vitest";
import { layoutNodeEdgeDiagram, separateOverlappingOrthogonalSegments, collapseAxisAlignedJogs } from "./elk-adapter.js";
import { layoutDiagram } from "./index.js";
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

  // Regression: an icon slug that doesn't resolve to a real Font Awesome
  // icon used to still reserve 40px of icon height, rendering as a node with
  // a blank gap and an off-center label. Unknown slugs (LLM authors
  // hallucinate them regularly) must degrade to "no icon".
  it("sizes a node with an unresolvable icon slug exactly like a node with no icon", async () => {
    const diagram = {
      type: "architecture",
      direction: "LR",
      routing: "orthogonal",
      theme: { customIcons: { mybrand: '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>' } },
      nodes: [
        { id: "real", label: "Real", shape: "service", icon: "fas-database" },
        { id: "fake", label: "Fake", shape: "service", icon: "fas-kubernetes-cluster" },
        { id: "brand", label: "Brand", shape: "service", icon: "mybrand" },
        { id: "plain", label: "Plain", shape: "service" },
      ],
      edges: [
        { source: "real", target: "fake" },
        { source: "fake", target: "brand" },
        { source: "brand", target: "plain" },
      ],
    } as any;

    const result = await layoutNodeEdgeDiagram(diagram);
    const byId = new Map(result.nodes.map((n) => [n.id, n]));

    expect(byId.get("fake")!.height).toBe(byId.get("plain")!.height);
    expect(byId.get("real")!.height).toBe(byId.get("plain")!.height + 40);
    // The bogus slug must not survive into the layout output either, so the
    // renderer never tries to draw (or leave room for) it.
    expect(byId.get("fake")!.icon).toBeUndefined();
    expect(byId.get("real")!.icon).toBe("fas-database");
    // Custom theme icons resolve past FontAwesome and keep their space.
    expect(byId.get("brand")!.icon).toBe("mybrand");
    expect(byId.get("brand")!.height).toBe(byId.get("plain")!.height + 40);
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

  // Direct unit tests for the jog-collapse pass on synthetic geometry. All
  // five use (a shape of) the real main->reviewer bend dump from the
  // codex-dev-team fixture: `elk.edgeLabels.inline` routes the edge through
  // its label's dummy row (y=134) then hops 22px back to the port row
  // (y=112) it should have stayed on the whole time.
  describe("collapseAxisAlignedJogs", () => {
    // start(345,309) -> (447,309) -> (447,134) -> (599,134) -> (599,112) -> end(702,112)
    // The (599,134)->(599,112) hop is the label-dummy jog: A=(447,134)-(599,134)
    // is interior, B=(599,112)-(702,112) is terminal (touches endPoint), so A
    // should move onto B's row (112) and the two now-redundant points drop out.
    const makeJoggedEdge = (labelPosition?: { x: number; y: number }): LayoutEdge => ({
      id: "main-reviewer",
      source: "main",
      target: "reviewer",
      style: "solid",
      arrow: "forward",
      label: "concrete residual risk",
      labelPosition,
      sections: [
        {
          startPoint: { x: 345, y: 309 },
          bendPoints: [
            { x: 447, y: 309 },
            { x: 447, y: 134 },
            { x: 599, y: 134 },
            { x: 599, y: 112 },
          ],
          endPoint: { x: 702, y: 112 },
        },
      ],
    });

    const node = (id: string, x: number, y: number, w: number, h: number): LayoutNode => ({
      id, x, y, width: w, height: h, label: id, shape: "service",
    });

    it("collapses an interior run onto a terminal run and drops the jog points", () => {
      const edges = [makeJoggedEdge()];
      collapseAxisAlignedJogs(edges, []);

      const sec = edges[0].sections[0];
      expect(sec.startPoint).toEqual({ x: 345, y: 309 });
      expect(sec.endPoint).toEqual({ x: 702, y: 112 });
      expect(sec.bendPoints).toEqual([
        { x: 447, y: 309 },
        { x: 447, y: 112 },
      ]);
    });

    it("skips the collapse when the swept corridor is blocked by a leaf-node rect", () => {
      const edges = [makeJoggedEdge()];
      // Sits between the old row (134) and the new row (112), spanning the
      // moved run's x range (447..599) — directly in the swept corridor.
      const obstacle = node("obs", 500, 115, 40, 15);
      collapseAxisAlignedJogs(edges, [obstacle]);

      const sec = edges[0].sections[0];
      expect(sec.bendPoints).toEqual([
        { x: 447, y: 309 },
        { x: 447, y: 134 },
        { x: 599, y: 134 },
        { x: 599, y: 112 },
      ]);
    });

    it("skips the collapse when the swept corridor crosses another edge's label box", () => {
      const edges = [makeJoggedEdge()];
      // An unrelated edge whose label sits in the corridor (between rows 134
      // and 112 over x 447..599). ELK's jog exists to dodge exactly this box;
      // collapsing would run the line through the text.
      const other: LayoutEdge = {
        id: "other",
        source: "a",
        target: "b",
        style: "solid",
        arrow: "forward",
        label: "X",
        labelPosition: { x: 500, y: 115 },
        sections: [{ startPoint: { x: 0, y: 900 }, endPoint: { x: 100, y: 900 } }],
      };
      edges.push(other);
      collapseAxisAlignedJogs(edges, []);

      expect(edges[0].sections[0].bendPoints).toEqual([
        { x: 447, y: 309 },
        { x: 447, y: 134 },
        { x: 599, y: 134 },
        { x: 599, y: 112 },
      ]);
    });

    it("does not let the edge's own riding label block its collapse", () => {
      // Label box (493,97 · 96×34) overlaps the swept corridor, but it rides
      // the moved run — it moves along with it, so it must not count as an
      // obstacle. The collapse proceeds and the label keeps its offset.
      const edges = [makeJoggedEdge({ x: 493, y: 97 })];
      collapseAxisAlignedJogs(edges, []);

      expect(edges[0].sections[0].bendPoints).toEqual([
        { x: 447, y: 309 },
        { x: 447, y: 112 },
      ]);
      expect(edges[0].labelPosition).toEqual({ x: 493, y: 75 }); // followed the -22px move
    });

    it("skips a both-terminal Z and a hop longer than JOG_MAX", () => {
      // Both-terminal: only 4 points, so the single run on each side of the
      // hop touches startPoint and endPoint respectively — a genuine port
      // misalignment, not an inline-label jog.
      const misalignedPorts: LayoutEdge = {
        id: "z",
        source: "s",
        target: "t",
        style: "solid",
        arrow: "forward",
        sections: [
          {
            startPoint: { x: 0, y: 50 },
            bendPoints: [
              { x: 40, y: 50 },
              { x: 40, y: 60 },
            ],
            endPoint: { x: 80, y: 60 },
          },
        ],
      };
      const bothEdges = [misalignedPorts];
      collapseAxisAlignedJogs(bothEdges, []);
      expect(bothEdges[0].sections[0].bendPoints).toEqual([
        { x: 40, y: 50 },
        { x: 40, y: 60 },
      ]);

      // Hop too long: same shape as the collapsible fixture, but the hop is
      // 30px (> JOG_MAX = 24) — a plausible genuine detour, not a dummy jog.
      const longHop = makeJoggedEdge();
      longHop.sections[0].bendPoints = [
        { x: 447, y: 309 },
        { x: 447, y: 134 },
        { x: 599, y: 134 },
        { x: 599, y: 104 }, // 30px hop instead of 22px
      ];
      longHop.sections[0].endPoint = { x: 702, y: 104 };
      const longHopEdges = [longHop];
      collapseAxisAlignedJogs(longHopEdges, []);
      expect(longHopEdges[0].sections[0].bendPoints).toEqual([
        { x: 447, y: 309 },
        { x: 447, y: 134 },
        { x: 599, y: 134 },
        { x: 599, y: 104 },
      ]);
    });

    it("moves labelPosition with the run it rides, and leaves it when a different segment moves", () => {
      // Label sits on the run that collapses (A: (447,134)-(599,134)).
      const ridingEdge = makeJoggedEdge({ x: 500, y: 134 });
      collapseAxisAlignedJogs([ridingEdge], []);
      // A moved from y=134 to y=112, a delta of -22 — the label follows.
      expect(ridingEdge.labelPosition).toEqual({ x: 500, y: 112 });

      // Label sits on the untouched start stub ((345,309)-(447,309)).
      const otherEdge = makeJoggedEdge({ x: 400, y: 309 });
      collapseAxisAlignedJogs([otherEdge], []);
      expect(otherEdge.labelPosition).toEqual({ x: 400, y: 309 });
    });

    // Integration: a fan-out/fan-in shape modeled on the codex-dev-team
    // fixture (source -> two labeled groups of two children each -> sink),
    // run through the full layoutDiagram pipeline. No section should still
    // contain the jog pattern after both post-passes run.
    it("leaves no jog pattern in a fan-out/fan-in architecture diagram after layout", async () => {
      const diagram = {
        type: "architecture",
        direction: "LR",
        routing: "orthogonal",
        nodes: [
          { id: "main", label: "Main thread — decide & scope", shape: "service" },
          { id: "readonly", label: "Read-only", shape: "rectangle" },
          { id: "write", label: "Workspace-write", shape: "rectangle" },
          { id: "explorer", label: "Explorer · Luna Medium", shape: "service", groupId: "readonly" },
          { id: "reviewer", label: "Reviewer · Sol High · fresh context", shape: "service", groupId: "readonly" },
          { id: "executor", label: "Executor · Luna High", shape: "service", groupId: "write" },
          { id: "complex", label: "Complex Executor · Terra High", shape: "service", groupId: "write" },
          { id: "sink", label: "Main thread — verify & accept", shape: "service" },
        ],
        edges: [
          { source: "main", target: "explorer", label: "read-only discovery" },
          { source: "main", target: "reviewer", label: "concrete residual risk" },
          { source: "main", target: "executor", label: "clear bounded task" },
          { source: "main", target: "complex", label: "substantial bounded work" },
          { source: "explorer", target: "sink", label: "evidence, open questions" },
          { source: "reviewer", target: "sink", label: "independent findings" },
          { source: "executor", target: "sink", label: "result + checks" },
          { source: "complex", target: "sink", label: "result + checks" },
        ],
      } as any;

      const result = await layoutDiagram(diagram);

      // Same detection logic as collapseOneJog's pattern match, but read-only:
      // parallel, same-direction runs separated by a perpendicular hop of
      // length in (0, 24].
      const dir = (p0: { x: number; y: number }, p1: { x: number; y: number }): { orientation: "h" | "v" | null; sign: number } => {
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        if (Math.abs(dy) <= 0.5 && Math.abs(dx) > 0.5) return { orientation: "h", sign: Math.sign(dx) };
        if (Math.abs(dx) <= 0.5 && Math.abs(dy) > 0.5) return { orientation: "v", sign: Math.sign(dy) };
        return { orientation: null, sign: 0 };
      };
      const hasJogPattern = (edges: LayoutEdge[]): boolean => {
        for (const edge of edges) {
          for (const sec of edge.sections) {
            const points = [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint];
            for (let i = 0; i <= points.length - 4; i++) {
              const aDir = dir(points[i], points[i + 1]);
              const bDir = dir(points[i + 2], points[i + 3]);
              if (!aDir.orientation || !bDir.orientation) continue;
              if (aDir.orientation !== bDir.orientation || aDir.sign !== bDir.sign) continue;
              const hopDir = dir(points[i + 1], points[i + 2]);
              if (!hopDir.orientation || hopDir.orientation === aDir.orientation) continue;
              const hopLen = hopDir.orientation === "h"
                ? Math.abs(points[i + 2].x - points[i + 1].x)
                : Math.abs(points[i + 2].y - points[i + 1].y);
              if (hopLen > 0.5 && hopLen <= 24) return true;
            }
          }
        }
        return false;
      };

      expect(hasJogPattern(result.edges)).toBe(false);
    });
  });
});
