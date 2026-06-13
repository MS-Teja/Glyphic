import { describe, it, expect, vi } from "vitest";
import { resolveThemePartial, resolveFontFamily, THEME_PRESETS } from "./theme.js";
import { processDiagram } from "../pipeline.js";

vi.mock("@resvg/resvg-js", () => ({
  Resvg: class {
    render() {
      return { asPng: () => Buffer.from("mockpng") };
    }
  }
}));

describe("theme resolution", () => {
  it("resolves preset names, objects, and unknowns", () => {
    expect(resolveThemePartial("dark")).toBe(THEME_PRESETS.dark);
    expect(resolveThemePartial(undefined)).toEqual({});
    expect(resolveThemePartial({ background: "#000000" })).toEqual({ background: "#000000" });
    expect(resolveThemePartial("does-not-exist")).toEqual({});
  });

  it("resolveFontFamily falls back to Inter", () => {
    expect(resolveFontFamily()).toContain("Inter");
    expect(resolveFontFamily("Roboto")).toContain("Roboto");
  });

  it("applies the dark preset background to rendered output", async () => {
    const result = await processDiagram({
      type: "flowchart",
      theme: "dark",
      nodes: [{ id: "a", label: "A" }],
      edges: []
    });
    expect(result.svg).toContain(THEME_PRESETS.dark.background!);
  });
});

describe("svg accessibility", () => {
  it("adds role=img and a <title> derived from the diagram title", async () => {
    const result = await processDiagram({
      type: "flowchart",
      title: "My Flow",
      nodes: [{ id: "a", label: "A" }],
      edges: []
    });
    expect(result.svg).toContain('role="img"');
    expect(result.svg).toContain("<title>My Flow</title>");
  });
});
