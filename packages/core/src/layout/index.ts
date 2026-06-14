import { DiagramInputType } from "@glyphic/schema";
import { LayoutResult } from "./types.js";
import { DIAGRAM_REGISTRY } from "../registry.js";
import { StyleTokens } from "../render/style.js";

export * from "./types.js";
export * from "./elk-adapter.js";
export * from "./sequence-adapter.js";
export * from "./canvas-adapter.js";

export async function layoutDiagram(diagram: DiagramInputType, style?: StyleTokens): Promise<LayoutResult> {
  const handler = DIAGRAM_REGISTRY[diagram.type];
  if (!handler?.layout) {
    throw new Error(`No layout adapter registered for diagram type "${diagram.type}"`);
  }
  return handler.layout(diagram, style);
}
