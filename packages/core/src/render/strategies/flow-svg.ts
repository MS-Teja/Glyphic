import { LayoutResult } from "../../layout/types.js";
import { SceneGraph, SceneElement, SceneGroup } from "../../scene/scene-graph.js";
import { ThemeColors, DEFAULT_THEME, PADDING } from "./scene-builder.js";

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
  }

  elements.push(rootGroup);

  return { width, height, elements };
}

function buildGanttChart(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  const config = layout.nodes.find(n => n.shape === "gantt_config")?.metadata;
  if (!config) return;

  if (config.title) {
    elements.push({ type: 'text', x: layout.width / 2, y: 40, content: config.title, textAnchor: 'middle', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 24, fontWeight: 700, fill: theme.nodeText });
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
    elements.push({ type: 'text', x, y: 70, content: labelText, textAnchor: 'middle', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, fill: theme.edgeLabelColor });
  }

  for (const node of layout.nodes) {
    if (node.shape === "gantt_section") {
      elements.push({ type: 'text', x: node.x, y: node.y + node.height / 2, content: node.label, dominantBaseline: 'central', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 16, fontWeight: 700, fill: theme.nodeText });
    } else if (node.shape === "gantt_task_label") {
      elements.push({ type: 'text', x: node.x, y: node.y + node.height / 2, content: node.label, dominantBaseline: 'central', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fill: theme.nodeText });
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
  // Edges first
  for (const edge of layout.edges) {
    const srcNode = layout.nodes.find(n => n.id === edge.source);
    const tgtNode = layout.nodes.find(n => n.id === edge.target);
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
    elements.push({ type: 'text', x: node.x + node.width / 2, y: node.y - 10, content: node.label, textAnchor: 'middle', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 600, fill: theme.nodeText });
  }
}

function buildGitGraph(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  const branchColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  for (const edge of layout.edges) {
    const srcNode = layout.nodes.find(n => n.id === edge.source);
    const tgtNode = layout.nodes.find(n => n.id === edge.target);
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
    elements.push({ type: 'text', x: node.x, y: node.y + yOffset, content: node.label, textAnchor: 'middle', dominantBaseline: 'central', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, fill: theme.nodeText });
    
    if (node.metadata?.tag) {
      const tagY = node.y + (node.metadata?.alternateLabel ? -45 : 45);
      elements.push({ type: 'rect', x: node.x - 30, y: tagY - 10, width: 60, height: 20, rx: 4, ry: 4, fill: theme.nodeBackground, stroke: theme.nodeBorder, strokeWidth: 1 });
      elements.push({ type: 'text', x: node.x, y: tagY, content: node.metadata.tag, textAnchor: 'middle', dominantBaseline: 'central', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, fontWeight: 600, fill: theme.nodeText });
    }
  }
}
