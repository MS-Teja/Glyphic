import type { PieChartType, QuadrantChartType } from "@glyphicjs/schema";
import type { LayoutResult, LayoutNode } from "./types.js";

export function layoutPieChart(diagram: PieChartType): LayoutResult {
  // Respect LLM provided dimensions or default to 800x600
  const width = diagram.width ?? 800;
  const height = diagram.height ?? 600;
  
  // We can pass the diagram-level parameters as a special "config" node
  const nodes: LayoutNode[] = [];

  nodes.push({
    id: "pie_config",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    label: "",
    shape: "pie_config",
    metadata: {
      cx: diagram.cx,
      cy: diagram.cy,
      radius: diagram.radius,
      legend: diagram.legend
    }
  });

  diagram.data.forEach((item, idx) => {
    nodes.push({
      id: `slice-${idx}`,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      label: item.label,
      shape: "pie_slice", // custom shape identifier for the renderer
      metadata: {
        value: item.value,
        color: item.color,
        explode: item.explode
      }
    });
  });

  // We can add the title as a special node
  if (diagram.title) {
    nodes.push({
      id: "title",
      x: width / 2,
      y: 40,
      width: 0,
      height: 0,
      label: diagram.title,
      shape: "title"
    });
  }

  return {
    width,
    height,
    nodes,
    edges: []
  };
}

export function layoutQuadrantChart(diagram: QuadrantChartType): LayoutResult {
  // Quadrant chart is rendered in a 800x800 viewBox
  const width = 800;
  const height = 800;
  
  // The points are scattered. We will just pass them to the renderer
  const nodes: LayoutNode[] = diagram.points.map((pt, idx) => ({
    id: `point-${idx}`,
    x: pt.x, // raw normalized value 0-1
    y: pt.y, // raw normalized value 0-1
    width: 0,
    height: 0,
    label: pt.label,
    shape: "quadrant_point"
  }));

  if (diagram.title) {
    nodes.push({
      id: "title",
      x: width / 2,
      y: 40,
      width: 0,
      height: 0,
      label: diagram.title,
      shape: "title"
    });
  }

  // Pass axis labels in a special node
  nodes.push({
    id: "axes",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    label: "",
    shape: "axes",
    metadata: {
      xAxis: diagram.xAxis,
      yAxis: diagram.yAxis
    }
  });

  return {
    width,
    height,
    nodes,
    edges: []
  };
}
