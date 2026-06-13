import { LayoutResult } from "../../layout/types.js";
import { SceneGraph, SceneElement, SceneGroup } from "../../scene/scene-graph.js";
import { ThemeColors, DEFAULT_THEME, PADDING } from "./scene-builder.js";
import { resolveFontFamily } from "../theme.js";

export function buildFlowSceneGraph(layout: LayoutResult, diagramType: string, theme: ThemeColors = DEFAULT_THEME): SceneGraph {
  const width = layout.width + PADDING * 2;
  const height = layout.height + PADDING * 2;

  const elements: SceneElement[] = [];
  elements.push({ type: 'rect', x: 0, y: 0, width, height, fill: theme.background });

  const rootGroup: SceneGroup = {
    type: 'group',
    transform: `translate(${PADDING}, ${PADDING})`,
    children: []
  };

  if (diagramType === "gantt") {
    buildGanttChart(layout, theme, rootGroup.children);
  } else if (diagramType === "sankey") {
    buildSankeyDiagram(layout, theme, rootGroup.children);
  } else if (diagramType === "git") {
    buildGitGraph(layout, theme, rootGroup.children);
  } else if (diagramType === "timeline") {
    buildTimeline(layout, theme, rootGroup.children);
  } else if (diagramType === "journey") {
    buildJourney(layout, theme, rootGroup.children);
  } else if (diagramType === "kanban") {
    buildKanban(layout, theme, rootGroup.children);
  }

  elements.push(rootGroup);

  return { width, height, elements };
}

function buildGanttChart(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  const config = layout.nodes.find(n => n.shape === "gantt_config")?.metadata;
  if (!config) return;

  if (config.title) {
    elements.push({ type: 'text', x: layout.width / 2, y: 40, content: config.title, textAnchor: 'middle', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 24, fontWeight: 700, fill: theme.nodeText });
  }

  const gridSteps = 10;
  const stepWidth = config.timelineWidth / gridSteps;
  const stepTime = (config.maxTime - config.minTime) / gridSteps;

  for (let i = 0; i <= gridSteps; i++) {
    const x = config.leftMargin + (i * stepWidth);
    elements.push({ type: 'line', x1: x, y1: 80, x2: x, y2: layout.height - 20, stroke: theme.edgeColor, strokeDasharray: "4 4", opacity: 0.3, strokeWidth: 1 });
    
    const timeVal = config.minTime + (i * stepTime);
    let labelText = timeVal.toFixed(0);
    if (config.dateFormat !== "generic") {
      labelText = new Date(timeVal).toLocaleDateString();
    }
    elements.push({ type: 'text', x, y: 70, content: labelText, textAnchor: 'middle', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 12, fill: theme.edgeLabelColor });
  }

  for (const node of layout.nodes) {
    if (node.shape === "gantt_section") {
      elements.push({ type: 'text', x: node.x, y: node.y + node.height / 2, content: node.label, dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 16, fontWeight: 700, fill: theme.nodeText });
    } else if (node.shape === "gantt_task_label") {
      elements.push({ type: 'text', x: node.x, y: node.y + node.height / 2, content: node.label, dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fill: theme.nodeText });
    } else if (node.shape === "gantt_task") {
      elements.push({ type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, rx: 6, ry: 6, fill: theme.nodeBackground, stroke: theme.nodeBorder, strokeWidth: 2 });
    }
  }

  for (const edge of layout.edges) {
    if (edge.sections.length > 0) {
      const sec = edge.sections[0];
      const start = sec.startPoint;
      const end = sec.endPoint;
      // Add a horizontal runway before the arrow so the curve completely flattens out.
      // Scale control point distance by vertical drop to make curves gentler.
      const dy = Math.abs(end.y - start.y);
      const cpDist = Math.max(30, dy * 0.6);
      const runwayX = end.x - 12;
      
      const pathD = `M ${start.x} ${start.y} C ${start.x + cpDist} ${start.y}, ${runwayX - cpDist} ${end.y}, ${runwayX} ${end.y} L ${end.x - 4} ${end.y}`;
      
      elements.push({ type: 'path', d: pathD, fill: 'none', stroke: theme.edgeColor, strokeWidth: 2 });
      // Clean 8x8 custom arrowhead for Gantt that doesn't overwhelm the timeline
      elements.push({ type: 'polygon', points: `${end.x - 8},${end.y - 4} ${end.x},${end.y} ${end.x - 8},${end.y + 4}`, fill: theme.edgeColor });
    }
  }
}

function buildSankeyDiagram(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  const nodeById = new Map(layout.nodes.map((n) => [n.id, n] as const));
  // Edges first
  for (const edge of layout.edges) {
    const srcNode = nodeById.get(edge.source);
    const tgtNode = nodeById.get(edge.target);
    if (!srcNode || !tgtNode) continue;

    const startX = srcNode.x + srcNode.width;
    const endX = tgtNode.x;
    
    const startY = edge.metadata?.y0 || srcNode.y + srcNode.height / 2;
    const endY = edge.metadata?.y1 || tgtNode.y + tgtNode.height / 2;
    const edgeThick = Math.max(1, edge.metadata?.width || 5);

    const midX = (startX + endX) / 2;

    const pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
    elements.push({ type: 'path', d: pathD, fill: 'none', stroke: theme.nodeBorder, strokeWidth: edgeThick, opacity: 0.3 });
  }

  // Nodes
  for (const node of layout.nodes) {
    const color = node.metadata?.color || theme.nodeBorder;
    elements.push({ type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, fill: color, rx: 4, ry: 4 });
    elements.push({ type: 'text', x: node.x + node.width / 2, y: node.y - 10, content: node.label, textAnchor: 'middle', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 600, fill: theme.nodeText });
  }
}

function buildGitGraph(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  const branchColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
  const nodeById = new Map(layout.nodes.map((n) => [n.id, n] as const));

  for (const edge of layout.edges) {
    const srcNode = nodeById.get(edge.source);
    const tgtNode = nodeById.get(edge.target);
    if (!srcNode || !tgtNode) continue;

    const srcX = srcNode.x;
    const srcY = srcNode.y;
    const tgtX = tgtNode.x;
    const tgtY = tgtNode.y;

    const color = branchColors[(tgtNode.metadata?.laneIndex || 0) % branchColors.length];

    if (srcY === tgtY) {
      elements.push({ type: 'line', x1: srcX, y1: srcY, x2: tgtX, y2: tgtY, stroke: color, strokeWidth: 4 });
    } else {
      const pathD = `M ${srcX} ${srcY} C ${srcX + 40} ${srcY}, ${tgtX - 40} ${tgtY}, ${tgtX} ${tgtY}`;
      elements.push({ type: 'path', d: pathD, fill: 'none', stroke: color, strokeWidth: 4 });
    }
  }

  for (const node of layout.nodes) {
    const laneIndex = node.metadata?.laneIndex || 0;
    const color = branchColors[laneIndex % branchColors.length];
    
    elements.push({ type: 'circle', cx: node.x, cy: node.y, r: 8, fill: theme.background, stroke: color, strokeWidth: 4 });
    
    const yOffset = node.metadata?.alternateLabel ? -24 : 24;
    elements.push({ type: 'text', x: node.x, y: node.y + yOffset, content: node.label, textAnchor: 'middle', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 12, fill: theme.nodeText });
    
    if (node.metadata?.tag) {
      const tagY = node.y + (node.metadata?.alternateLabel ? -45 : 45);
      elements.push({ type: 'rect', x: node.x - 30, y: tagY - 10, width: 60, height: 20, rx: 4, ry: 4, fill: theme.nodeBackground, stroke: theme.nodeBorder, strokeWidth: 1 });
      elements.push({ type: 'text', x: node.x, y: tagY, content: node.metadata.tag, textAnchor: 'middle', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 10, fontWeight: 600, fill: theme.nodeText });
    }
  }
}

const CHRONO_PALETTE = ["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];

function wrapLabel(text: string, maxChars: number): string[] {
  const words = String(text).split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function buildChronoTitle(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  const config = layout.nodes.find((n) => n.shape === "chrono_config")?.metadata;
  if (config?.title) {
    elements.push({ type: 'text', x: layout.width / 2, y: 52, content: config.title, textAnchor: 'middle', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 26, fontWeight: 700, fill: theme.nodeText });
  }
}

function buildColumnHeader(node: LayoutResult["nodes"][number], color: string, theme: ThemeColors, elements: SceneElement[]) {
  elements.push({ type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, rx: 10, ry: 10, fill: color });
  elements.push({ type: 'text', x: node.x + node.width / 2, y: node.y + node.height / 2, content: node.label, textAnchor: 'middle', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 16, fontWeight: 700, fill: '#ffffff' });
}

function buildTimeline(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  buildChronoTitle(layout, theme, elements);
  for (const node of layout.nodes) {
    const color = CHRONO_PALETTE[(node.metadata?.idx ?? 0) % CHRONO_PALETTE.length];
    if (node.shape === "timeline_period") {
      buildColumnHeader(node, color, theme, elements);
    } else if (node.shape === "timeline_event") {
      elements.push({ type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, rx: 8, ry: 8, fill: theme.nodeBackground, stroke: color, strokeWidth: 1.5 });
      elements.push({ type: 'rect', x: node.x, y: node.y, width: 6, height: node.height, rx: 3, ry: 3, fill: color });
      const lines = wrapLabel(node.label, 32);
      const lh = 18;
      const startY = node.y + node.height / 2 - ((lines.length - 1) * lh) / 2;
      lines.forEach((line, k) => {
        elements.push({ type: 'text', x: node.x + 18, y: startY + k * lh, content: line, textAnchor: 'start', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 13, fill: theme.nodeText });
      });
    }
  }
}

const SCORE_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
const scoreColor = (s: number): string => SCORE_COLORS[Math.max(1, Math.min(5, Math.round(s))) - 1];

function buildJourney(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  buildChronoTitle(layout, theme, elements);
  for (const node of layout.nodes) {
    if (node.shape === "journey_section") {
      const color = CHRONO_PALETTE[(node.metadata?.idx ?? 0) % CHRONO_PALETTE.length];
      buildColumnHeader(node, color, theme, elements);
    } else if (node.shape === "journey_task") {
      const score = node.metadata?.score ?? 3;
      const sc = scoreColor(score);
      elements.push({ type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, rx: 8, ry: 8, fill: theme.nodeBackground, stroke: sc, strokeWidth: 1.5 });
      elements.push({ type: 'rect', x: node.x, y: node.y, width: 6, height: node.height, rx: 3, ry: 3, fill: sc });
      // satisfaction score pill (top-right)
      const pillX = node.x + node.width - 24;
      const pillY = node.y + 22;
      elements.push({ type: 'circle', cx: pillX, cy: pillY, r: 13, fill: sc });
      elements.push({ type: 'text', x: pillX, y: pillY, content: String(score), textAnchor: 'middle', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 13, fontWeight: 700, fill: '#ffffff' });
      const lines = wrapLabel(node.label, 24).slice(0, 2);
      lines.forEach((line, k) => {
        elements.push({ type: 'text', x: node.x + 18, y: node.y + 26 + k * 17, content: line, textAnchor: 'start', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 600, fill: theme.nodeText });
      });
      const actors = (node.metadata?.actors ?? []) as string[];
      if (actors.length) {
        elements.push({ type: 'text', x: node.x + 18, y: node.y + node.height - 18, content: actors.join(", "), textAnchor: 'start', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 11, fill: theme.edgeLabelColor });
      }
    }
  }
}

const PRIORITY_COLORS: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

function buildKanban(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  buildChronoTitle(layout, theme, elements);
  for (const node of layout.nodes) {
    if (node.shape === "kanban_column") {
      const color = CHRONO_PALETTE[(node.metadata?.idx ?? 0) % CHRONO_PALETTE.length];
      buildColumnHeader(node, color, theme, elements);
    } else if (node.shape === "kanban_card") {
      const pr = node.metadata?.priority as string | undefined;
      const accent = (pr && PRIORITY_COLORS[pr]) || theme.nodeBorder;
      elements.push({ type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, rx: 8, ry: 8, fill: theme.nodeBackground, stroke: theme.nodeBorder, strokeWidth: 1 });
      elements.push({ type: 'rect', x: node.x, y: node.y, width: node.width, height: 5, rx: 2, ry: 2, fill: accent });
      wrapLabel(node.label, 28).slice(0, 2).forEach((line, k) => {
        elements.push({ type: 'text', x: node.x + 14, y: node.y + 28 + k * 17, content: line, textAnchor: 'start', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 600, fill: theme.nodeText });
      });
      const assignee = node.metadata?.assignee as string | undefined;
      if (assignee) {
        elements.push({ type: 'text', x: node.x + 14, y: node.y + node.height - 16, content: assignee, textAnchor: 'start', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 11, fill: theme.edgeLabelColor });
      }
      const tag = node.metadata?.tag as string | undefined;
      if (tag) {
        const tagW = Math.max(36, tag.length * 7 + 16);
        elements.push({ type: 'rect', x: node.x + node.width - tagW - 12, y: node.y + node.height - 27, width: tagW, height: 19, rx: 9, ry: 9, fill: accent, opacity: 0.2 });
        elements.push({ type: 'text', x: node.x + node.width - tagW / 2 - 12, y: node.y + node.height - 17, content: tag, textAnchor: 'middle', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 10, fontWeight: 600, fill: accent });
      }
    }
  }
}
