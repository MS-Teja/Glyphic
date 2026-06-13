import { DiagramInputType, NodeEdgeDiagramType, SequenceDiagramType } from "@glyphic/schema";
import { LayoutResult } from "./types.js";
import { layoutNodeEdgeDiagram } from "./elk-adapter.js";
import { layoutSequenceDiagram } from "./sequence-adapter.js";

import { layoutCanvasDiagram } from "./canvas-adapter.js";
import { layoutPieChart, layoutQuadrantChart } from "./data-adapter.js";
import { layoutGanttChart } from "./time-adapter.js";
import { layoutSankeyDiagram, layoutGitGraph } from "./flow-adapter.js";

export * from "./types.js";
export * from "./elk-adapter.js";
export * from "./sequence-adapter.js";
export * from "./canvas-adapter.js";

export async function layoutDiagram(diagram: DiagramInputType): Promise<LayoutResult> {
  if (diagram.type === "sequence") {
    return layoutSequenceDiagram(diagram as SequenceDiagramType);
  } else if (diagram.type === "pie") {
    return layoutPieChart(diagram as any);
  } else if (diagram.type === "quadrant") {
    return layoutQuadrantChart(diagram as any);
  } else if (diagram.type === "gantt") {
    return layoutGanttChart(diagram as any);
  } else if (diagram.type === "sankey") {
    return layoutSankeyDiagram(diagram as any);
  } else if (diagram.type === "git") {
    return layoutGitGraph(diagram as any);
  } else if (diagram.type === "mindmap") {
    // Treat mindmap as an architecture diagram but force radial algorithm.
    // Spread into a new object so we never mutate the caller's validated input.
    const mindmap = { ...(diagram as any), algorithm: "radial" };
    return layoutNodeEdgeDiagram(mindmap);
  } else {
    const nodeEdgeDiagram = diagram as NodeEdgeDiagramType;
    // If ANY node has explicit coordinates, bypass ELK and use Canvas
    const hasCoordinates = nodeEdgeDiagram.nodes.some(n => n.x !== undefined || n.y !== undefined);
    
    if (hasCoordinates) {
      return layoutCanvasDiagram(nodeEdgeDiagram);
    }
    
    return layoutNodeEdgeDiagram(nodeEdgeDiagram);
  }
}
