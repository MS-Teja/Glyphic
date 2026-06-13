import { LayoutResult } from "../../layout/types.js";
import { SceneGraph, SceneElement, SceneGroup } from "../../scene/scene-graph.js";
import { ThemeColors, DEFAULT_THEME, PADDING } from "./scene-builder.js";
import { resolveFontFamily } from "../theme.js";

function getColorsForSlices(count: number): string[] {
  const palette = [
    "#4f46e5", "#ec4899", "#f59e0b", "#10b981", 
    "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6", 
    "#f97316", "#06b6d4", "#6366f1", "#d946ef"
  ];
  return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
}

export function buildDataVizSceneGraph(layout: LayoutResult, diagramType: string, theme: ThemeColors = DEFAULT_THEME): SceneGraph {
  const width = layout.width + PADDING * 2;
  const height = layout.height + PADDING * 2;
  
  const elements: SceneElement[] = [];
  elements.push({ type: 'rect', x: 0, y: 0, width, height, fill: theme.background });

  const rootGroup: SceneGroup = {
    type: 'group',
    transform: `translate(${PADDING}, ${PADDING})`,
    children: []
  };

  const titleNode = layout.nodes.find(n => n.shape === "title");
  if (titleNode) {
    rootGroup.children.push({
      type: 'text', x: titleNode.x, y: titleNode.y, content: titleNode.label,
      textAnchor: 'middle', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 24, fontWeight: 700, fill: theme.nodeText
    });
  }

  if (diagramType === "pie") {
    buildPieChart(layout, theme, rootGroup.children);
  } else if (diagramType === "quadrant") {
    buildQuadrantChart(layout, theme, rootGroup.children);
  }

  elements.push(rootGroup);

  return { width, height, elements };
}

function buildPieChart(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  const slices = layout.nodes.filter(n => n.shape === "pie_slice");
  if (slices.length === 0) return;

  const configNode = layout.nodes.find(n => n.shape === "pie_config");
  const metadata = configNode?.metadata || {};

  const cx = metadata.cx ?? layout.width / 2;
  const cy = metadata.cy ?? layout.height / 2;
  const radius = metadata.radius ?? Math.min(layout.width, layout.height) * 0.25;

  let currentAngle = -Math.PI / 2; 

  const colors = getColorsForSlices(slices.length);

  const totalValue = slices.reduce((sum, s) => sum + (s.metadata?.value || 0), 0);
  const normalize = totalValue > 0 ? 100 / totalValue : 1;

  // First pass: compute all slice geometries and initial label positions
  interface SliceInfo {
    slice: typeof slices[0];
    rawValue: number;
    value: number;
    sliceColor: string;
    startAngle: number;
    endAngle: number;
    midAngle: number;
    ex: number;
    ey: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    largeArcFlag: number;
    isFullCircle: boolean;
    // Label positioning
    ptrStartX: number;
    ptrStartY: number;
    ptrMidX: number;
    ptrMidY: number;
    dirX: number;
    labelX: number;
    labelY: number;
    textAnchor: 'start' | 'end';
  }

  const sliceInfos: SliceInfo[] = [];

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    const rawValue = slice.metadata?.value || 0;
    const value = rawValue * normalize;
    const explodeOffset = slice.metadata?.explode || 0;
    const sliceColor = slice.metadata?.color || colors[i];
    
    const sliceAngle = (value / 100) * Math.PI * 2;
    const endAngle = currentAngle + sliceAngle;
    const midAngle = currentAngle + sliceAngle / 2;

    const ex = cx + explodeOffset * Math.cos(midAngle);
    const ey = cy + explodeOffset * Math.sin(midAngle);

    const startX = ex + radius * Math.cos(currentAngle);
    const startY = ey + radius * Math.sin(currentAngle);
    const endX = ex + radius * Math.cos(endAngle);
    const endY = ey + radius * Math.sin(endAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    const isFullCircle = value >= 99.9;

    const ptrStartX = ex + radius * 0.9 * Math.cos(midAngle);
    const ptrStartY = ey + radius * 0.9 * Math.sin(midAngle);
    const ptrMidX = ex + radius * 1.15 * Math.cos(midAngle);
    const ptrMidY = ey + radius * 1.15 * Math.sin(midAngle);
    const dirX = Math.cos(midAngle) > 0 ? 1 : -1;

    const labelX = ptrMidX + dirX * (radius * 0.15) + dirX * 3;
    const labelY = ptrMidY;

    sliceInfos.push({
      slice, rawValue, value, sliceColor,
      startAngle: currentAngle, endAngle, midAngle,
      ex, ey, startX, startY, endX, endY,
      largeArcFlag, isFullCircle,
      ptrStartX, ptrStartY, ptrMidX, ptrMidY, dirX,
      labelX, labelY,
      textAnchor: dirX > 0 ? 'start' : 'end'
    });

    currentAngle = endAngle;
  }

  // Second pass: deconflict overlapping labels
  // Separate into left-side and right-side labels and sort by Y
  const leftLabels = sliceInfos.filter(s => s.dirX < 0);
  const rightLabels = sliceInfos.filter(s => s.dirX > 0);

  const deconflictGroup = (group: SliceInfo[]) => {
    // Sort by initial Y position
    group.sort((a, b) => a.labelY - b.labelY);
    
    const minGap = 18; // minimum vertical gap between label centers
    for (let iter = 0; iter < 20; iter++) {
      let moved = false;
      for (let i = 0; i < group.length - 1; i++) {
        const diff = group[i + 1].labelY - group[i].labelY;
        if (diff < minGap) {
          const shift = (minGap - diff) / 2;
          group[i].labelY -= shift;
          group[i + 1].labelY += shift;
          moved = true;
        }
      }
      if (!moved) break;
    }
  };

  deconflictGroup(leftLabels);
  deconflictGroup(rightLabels);

  // Third pass: render slices, leader lines, and labels
  for (const info of sliceInfos) {
    // Draw slice
    if (info.isFullCircle) {
      elements.push({ type: 'circle', cx: info.ex, cy: info.ey, r: radius, fill: info.sliceColor });
    } else {
      const pathD = [
        `M ${info.ex} ${info.ey}`,
        `L ${info.startX} ${info.startY}`,
        `A ${radius} ${radius} 0 ${info.largeArcFlag} 1 ${info.endX} ${info.endY}`,
        `Z`
      ].join(" ");
      elements.push({ type: 'path', d: pathD, fill: info.sliceColor, stroke: theme.background, strokeWidth: 2 });
    }

    // Draw leader line from slice to (possibly adjusted) label position
    const ptrEndX = info.labelX - info.dirX * 3; // back up from label position
    const ptrEndY = info.labelY;
    
    elements.push({
      type: 'path',
      d: `M ${info.ptrStartX} ${info.ptrStartY} L ${info.ptrMidX} ${info.ptrMidY} L ${ptrEndX} ${ptrEndY}`,
      fill: 'none', stroke: theme.nodeBorder, strokeWidth: 1.5
    });

    // Draw label
    const displayVal = Number(info.rawValue.toFixed(1));
    elements.push({
      type: 'text', x: info.labelX, y: info.labelY, content: `${info.slice.label} (${displayVal}%)`,
      textAnchor: info.textAnchor, dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 12, fontWeight: 600, fill: theme.nodeText
    });
  }
}

function buildQuadrantChart(layout: LayoutResult, theme: ThemeColors, elements: SceneElement[]) {
  const cx = layout.width / 2;
  const cy = layout.height / 2;
  const boxSize = Math.min(layout.width, layout.height) * 0.7;
  const xOffset = cx - boxSize / 2;
  const yOffset = cy - boxSize / 2;

  elements.push({ type: 'rect', x: xOffset, y: yOffset, width: boxSize, height: boxSize, fill: 'none', stroke: theme.edgeColor, strokeWidth: 2 });
  elements.push({ type: 'line', x1: cx, y1: yOffset, x2: cx, y2: yOffset + boxSize, stroke: theme.edgeColor, strokeWidth: 2, strokeDasharray: "4 4" });
  elements.push({ type: 'line', x1: xOffset, y1: cy, x2: xOffset + boxSize, y2: cy, stroke: theme.edgeColor, strokeWidth: 2, strokeDasharray: "4 4" });

  const axesNode = layout.nodes.find(n => n.shape === "axes");
  if (axesNode && axesNode.metadata) {
    const { xAxis, yAxis } = axesNode.metadata;
    elements.push({ type: 'text', x: xOffset + boxSize / 4, y: yOffset + boxSize + 24, content: xAxis.left, textAnchor: 'middle', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 600, fill: theme.nodeText });
    elements.push({ type: 'text', x: xOffset + boxSize * 0.75, y: yOffset + boxSize + 24, content: xAxis.right, textAnchor: 'middle', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 600, fill: theme.nodeText });
    
    // Using group for transform
    elements.push({
      type: 'group',
      transform: `rotate(-90 ${xOffset - 20} ${yOffset + boxSize * 0.75})`,
      children: [{ type: 'text', x: xOffset - 20, y: yOffset + boxSize * 0.75, content: yAxis.bottom, textAnchor: 'middle', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 600, fill: theme.nodeText }]
    });
    elements.push({
      type: 'group',
      transform: `rotate(-90 ${xOffset - 20} ${yOffset + boxSize * 0.25})`,
      children: [{ type: 'text', x: xOffset - 20, y: yOffset + boxSize * 0.25, content: yAxis.top, textAnchor: 'middle', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 600, fill: theme.nodeText }]
    });
  }

  const points = layout.nodes.filter(n => n.shape === "quadrant_point");
  const labelPositions = points.map(pt => ({
    x: xOffset + (pt.x * boxSize),
    y: yOffset + ((1 - pt.y) * boxSize) + 16,
    label: pt.label
  }));

  for (let iter = 0; iter < 10; iter++) {
    for (let i = 0; i < labelPositions.length; i++) {
      for (let j = i + 1; j < labelPositions.length; j++) {
        const p1 = labelPositions[i];
        const p2 = labelPositions[j];
        if (Math.abs(p1.x - p2.x) < 50 && Math.abs(p1.y - p2.y) < 16) {
          if (p1.y < p2.y) {
            p1.y -= 4; p2.y += 4;
          } else {
            p1.y += 4; p2.y -= 4;
          }
        }
      }
    }
  }

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const px = xOffset + (pt.x * boxSize);
    const py = yOffset + ((1 - pt.y) * boxSize);
    const lx = labelPositions[i].x;
    const ly = labelPositions[i].y;

    elements.push({ type: 'circle', cx: px, cy: py, r: 6, fill: "#ec4899", stroke: theme.background, strokeWidth: 2 });
    if (Math.abs(ly - (py + 16)) > 2) {
      elements.push({ type: 'line', x1: px, y1: py, x2: lx, y2: ly - 8, stroke: theme.edgeColor, strokeDasharray: "2 2", strokeWidth: 1 });
    }
    elements.push({ type: 'text', x: lx, y: ly, content: pt.label, textAnchor: 'middle', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 12, fontWeight: 500, fill: theme.nodeText });
  }
}
