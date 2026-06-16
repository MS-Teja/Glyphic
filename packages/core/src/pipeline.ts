import { DiagramInput, DiagramInputType } from "@glyphicjs/schema";
import { layoutDiagram } from "./layout/index.js";
import { DIAGRAM_REGISTRY } from "./registry.js";
import { resolveThemePartial, DEFAULT_THEME } from "./render/theme.js";
import { resolveStyle } from "./render/style.js";
import { targetRatioFor, frameScene, AspectRatioInput } from "./render/frame.js";
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

  // Resolve theme once (preset name or object) and apply it to every strategy.
  const themePartial = resolveThemePartial((validatedDiagram as any).theme);
  const fullTheme = { ...DEFAULT_THEME, ...themePartial };

  // Resolve the render style (geometry/spacing/stroke), default `compact`.
  const style = resolveStyle((validatedDiagram as any).style);

  let svg = "";
  let scene: SceneGraph;
  let layoutWidth = 0;
  let layoutHeight = 0;

  let layout;

  if (handler.render === "canvas") {
    // Canvas bypasses the layout engine entirely
    scene = buildCanvasSceneGraph(validatedDiagram as any, fullTheme, style);
  } else {
    // 2. Route to layout engine, then to the registered rendering strategy
    layout = await layoutDiagram(validatedDiagram, style);

    const diagType = validatedDiagram.type as string;
    if (handler.render === "data-viz") {
      scene = buildDataVizSceneGraph(layout, diagType, fullTheme, style);
    } else if (handler.render === "flow") {
      scene = buildFlowSceneGraph(layout, diagType, fullTheme, style);
    } else {
      // buildSceneGraph merges DEFAULT_THEME and auto-contrasts edge labels,
      // so pass the partial (not the merged theme) to preserve that behavior.
      scene = buildSceneGraph(layout, themePartial, handler.maskLabels ?? false, style);
    }
  }

  // metadata reflects the actual rendered scene (including layout padding).
  layoutWidth = scene.width;
  layoutHeight = scene.height;

  // Frame to a target aspect ratio (pad-only letterbox) before rasterizing.
  const aspectRatio = (validatedDiagram as any).aspectRatio as AspectRatioInput | undefined;
  const ratio = targetRatioFor(validatedDiagram.type, (validatedDiagram as any).direction, aspectRatio);
  if (ratio) {
    const isExplicit = aspectRatio !== undefined && aspectRatio !== "auto";
    scene = frameScene(scene, ratio, fullTheme.background, isExplicit);
    layoutWidth = scene.width;
    layoutHeight = scene.height;
  }

  const defs = scene.defs || getMarkerDefs();
  svg = renderSceneGraphToSVG(scene, defs, (validatedDiagram as any).title);

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
