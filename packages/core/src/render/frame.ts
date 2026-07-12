import type { SceneGraph, SceneElement, SceneRect } from "../scene/scene-graph.js";

// Aspect-ratio framing: pad a rendered scene out to a target width/height ratio
// by adding whitespace and centering the content. We never scale (which would
// distort text and density) or crop (which would lose content) — only pad.

export type AspectRatioInput = "auto" | "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "none";

const EXPLICIT_RATIOS: Record<string, number> = {
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
};

/**
 * Resolve the target width/height ratio for a diagram, or null to skip framing.
 *
 * Auto-framing only applies to the direction-based graph types (flowchart /
 * architecture) — the "horizontal vs top-bottom" diagrams where snapping to a
 * 16:9 / 9:16 frame is genuinely useful. Every other type (sequence, gantt,
 * erd, pie, …) has its own natural proportions and is left unframed unless the
 * caller sets an explicit `aspectRatio`. An explicit value always wins; "none"
 * disables framing.
 */
export function targetRatioFor(
  type: string,
  direction: string | undefined,
  override: AspectRatioInput | undefined
): number | null {
  if (override === "none") return null;
  if (override && override !== "auto" && override in EXPLICIT_RATIOS) {
    return EXPLICIT_RATIOS[override];
  }

  // auto / undefined: only direction-based graph types are auto-framed.
  if (type === "flowchart" || type === "architecture") {
    if (direction === "LR" || direction === "RL") return 16 / 9;
    return 9 / 16; // TB / BT / default
  }

  // All other types keep their natural aspect ratio by default.
  return null;
}

// In "auto" mode, skip framing when the content would occupy less than this
// fraction of the padded axis — otherwise we'd float content in a sea of
// whitespace. Explicit ratios bypass this guard.
const MIN_CONTENT_FRACTION = 0.62;

function isFullCanvasBackground(el: SceneElement, width: number, height: number): el is SceneRect {
  return (
    el.type === "rect" &&
    el.x === 0 &&
    el.y === 0 &&
    Math.abs(el.width - width) < 0.5 &&
    Math.abs(el.height - height) < 0.5
  );
}

/**
 * Pad a scene out to `targetRatio` (width/height), centering the existing
 * content. Returns the scene unchanged when no padding is needed or when the
 * content is an outlier (auto mode only — `isExplicit` bypasses the guard).
 */
export function frameScene(
  scene: SceneGraph,
  targetRatio: number,
  backgroundColor: string,
  isExplicit = false
): SceneGraph {
  const { width: W, height: H } = scene;
  if (W <= 0 || H <= 0) return scene;

  const contentRatio = W / H;
  let newW = W;
  let newH = H;

  if (contentRatio < targetRatio) {
    // Too tall/narrow — widen.
    newW = H * targetRatio;
  } else if (contentRatio > targetRatio) {
    // Too wide/short — heighten.
    newH = W / targetRatio;
  } else {
    return scene; // already exact
  }

  // Outlier guard for auto framing: don't float tiny content in a huge frame.
  if (!isExplicit) {
    const widthFraction = W / newW;
    const heightFraction = H / newH;
    if (widthFraction < MIN_CONTENT_FRACTION || heightFraction < MIN_CONTENT_FRACTION) {
      return scene;
    }
  }

  const offsetX = (newW - W) / 2;
  const offsetY = (newH - H) / 2;

  const elements = [...scene.elements];
  let contentStart = 0;
  if (elements.length > 0 && isFullCanvasBackground(elements[0], W, H)) {
    // Resize the existing background to cover the framed canvas.
    elements[0] = { ...elements[0], width: newW, height: newH };
    contentStart = 1;
  }

  const content = elements.slice(contentStart);
  const centered: SceneElement = {
    type: "group",
    transform: `translate(${offsetX}, ${offsetY})`,
    children: content,
  };

  const framedElements: SceneElement[] =
    contentStart === 1
      ? [elements[0], centered]
      : [{ type: "rect", x: 0, y: 0, width: newW, height: newH, fill: backgroundColor }, centered];

  return {
    width: newW,
    height: newH,
    elements: framedElements,
    defs: scene.defs,
  };
}
