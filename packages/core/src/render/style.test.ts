import { describe, it, expect } from "vitest";
import { resolveStyle, STYLE_PRESETS, DEFAULT_STYLE } from "./style.js";
import { buildSceneGraph } from "./strategies/scene-builder.js";
import { LayoutResult } from "../layout/types.js";

function oneNodeLayout(color?: string): LayoutResult {
  return {
    width: 200,
    height: 100,
    nodes: [
      { id: "a", x: 0, y: 0, width: 140, height: 70, label: "A", shape: "rectangle", metadata: color ? { color } : {} },
    ],
    edges: [],
  };
}

// Recursively flatten scene elements so we can assert on emitted primitives.
function flatten(scene: ReturnType<typeof buildSceneGraph>): any[] {
  const out: any[] = [];
  const walk = (els: any[]) => {
    for (const el of els) {
      out.push(el);
      if (el.type === "group") walk(el.children);
    }
  };
  walk(scene.elements);
  return out;
}

describe("resolveStyle", () => {
  it("defaults to compact", () => {
    expect(resolveStyle()).toBe(STYLE_PRESETS.compact);
    expect(resolveStyle(undefined).name).toBe("compact");
    expect(DEFAULT_STYLE.name).toBe("compact");
  });

  it("resolves known presets and falls back for unknown", () => {
    expect(resolveStyle("minimal").fillMode).toBe("none");
    expect(resolveStyle("sketch").sketch).toBe(true);
    expect(resolveStyle("clean").fillMode).toBe("solid");
    expect(resolveStyle("bogus")).toBe(DEFAULT_STYLE);
  });
});

describe("style applied in scene-builder", () => {
  it("compact (default) tints a colored node and adds a shadow filter", () => {
    const scene = buildSceneGraph(oneNodeLayout("#ff0000"), {}, false, resolveStyle("compact"));
    expect(scene.defs).toContain("glyphic-shadow");
    const rects = flatten(scene).filter((e) => e.type === "rect" && e.filter);
    expect(rects.length).toBeGreaterThan(0);
    // Tinted fill is a light wash, not the raw saturated color.
    const node = flatten(scene).find((e) => e.type === "rect" && e.stroke === "#ff0000");
    expect(node.fill).not.toBe("#ff0000");
  });

  it("minimal renders outline-only (no fill) and no shadow", () => {
    const scene = buildSceneGraph(oneNodeLayout(), {}, false, resolveStyle("minimal"));
    expect(scene.defs).not.toContain("glyphic-shadow");
    const node = flatten(scene).find((e) => e.type === "rect" && e.width === 140);
    expect(node.fill).toBe("none");
  });

  it("sketch renders node shapes as roughened paths", () => {
    const scene = buildSceneGraph(oneNodeLayout(), {}, false, resolveStyle("sketch"));
    // The rectangle node becomes a closed path (with quadratic curves), not a crisp rect.
    const paths = flatten(scene).filter((e) => e.type === "path" && e.d.includes("Q"));
    expect(paths.length).toBeGreaterThan(0);
  });

  it("clean preserves the classic radius and solid fill", () => {
    const scene = buildSceneGraph(oneNodeLayout("#00ff00"), {}, false, resolveStyle("clean"));
    const node = flatten(scene).find((e) => e.type === "rect" && e.width === 140);
    expect(node.rx).toBe(6);
    expect(node.fill).toBe("#00ff00"); // solid fill = raw color
  });
});
