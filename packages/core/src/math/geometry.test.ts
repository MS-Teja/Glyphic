import { describe, it, expect } from "vitest";
import { getPerimeterIntersection, hexagonInset } from "./geometry.js";

describe("getPerimeterIntersection — hexagon clipping", () => {
  // Regression: buildHexagon insets its cap by hexagonInset(width); the clip
  // must use the SAME inset or it computes a shallower slope than the shape has
  // and arrowheads land inside the body. This pins the two to one formula.
  const hex = { x: 0, y: 0, width: 170, height: 90, shape: "hexagon" };
  const cy = hex.y + hex.height / 2; // 45
  const STROKE_BUFFER = 2;

  it("lands a horizontal edge on the hexagon's sloped border, not inside it", () => {
    const y = 30; // 15px above centre — on the upper-left slope
    const dy = Math.abs(y - cy);
    // The shape's actual border x at this y, from the shared inset formula.
    const borderX = hex.x + hexagonInset(hex.width) * (dy / (hex.height / 2));

    // Edge arrives from the left; pt sits on the bounding-box left edge.
    const hit = getPerimeterIntersection(hex, { x: hex.x, y }, { x: -200, y });

    // Tip is at the border, pulled back only by the stroke buffer (never inside).
    expect(hit.x).toBeCloseTo(borderX - STROKE_BUFFER, 1);
    // Guard against the old width*0.2 cap, which placed the tip well inside.
    const buggyBorderX = hex.x + hex.width * 0.2 * (dy / (hex.height / 2));
    expect(hit.x).toBeLessThan(buggyBorderX - 1);
  });

  it("lands a horizontal edge at the left vertex when it enters at centre height", () => {
    const hit = getPerimeterIntersection(hex, { x: hex.x, y: cy }, { x: -200, y: cy });
    expect(hit.x).toBeCloseTo(hex.x - STROKE_BUFFER, 1); // the left point
  });

  it("hexagonInset caps at 20px for wide hexagons and scales for narrow ones", () => {
    expect(hexagonInset(170)).toBe(20); // 0.15*170 = 25.5, capped
    expect(hexagonInset(100)).toBe(15); // 0.15*100, under the cap
  });
});
