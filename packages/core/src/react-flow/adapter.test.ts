import { describe, it, expect } from "vitest";
import { exportToReactFlow } from "./adapter.js";
import type { LayoutResult } from "../layout/types.js";

describe("exportToReactFlow", () => {
  it("keeps top-level node positions absolute", () => {
    const layout: LayoutResult = {
      nodes: [
        { id: "a", x: 10, y: 20, width: 100, height: 40, label: "A", shape: "rect" },
        { id: "b", x: 200, y: 20, width: 100, height: 40, label: "B", shape: "rect" },
      ],
      edges: [],
    } as unknown as LayoutResult;

    const { nodes } = exportToReactFlow(layout);
    expect(nodes.find((n) => n.id === "a")?.position).toEqual({ x: 10, y: 20 });
    expect(nodes.find((n) => n.id === "b")?.position).toEqual({ x: 200, y: 20 });
  });

  it("makes nested child positions relative to their parent's absolute origin", () => {
    // LayoutNode.x/y are always absolute (same convention the SVG renderer uses),
    // but React Flow's parentId/extent:'parent' expects child positions
    // relative to the parent — the adapter must do that subtraction itself.
    const layout: LayoutResult = {
      nodes: [
        {
          id: "cluster",
          x: 50,
          y: 60,
          width: 300,
          height: 200,
          label: "Cluster",
          shape: "rect",
          children: [{ id: "child", x: 80, y: 100, width: 100, height: 40, label: "Child", shape: "rect" }],
        },
      ],
      edges: [],
    } as unknown as LayoutResult;

    const { nodes } = exportToReactFlow(layout);
    const cluster = nodes.find((n) => n.id === "cluster");
    const child = nodes.find((n) => n.id === "child");
    expect(cluster?.position).toEqual({ x: 50, y: 60 });
    expect(child?.position).toEqual({ x: 80 - 50, y: 100 - 60 });
    expect(child?.parentId).toBe("cluster");
    expect(child?.extent).toBe("parent");
    expect(cluster?.data.isGroup).toBe(true);
    expect(child?.data.isGroup).toBe(false);
  });

  it("handles doubly-nested children relative to their immediate parent", () => {
    const layout: LayoutResult = {
      nodes: [
        {
          id: "outer",
          x: 10,
          y: 10,
          width: 400,
          height: 400,
          label: "Outer",
          shape: "rect",
          children: [
            {
              id: "inner",
              x: 40,
              y: 50,
              width: 300,
              height: 300,
              label: "Inner",
              shape: "rect",
              children: [{ id: "leaf", x: 70, y: 90, width: 100, height: 40, label: "Leaf", shape: "rect" }],
            },
          ],
        },
      ],
      edges: [],
    } as unknown as LayoutResult;

    const { nodes } = exportToReactFlow(layout);
    const inner = nodes.find((n) => n.id === "inner");
    const leaf = nodes.find((n) => n.id === "leaf");
    expect(inner?.position).toEqual({ x: 40 - 10, y: 50 - 10 });
    expect(leaf?.position).toEqual({ x: 70 - 40, y: 90 - 50 });
    expect(leaf?.parentId).toBe("inner");
  });
});
