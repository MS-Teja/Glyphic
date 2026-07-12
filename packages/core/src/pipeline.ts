import { DiagramInput, type DiagramInputType } from "@glyphicjs/schema";
import { layoutDiagram, type LayoutResult } from "./layout/index.js";
import { DIAGRAM_REGISTRY } from "./registry.js";
import { resolveThemePartial, DEFAULT_THEME } from "./render/theme.js";
import { resolveStyle } from "./render/style.js";
import { targetRatioFor, frameScene, type AspectRatioInput } from "./render/frame.js";
import { rasterizeSVG } from "./render/rasterizer.js";

import { buildSceneGraph, getMarkerDefs } from "./render/strategies/scene-builder.js";
import { renderSceneGraphToSVG } from "./render/strategies/svg-renderer.js";
import { buildDataVizSceneGraph } from "./render/strategies/data-viz-svg.js";
import { buildFlowSceneGraph } from "./render/strategies/flow-svg.js";
import { buildCanvasSceneGraph } from "./render/strategies/canvas-svg.js";
import type { SceneGraph } from "./scene/scene-graph.js";
import { exportToReactFlow, type ReactFlowConfig } from "./react-flow/adapter.js";

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

  // title/theme/style/aspectRatio live on BaseDiagram, so every variant of the
  // discriminated union has them — plain property access, no cast needed.
  // `direction` only exists on some variants.
  const direction = "direction" in validatedDiagram ? validatedDiagram.direction : undefined;

  // Resolve theme once (preset name or object) and apply it to every strategy.
  const themePartial = resolveThemePartial(validatedDiagram.theme);
  const fullTheme = { ...DEFAULT_THEME, ...themePartial };

  // Resolve the render style (geometry/spacing/stroke), default `compact`.
  const style = resolveStyle(validatedDiagram.style);

  let svg = "";
  let scene: SceneGraph;
  let layoutWidth = 0;
  let layoutHeight = 0;

  let layout: LayoutResult | undefined;

  // Branch on the discriminant so TypeScript narrows to the canvas variant. The
  // registry guarantees type "canvas" <-> the canvas ("canvas" render) handler.
  if (validatedDiagram.type === "canvas") {
    // Canvas bypasses the layout engine entirely
    scene = buildCanvasSceneGraph(validatedDiagram, fullTheme, style);
  } else {
    // 2. Route to layout engine, then to the registered rendering strategy
    layout = await layoutDiagram(validatedDiagram, style);

    const diagType = validatedDiagram.type;
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
  const aspectRatio = validatedDiagram.aspectRatio as AspectRatioInput | undefined;
  const ratio = targetRatioFor(validatedDiagram.type, direction, aspectRatio);
  if (ratio) {
    const isExplicit = aspectRatio !== undefined && aspectRatio !== "auto";
    scene = frameScene(scene, ratio, fullTheme.background, isExplicit);
    layoutWidth = scene.width;
    layoutHeight = scene.height;
  }

  const defs = scene.defs || getMarkerDefs();
  svg = renderSceneGraphToSVG(scene, defs, validatedDiagram.title);

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

export async function processSVG(input: unknown): Promise<{ svg: string }> {
  // 1. Validate JSON strictly using Zod
  const validatedDiagram: DiagramInputType = DiagramInput.parse(input);
  const handler = DIAGRAM_REGISTRY[validatedDiagram.type];

  // title/theme/style/aspectRatio are BaseDiagram fields present on every
  // variant; `direction` only on some.
  const direction = "direction" in validatedDiagram ? validatedDiagram.direction : undefined;

  const themePartial = resolveThemePartial(validatedDiagram.theme);
  const fullTheme = { ...DEFAULT_THEME, ...themePartial };
  const style = resolveStyle(validatedDiagram.style);

  let svg = "";
  let scene: SceneGraph;

  // Branch on the discriminant so TypeScript narrows to the canvas variant. The
  // registry guarantees type "canvas" <-> the canvas ("canvas" render) handler.
  if (validatedDiagram.type === "canvas") {
    scene = buildCanvasSceneGraph(validatedDiagram, fullTheme, style);
  } else {
    const layout = await layoutDiagram(validatedDiagram, style);
    const diagType = validatedDiagram.type;
    if (handler.render === "data-viz") {
      scene = buildDataVizSceneGraph(layout, diagType, fullTheme, style);
    } else if (handler.render === "flow") {
      scene = buildFlowSceneGraph(layout, diagType, fullTheme, style);
    } else {
      scene = buildSceneGraph(layout, themePartial, handler.maskLabels ?? false, style);
    }
  }

  const aspectRatio = validatedDiagram.aspectRatio as AspectRatioInput | undefined;
  const ratio = targetRatioFor(validatedDiagram.type, direction, aspectRatio);
  if (ratio) {
    const isExplicit = aspectRatio !== undefined && aspectRatio !== "auto";
    scene = frameScene(scene, ratio, fullTheme.background, isExplicit);
  }

  const defs = scene.defs || getMarkerDefs();
  svg = renderSceneGraphToSVG(scene, defs, validatedDiagram.title);

  return { svg };
}
