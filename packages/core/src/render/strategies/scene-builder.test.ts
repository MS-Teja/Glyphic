import { describe, expect, it } from "vitest";
import type { LayoutEdge, LayoutNode } from "../../layout/types.js";
import { DEFAULT_THEME, buildSceneEdge } from "./scene-builder.js";

// Regression test for a real bug report: buildEdgePath's arrowhead "runway"
// fixups shift bend points to lengthen the first/last segment, but when a
// route runs through an alley narrower than 2×MIN_RUNWAY the two shifts are
// contradictory. The start-side shift pushed the bends past the target's
// border, then the end-side shift extended the now-reversed final segment
// even further — drawing the edge through the interior of neighboring nodes
// with the arrowhead pointing backwards. The shifts are now clamped so the
// segment beyond the moved bends is never consumed or reversed.
describe("scene-builder: edge runway shifts in narrow alleys", () => {
  it("never pushes bends past the target when the alley is too narrow for both runways", () => {
    // Geometry from the food-delivery repro: order/auth right edges at x=764,
    // payment/delivery left edges at x=784 — a 20px alley. The edge leaves
    // order's right side, rises through the alley, and enters delivery's left
    // side. Both stubs are 10px, well under the 18px runway minimum.
    const nodes: LayoutNode[] = [
      { id: "order", x: 624, y: 207, width: 140, height: 110, label: "Order", shape: "service" },
      { id: "delivery", x: 784, y: 77, width: 149, height: 110, label: "Delivery", shape: "service" },
    ];
    const edge: LayoutEdge = {
      id: "e0",
      source: "order",
      target: "delivery",
      style: "solid",
      arrow: "forward",
      sections: [
        {
          startPoint: { x: 764, y: 235 },
          bendPoints: [
            { x: 774, y: 235 },
            { x: 774, y: 132 },
          ],
          endPoint: { x: 784, y: 132 },
        },
      ],
    };

    const scene = buildSceneEdge(edge, DEFAULT_THEME, nodes);
    expect(scene).not.toBeNull();
    const d = (scene?.paths[0] as { d: string }).d;

    const xs = [...d.matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)].map((m) => Number(m[1]));
    expect(xs.length).toBeGreaterThanOrEqual(4);

    // No point may sit at or beyond the target node's left border (x=784) —
    // before the fix the bends landed at x≈800, inside the target box.
    const endX = xs[xs.length - 1];
    for (const x of xs) {
      expect(x).toBeLessThanOrEqual(endX + 0.5);
    }
    // The final approach must still travel forward (+x) into the target.
    expect(endX).toBeGreaterThan(xs[xs.length - 2]);
  });
});
