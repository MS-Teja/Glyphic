import { SceneGraph, SceneElement, SceneGroup } from "../../scene/scene-graph.js";
import { CanvasDiagramType, CanvasElement } from "@glyphic/schema";
import { ThemeColors, DEFAULT_THEME, PADDING } from "./scene-builder.js";
import { resolveFontFamily } from "../theme.js";

function applyThemeToCanvasElement(element: any, theme: ThemeColors): SceneElement {
  const themedElement = { ...element };

  switch (themedElement.type) {
    case "rect":
    case "circle":
    case "ellipse":
    case "polygon":
      if (!themedElement.fill) themedElement.fill = theme.nodeBackground;
      if (!themedElement.stroke) themedElement.stroke = theme.nodeBorder;
      if (!themedElement.strokeWidth) themedElement.strokeWidth = 2;
      break;
    case "line":
    case "path":
      if (!themedElement.stroke) themedElement.stroke = theme.edgeColor;
      if (themedElement.type === "path" && !themedElement.fill) themedElement.fill = "none";
      if (!themedElement.strokeWidth) themedElement.strokeWidth = 2;
      break;
    case "text":
      if (!themedElement.fill) themedElement.fill = theme.nodeText;
      if (!themedElement.fontFamily) themedElement.fontFamily = resolveFontFamily(theme.fontFamily);
      break;
    case "group":
      themedElement.children = (themedElement.children || []).map((child: any) => applyThemeToCanvasElement(child, theme));
      break;
  }
  return themedElement as SceneElement;
}

export function buildCanvasSceneGraph(diagram: CanvasDiagramType, theme: ThemeColors = DEFAULT_THEME): SceneGraph {
  const width = diagram.width + PADDING * 2;
  const height = diagram.height + PADDING * 2;

  const elements: SceneElement[] = [];
  
  // Background
  elements.push({ type: 'rect', x: 0, y: 0, width, height, fill: theme.background });

  // Main group translated by padding
  const rootGroup: SceneGroup = {
    type: 'group',
    transform: `translate(${PADDING}, ${PADDING})`,
    children: diagram.elements.map(el => applyThemeToCanvasElement(el, theme))
  };

  elements.push(rootGroup);

  return { width, height, elements };
}
