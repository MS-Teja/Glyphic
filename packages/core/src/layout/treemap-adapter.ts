import type { TreemapDiagramType } from "@glyphicjs/schema";
import type { LayoutResult, LayoutNode } from "./types.js";
import { hierarchy, treemap } from "d3-hierarchy";

// Squarified treemap via d3-hierarchy: leaves become positioned rectangles
// sized by value; siblings under the same top-level group share a color.
export function layoutTreemap(diagram: TreemapDiagramType): LayoutResult {
  const width = diagram.width ?? 900;
  const height = diagram.height ?? 600;
  const titleH = diagram.title ? 56 : 0;

  const root = hierarchy<any>(diagram.root)
    .sum((d) => (Array.isArray(d.children) && d.children.length ? 0 : d.value ?? 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  treemap<any>().size([width, height - titleH]).paddingInner(3).round(true)(root);

  const tops = root.children ?? [];
  const topOf = (leaf: any) => {
    let n = leaf;
    while (n.parent?.parent) n = n.parent;
    return n;
  };

  const nodes: LayoutNode[] = [];
  if (diagram.title) {
    nodes.push({ id: "title", x: width / 2, y: 36, width: 0, height: 0, label: diagram.title, shape: "title" });
  }

  let idx = 0;
  for (const leaf of root.leaves() as any[]) {
    const topIdx = tops.indexOf(topOf(leaf));
    nodes.push({
      id: `tm_${idx}`,
      x: leaf.x0,
      y: leaf.y0 + titleH,
      width: leaf.x1 - leaf.x0,
      height: leaf.y1 - leaf.y0,
      label: leaf.data.label,
      shape: "treemap_rect",
      metadata: { value: leaf.value, color: leaf.data.color, topIdx: topIdx < 0 ? idx : topIdx }
    });
    idx++;
  }

  return { width, height, nodes, edges: [] };
}
