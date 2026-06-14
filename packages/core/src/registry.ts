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
import { layoutTimeline, layoutJourney, layoutKanban } from "./layout/chrono-adapter.js";
import { layoutC4Diagram } from "./layout/c4-adapter.js";
import { layoutTreemap } from "./layout/treemap-adapter.js";
import { StyleTokens } from "./render/style.js";

/** Which scene-builder a diagram type renders through. */
export type RenderStrategy = "scene" | "data-viz" | "flow" | "canvas";

export interface DiagramHandler {
  /**
   * Layout adapter. Omitted for `canvas`, which bypasses the layout engine.
   * `style` lets adapters honor spacing tokens; most ignore it.
   */
  layout?: (diagram: any, style?: StyleTokens) => LayoutResult | Promise<LayoutResult>;
  render: RenderStrategy;
  /** Whether edge labels get a background mask (sequence diagrams). */
  maskLabels?: boolean;
}

// Flowchart & architecture honor explicit node coordinates by bypassing ELK.
async function layoutNodeEdge(diagram: NodeEdgeDiagramType, style?: StyleTokens): Promise<LayoutResult> {
  const hasCoordinates = diagram.nodes.some((n) => n.x !== undefined || n.y !== undefined);
  return hasCoordinates ? layoutCanvasDiagram(diagram) : layoutNodeEdgeDiagram(diagram, style);
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
  mindmap: { layout: (d, style) => layoutNodeEdgeDiagram({ ...d, algorithm: "radial" }, style), render: "scene" },
  gantt: { layout: (d) => layoutGanttChart(d), render: "flow" },
  sankey: { layout: (d) => layoutSankeyDiagram(d), render: "flow" },
  git: { layout: (d) => layoutGitGraph(d), render: "flow" },
  canvas: { render: "canvas" },
  state: { layout: layoutStateDiagram, render: "scene" },
  erd: { layout: layoutErdDiagram, render: "scene" },
  class: { layout: layoutClassDiagram, render: "scene" },
  timeline: { layout: layoutTimeline, render: "flow" },
  journey: { layout: layoutJourney, render: "flow" },
  kanban: { layout: layoutKanban, render: "flow" },
  c4: { layout: layoutC4Diagram, render: "scene" },
  treemap: { layout: layoutTreemap, render: "data-viz" },
};
