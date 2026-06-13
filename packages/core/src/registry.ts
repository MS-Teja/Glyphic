import { DiagramInputType, NodeEdgeDiagramType } from "@glyphic/schema";
import { LayoutResult } from "./layout/types.js";
import { layoutNodeEdgeDiagram } from "./layout/elk-adapter.js";
import { layoutSequenceDiagram } from "./layout/sequence-adapter.js";
import { layoutCanvasDiagram } from "./layout/canvas-adapter.js";
import { layoutPieChart, layoutQuadrantChart } from "./layout/data-adapter.js";
import { layoutGanttChart } from "./layout/time-adapter.js";
import { layoutSankeyDiagram, layoutGitGraph } from "./layout/flow-adapter.js";
import { layoutStateDiagram } from "./layout/state-adapter.js";
import { layoutErdDiagram } from "./layout/erd-adapter.js";
import { layoutClassDiagram } from "./layout/class-adapter.js";
import { layoutTimeline, layoutJourney } from "./layout/chrono-adapter.js";

/** Which scene-builder a diagram type renders through. */
export type RenderStrategy = "scene" | "data-viz" | "flow" | "canvas";

export interface DiagramHandler {
  /** Layout adapter. Omitted for `canvas`, which bypasses the layout engine. */
  layout?: (diagram: any) => LayoutResult | Promise<LayoutResult>;
  render: RenderStrategy;
  /** Whether edge labels get a background mask (sequence diagrams). */
  maskLabels?: boolean;
}

// Flowchart & architecture honor explicit node coordinates by bypassing ELK.
async function layoutNodeEdge(diagram: NodeEdgeDiagramType): Promise<LayoutResult> {
  const hasCoordinates = diagram.nodes.some((n) => n.x !== undefined || n.y !== undefined);
  return hasCoordinates ? layoutCanvasDiagram(diagram) : layoutNodeEdgeDiagram(diagram);
}

// Single source of truth mapping each diagram type to its layout adapter and
// render strategy. Adding a new diagram type means adding one entry here.
export const DIAGRAM_REGISTRY: Record<DiagramInputType["type"], DiagramHandler> = {
  flowchart: { layout: layoutNodeEdge, render: "scene" },
  architecture: { layout: layoutNodeEdge, render: "scene" },
  sequence: { layout: (d) => layoutSequenceDiagram(d), render: "scene", maskLabels: true },
  pie: { layout: (d) => layoutPieChart(d), render: "data-viz" },
  quadrant: { layout: (d) => layoutQuadrantChart(d), render: "data-viz" },
  // Mindmaps are node/edge diagrams forced to a radial algorithm (no mutation).
  mindmap: { layout: (d) => layoutNodeEdgeDiagram({ ...d, algorithm: "radial" }), render: "scene" },
  gantt: { layout: (d) => layoutGanttChart(d), render: "flow" },
  sankey: { layout: (d) => layoutSankeyDiagram(d), render: "flow" },
  git: { layout: (d) => layoutGitGraph(d), render: "flow" },
  canvas: { render: "canvas" },
  state: { layout: layoutStateDiagram, render: "scene" },
  erd: { layout: layoutErdDiagram, render: "scene" },
  class: { layout: layoutClassDiagram, render: "scene" },
  timeline: { layout: layoutTimeline, render: "flow" },
  journey: { layout: layoutJourney, render: "flow" },
};
