import { DiagramInput, DiagramInputType } from "@glyphic/schema";
import { layoutDiagram } from "./layout/index.js";
import { DIAGRAM_REGISTRY } from "./registry.js";
import { rasterizeSVG } from "./render/rasterizer.js";

import { buildSceneGraph, getMarkerDefs } from "./render/strategies/scene-builder.js";
import { renderSceneGraphToSVG } from "./render/strategies/svg-renderer.js";
import { buildDataVizSceneGraph } from "./render/strategies/data-viz-svg.js";
import { buildFlowSceneGraph } from "./render/strategies/flow-svg.js";
import { buildCanvasSceneGraph } from "./render/strategies/canvas-svg.js";
import { SceneGraph } from "./scene/scene-graph.js";
import { exportToReactFlow, ReactFlowConfig } from "./react-flow/adapter.js";

export interface RenderResult {
  svg: string;
  png: Buffer;
  metadata: {
    width: number;
    height: number;
  };
  reactFlow?: ReactFlowConfig;
}

// Orchestrator that routes to appropriate strategy based on diagram type
export async function processDiagram(input: unknown, fontBuffer?: ArrayBuffer): Promise<RenderResult> {
  // 1. Validate JSON strictly using Zod
  const validatedDiagram: DiagramInputType = DiagramInput.parse(input);
  const handler = DIAGRAM_REGISTRY[validatedDiagram.type];

  let svg = "";
  let scene: SceneGraph;
  let layoutWidth = 0;
  let layoutHeight = 0;

  let layout;

  if (handler.render === "canvas") {
    // Canvas bypasses the layout engine entirely
    scene = buildCanvasSceneGraph(validatedDiagram as any);
    layoutWidth = scene.width;
    layoutHeight = scene.height;
  } else {
    // 2. Route to layout engine, then to the registered rendering strategy
    layout = await layoutDiagram(validatedDiagram);
    layoutWidth = layout.width;
    layoutHeight = layout.height;

    const diagType = validatedDiagram.type as string;
    if (handler.render === "data-viz") {
      scene = buildDataVizSceneGraph(layout, diagType);
    } else if (handler.render === "flow") {
      scene = buildFlowSceneGraph(layout, diagType);
    } else {
      scene = buildSceneGraph(layout, (validatedDiagram as any).theme, handler.maskLabels ?? false);
    }
  }

  const defs = scene.defs || getMarkerDefs();
  svg = renderSceneGraphToSVG(scene, defs);

  // 4. Rasterize to PNG
  const png = rasterizeSVG(svg, { dpi: 2, fontBuffer }); // 2x resolution for crispness

  let reactFlowConfig: ReactFlowConfig | undefined;
  // react-flow export applies to graph layouts (scene/flow), not data-viz or canvas.
  if (layout && handler.render !== "data-viz") {
    reactFlowConfig = exportToReactFlow(layout);
  }

  return {
    svg,
    png,
    metadata: {
      width: layoutWidth,
      height: layoutHeight
    },
    reactFlow: reactFlowConfig
  };
}
