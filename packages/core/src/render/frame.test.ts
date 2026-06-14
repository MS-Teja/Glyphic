import { describe, it, expect } from "vitest";
import { targetRatioFor, frameScene } from "./frame.js";
import { SceneGraph } from "../scene/scene-graph.js";

function makeScene(width: number, height: number, withBg = true): SceneGraph {
  return {
    width,
    height,
    elements: [
      ...(withBg ? [{ type: "rect" as const, x: 0, y: 0, width, height, fill: "#fff" }] : []),
      { type: "rect" as const, x: 10, y: 10, width: 50, height: 50, fill: "#000" },
    ],
  };
}

describe("targetRatioFor", () => {
  it("derives node-edge orientation from direction", () => {
    expect(targetRatioFor("flowchart", "LR", "auto")).toBeCloseTo(16 / 9);
    expect(targetRatioFor("architecture", "RL", undefined)).toBeCloseTo(16 / 9);
    expect(targetRatioFor("flowchart", "TB", "auto")).toBeCloseTo(9 / 16);
    expect(targetRatioFor("flowchart", undefined, undefined)).toBeCloseTo(9 / 16);
  });

  it("leaves non-graph types unframed in auto mode", () => {
    expect(targetRatioFor("sequence", undefined, "auto")).toBeNull();
    expect(targetRatioFor("gantt", undefined, undefined)).toBeNull();
    expect(targetRatioFor("pie", undefined, undefined)).toBeNull();
    expect(targetRatioFor("treemap", undefined, undefined)).toBeNull();
  });

  it("honors explicit overrides and 'none' on any type", () => {
    expect(targetRatioFor("pie", undefined, "16:9")).toBeCloseTo(16 / 9);
    expect(targetRatioFor("sequence", undefined, "9:16")).toBeCloseTo(9 / 16);
    expect(targetRatioFor("flowchart", "LR", "1:1")).toBe(1);
    expect(targetRatioFor("flowchart", "LR", "none")).toBeNull();
  });
});

describe("frameScene", () => {
  it("pads the short axis without ever shrinking a dimension", () => {
    const scene = makeScene(400, 400);
    const framed = frameScene(scene, 16 / 9, "#fff", true);
    expect(framed.width).toBeGreaterThanOrEqual(400);
    expect(framed.height).toBe(400); // height unchanged when widening
    expect(framed.width / framed.height).toBeCloseTo(16 / 9);
  });

  it("heightens a too-wide scene", () => {
    const scene = makeScene(1600, 200);
    const framed = frameScene(scene, 16 / 9, "#fff", true);
    expect(framed.width).toBe(1600);
    expect(framed.height).toBeGreaterThan(200);
    expect(framed.width / framed.height).toBeCloseTo(16 / 9);
  });

  it("resizes the background and centers content in a translate group", () => {
    const scene = makeScene(400, 400);
    const framed = frameScene(scene, 16 / 9, "#fff", true);
    const bg = framed.elements[0];
    expect(bg.type).toBe("rect");
    if (bg.type === "rect") {
      expect(bg.width).toBeCloseTo(framed.width);
      expect(bg.height).toBeCloseTo(framed.height);
    }
    const group = framed.elements[1];
    expect(group.type).toBe("group");
    if (group.type === "group") {
      expect(group.transform).toMatch(/translate\(/);
    }
  });

  it("skips outliers in auto mode but honors explicit ratios", () => {
    // Very wide content, target tall — content would occupy a tiny fraction.
    const scene = makeScene(2000, 100);
    const auto = frameScene(scene, 9 / 16, "#fff", false);
    expect(auto).toBe(scene); // unchanged outlier

    const explicit = frameScene(scene, 9 / 16, "#fff", true);
    expect(explicit.width / explicit.height).toBeCloseTo(9 / 16);
  });

  it("prepends a background when none exists", () => {
    const scene = makeScene(400, 400, false);
    const framed = frameScene(scene, 16 / 9, "#abcdef", true);
    const bg = framed.elements[0];
    expect(bg.type).toBe("rect");
    if (bg.type === "rect") expect(bg.fill).toBe("#abcdef");
  });
});
