import { LayoutResult, LayoutNode, LayoutEdge, LayoutEdgeSegment } from "../../layout/types.js";
import { SceneGraph, SceneElement, SceneRect, ScenePath, SceneText, SceneCircle, SceneGroup, ScenePolygon, SceneEllipse } from "../../scene/scene-graph.js";
import { getPerimeterIntersection, BoundingBox } from "../../math/geometry.js";
import { getIconSVG } from "../icon-adapter.js";
import { escapeXml, escapeCssString, sanitizeSvg, isHttpsUrl } from "../sanitize.js";

// Padding around the entire diagram
export const PADDING = 40;

export interface ThemeColors {
  background: string;
  nodeBackground: string;
  nodeBorder: string;
  nodeText: string;
  edgeColor: string;
  edgeLabelColor: string;
  fontFamily?: string;
  customFontUrl?: string;
  customIcons?: Record<string, string>;
}

export const DEFAULT_THEME: ThemeColors = {
  background: "#ffffff",
  nodeBackground: "#f0f4ff",
  nodeBorder: "#3b82f6",
  nodeText: "#1e293b",
  edgeColor: "#64748b",
  edgeLabelColor: "#475569",
};

function darkenHex(hex: string, amount: number = 0.2): string {
  if (!hex.startsWith("#")) return hex;
  if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getContrastYIQ(hex: string): string {
  if (!hex.startsWith("#")) return "#ffffff";
  if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? "#0f172a" : "#ffffff";
}

function getNodeColors(node: LayoutNode, theme: ThemeColors) {
  if (node.metadata?.color) {
    const isHex = String(node.metadata.color).startsWith("#");
    return {
      bg: node.metadata.color,
      border: isHex ? darkenHex(String(node.metadata.color), 0.2) : node.metadata.color,
      text: isHex ? getContrastYIQ(String(node.metadata.color)) : "#ffffff"
    };
  }
  return {
    bg: theme.nodeBackground,
    border: theme.nodeBorder,
    text: theme.nodeText
  };
}

// --- Node shape to SceneGraph element mapping ---

function buildRectangle(node: LayoutNode, theme: ThemeColors): SceneRect {
  const c = getNodeColors(node, theme);
  return {
    type: 'rect',
    x: node.x, y: node.y, width: node.width, height: node.height,
    rx: 6, ry: 6,
    fill: c.bg, stroke: c.border, strokeWidth: 2
  };
}

function buildRounded(node: LayoutNode, theme: ThemeColors): SceneRect {
  const c = getNodeColors(node, theme);
  return {
    type: 'rect',
    x: node.x, y: node.y, width: node.width, height: node.height,
    rx: 20, ry: 20,
    fill: c.bg, stroke: c.border, strokeWidth: 2
  };
}

function buildDiamond(node: LayoutNode, theme: ThemeColors): ScenePolygon {
  const c = getNodeColors(node, theme);
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  return {
    type: 'polygon',
    points: `${cx},${node.y} ${node.x + node.width},${cy} ${cx},${node.y + node.height} ${node.x},${cy}`,
    fill: c.bg, stroke: c.border, strokeWidth: 2
  };
}

function buildCylinder(node: LayoutNode, theme: ThemeColors): SceneGroup {
  const c = getNodeColors(node, theme);
  const rx = node.width / 2;
  const ry = node.height * 0.15;
  const { x, y, width: w, height: h } = node;
  
  const pathD = [
    `M ${x},${y + ry}`,
    `A ${rx},${ry} 0 0,0 ${x + w},${y + ry}`,
    `L ${x + w},${y + h - ry}`,
    `A ${rx},${ry} 0 0,1 ${x},${y + h - ry}`,
    `Z`
  ].join(" ");

  return {
    type: 'group',
    children: [
      { type: 'path', d: pathD, fill: c.bg, stroke: c.border, strokeWidth: 2 },
      { type: 'ellipse', cx: x + rx, cy: y + ry, rx, ry, fill: c.bg, stroke: c.border, strokeWidth: 2 }
    ]
  };
}

function buildHexagon(node: LayoutNode, theme: ThemeColors): ScenePolygon {
  const c = getNodeColors(node, theme);
  const inset = Math.min(node.width * 0.15, 20);
  const { x, y, width: w, height: h } = node;
  const points = [
    `${x + inset},${y}`,
    `${x + w - inset},${y}`,
    `${x + w},${y + h / 2}`,
    `${x + w - inset},${y + h}`,
    `${x + inset},${y + h}`,
    `${x},${y + h / 2}`,
  ].join(" ");
  return {
    type: 'polygon',
    points,
    fill: c.bg, stroke: c.border, strokeWidth: 2
  };
}

function buildPerson(node: LayoutNode, theme: ThemeColors): SceneGroup {
  const c = getNodeColors(node, theme);
  const elements: SceneElement[] = [
    { type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, rx: 6, ry: 6, fill: c.bg, stroke: c.border, strokeWidth: 2 }
  ];

  if (!node.icon) {
    const cx = node.x + node.width / 2;
    const availableHeight = node.height * 0.6;
    const headR = Math.min(node.width, availableHeight) * 0.15;
    const headY = node.y + headR + 8;
    const bodyTop = headY + headR + 6;
    const bodyBottom = node.y + availableHeight - 4;
    const bodyW = node.width * 0.5;
    
    elements.push(
      { type: 'circle', cx, cy: headY, r: headR, fill: c.border, opacity: 0.3 },
      { type: 'line', x1: cx, y1: headY + headR, x2: cx, y2: bodyBottom - 15, stroke: c.border, strokeWidth: 2, opacity: 0.3 },
      { type: 'line', x1: cx - bodyW / 2, y1: bodyTop + 10, x2: cx + bodyW / 2, y2: bodyTop + 10, stroke: c.border, strokeWidth: 2, opacity: 0.3 },
      { type: 'line', x1: cx, y1: bodyBottom - 15, x2: cx - bodyW / 3, y2: bodyBottom, stroke: c.border, strokeWidth: 2, opacity: 0.3 },
      { type: 'line', x1: cx, y1: bodyBottom - 15, x2: cx + bodyW / 3, y2: bodyBottom, stroke: c.border, strokeWidth: 2, opacity: 0.3 }
    );
  }

  return { type: 'group', children: elements };
}

function buildCloud(node: LayoutNode, theme: ThemeColors): SceneRect {
  const c = getNodeColors(node, theme);
  return {
    type: 'rect',
    x: node.x, y: node.y, width: node.width, height: node.height,
    rx: 30, ry: 30,
    fill: c.bg, stroke: c.border, strokeWidth: 2
  };
}

function buildClassNode(node: LayoutNode, theme: ThemeColors): SceneGroup {
  const c = getNodeColors(node, theme);
  const titleHeight = node.icon ? 44 : 30;
  const children: SceneElement[] = [];

  children.push({
    type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height,
    rx: 4, ry: 4, fill: c.bg, stroke: c.border, strokeWidth: 2
  });

  const hasAttributes = Array.isArray(node.metadata?.attributes) && node.metadata!.attributes!.length > 0;
  const hasMethods = Array.isArray(node.metadata?.methods) && node.metadata!.methods!.length > 0;
  const hasColumns = Array.isArray(node.metadata?.columns) && node.metadata!.columns!.length > 0;

  if (hasAttributes || hasMethods || hasColumns) {
    children.push({
      type: 'line', x1: node.x, y1: node.y + titleHeight, x2: node.x + node.width, y2: node.y + titleHeight,
      stroke: c.border, strokeWidth: 2
    });
  }

  if (node.metadata && node.metadata.attributes && node.metadata.methods) {
    const attrRows = Array.isArray(node.metadata.attributes) ? node.metadata.attributes.length : 1;
    const attrHeight = attrRows * 24 + 8; 
    const sepY = node.y + titleHeight + attrHeight;
    if (sepY < node.y + node.height) {
      children.push({
        type: 'line', x1: node.x, y1: sepY, x2: node.x + node.width, y2: sepY,
        stroke: c.border, strokeWidth: 2
      });
    }
  }

  return { type: 'group', children };
}

function buildStateStart(node: LayoutNode, theme: ThemeColors): SceneRect {
  const c = getNodeColors(node, theme);
  const rx = Math.min(node.width, node.height) / 2;
  return {
    type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height,
    rx, ry: rx, fill: c.bg, stroke: c.border, strokeWidth: 3
  };
}

function buildStateEnd(node: LayoutNode, theme: ThemeColors): SceneGroup {
  const c = getNodeColors(node, theme);
  const rx = Math.min(node.width, node.height) / 2;
  return {
    type: 'group',
    children: [
      {
        type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height,
        rx, ry: rx, fill: c.bg, stroke: c.border, strokeWidth: 2
      },
      {
        type: 'rect', x: node.x + 4, y: node.y + 4, width: node.width - 8, height: node.height - 8,
        rx: Math.max(0, rx - 4), ry: Math.max(0, rx - 4), fill: 'none', stroke: c.border, strokeWidth: 1.5
      }
    ]
  };
}

function buildNodeShape(node: LayoutNode, theme: ThemeColors): SceneElement {
  switch (node.shape) {
    case "rounded":
    case "service": return buildRounded(node, theme);
    case "diamond": return buildDiamond(node, theme);
    case "cylinder":
    case "database": return buildCylinder(node, theme);
    case "hexagon": return buildHexagon(node, theme);
    case "person":
    case "actor": return buildPerson(node, theme);
    case "cloud": return buildCloud(node, theme);
    case "class":
    case "table": return buildClassNode(node, theme);
    case "state_start": return buildStateStart(node, theme);
    case "state_end": return buildStateEnd(node, theme);
    default: return buildRectangle(node, theme);
  }
}

// --- Node Labels ---

function buildNodeLabel(node: LayoutNode, theme: ThemeColors): SceneGroup | null {
  if (!node.label && !node.icon) return null;
  const elements: SceneElement[] = [];
  const c = getNodeColors(node, theme);
  const cx = node.x + node.width / 2;

  if (node.children && node.children.length > 0) {
    const lines: string[] = [];
    if (node.label) {
      const explicitLines = node.label.split('\n');
      for (const el of explicitLines) lines.push(el);
    }
    
    let textY = node.y + 20;
    lines.forEach((line) => {
      // Calculate text width approximation (Inter font is roughly 8.5px per char for size 14, 600 weight)
      const textWidth = line.length * 8.5;
      elements.push({
        type: 'rect', x: cx - textWidth / 2 - 4, y: textY - 10, width: textWidth + 8, height: 20,
        fill: c.bg, stroke: 'none'
      });
      elements.push({
        type: 'text', x: cx, y: textY, content: line,
        textAnchor: 'middle', dominantBaseline: 'central',
        fontFamily: theme.fontFamily ? `'${theme.fontFamily}', system-ui, sans-serif` : 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700, fill: c.text
      });
      textY += 18; // lineHeight
    });
    return { type: 'group', children: elements };
  }

  let cy = node.y + node.height / 2;
  if ((node.shape === "person" || node.shape === "actor") && !node.icon) cy = node.y + node.height * 0.8;
  if (node.shape === "cylinder" || node.shape === "database") cy = node.y + node.height * 0.6; 

  const words = node.label ? node.label.split(" ") : [];
  if (words.length === 0 && !node.icon) return elements.length > 0 ? { type: 'group', children: elements } : null;

  if (node.shape === "class" || node.shape === "table") {
    const hasAttributes = Array.isArray(node.metadata?.attributes) && node.metadata!.attributes!.length > 0;
    const hasMethods = Array.isArray(node.metadata?.methods) && node.metadata!.methods!.length > 0;
    const hasColumns = Array.isArray(node.metadata?.columns) && node.metadata!.columns!.length > 0;
    const hasContent = hasAttributes || hasMethods || hasColumns;
    const classTitleHeight = node.icon ? 44 : 30;
    
    // If it has content, title is top-aligned in the title bar. If not, it's vertically centered.
    const titleCenterY = hasContent ? node.y + classTitleHeight / 2 : cy;

    if (node.icon) {
      const iconSize = 16;
      const iconSvg = getIconSVG(node.icon, c.text, iconSize, iconSize);
      
      if (hasContent) {
        // Stack icon above text within the 44px title bar
        const iconY = node.y + 4;
        const textY = node.y + iconSize + 10;
        if (iconSvg) elements.push({ type: 'raw-svg', svg: iconSvg, x: cx - (iconSize / 2), y: iconY });
        elements.push({
          type: 'text', x: cx, y: textY, content: node.label,
          textAnchor: 'middle', dominantBaseline: 'central', fontFamily: theme.fontFamily ? `'${theme.fontFamily}', system-ui, sans-serif` : 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700, fill: c.text
        });
      } else {
        // When no content, stack them with a gap like regular shapes
        const gap = 8;
        const totalContentHeight = iconSize + gap + 14;
        const startY = cy - totalContentHeight / 2;
        if (iconSvg) elements.push({ type: 'raw-svg', svg: iconSvg, x: cx - (iconSize / 2), y: startY });
        elements.push({
          type: 'text', x: cx, y: startY + iconSize + gap + 7, content: node.label,
          textAnchor: 'middle', dominantBaseline: 'central', fontFamily: theme.fontFamily ? `'${theme.fontFamily}', system-ui, sans-serif` : 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700, fill: c.text
        });
      }
    } else {
      elements.push({
        type: 'text', x: cx, y: titleCenterY, content: node.label,
        textAnchor: 'middle', dominantBaseline: 'central', fontFamily: theme.fontFamily ? `'${theme.fontFamily}', system-ui, sans-serif` : 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700, fill: c.text
      });
    }
    
    if (hasContent) {
      let currentY = node.y + classTitleHeight + 4;
      const attributes = Array.isArray(node.metadata?.attributes) ? node.metadata!.attributes! : [];
      for (const attr of attributes) {
        elements.push({ type: 'text', x: node.x + 10, y: currentY + 12, content: String(attr), textAnchor: 'start', dominantBaseline: 'central', fontFamily: theme.fontFamily ? `'${theme.fontFamily}', system-ui, sans-serif` : 'Inter, system-ui, sans-serif', fontSize: 12, fill: c.text });
        currentY += 24;
      }
      const sepY = node.y + classTitleHeight + attributes.length * 24 + 8;
      let methodY = sepY + 4;
      const methods = Array.isArray(node.metadata?.methods) ? node.metadata!.methods! : [];
      for (const method of methods) {
        elements.push({ type: 'text', x: node.x + 10, y: methodY + 12, content: String(method), textAnchor: 'start', dominantBaseline: 'central', fontFamily: theme.fontFamily ? `'${theme.fontFamily}', system-ui, sans-serif` : 'Inter, system-ui, sans-serif', fontSize: 12, fill: theme.nodeText });
        methodY += 24;
      }

      // Table columns render as rows beneath the title bar.
      const columns = Array.isArray(node.metadata?.columns) ? node.metadata!.columns! : [];
      let columnY = node.y + classTitleHeight + 4;
      for (const col of columns) {
        elements.push({ type: 'text', x: node.x + 10, y: columnY + 12, content: String(col), textAnchor: 'start', dominantBaseline: 'central', fontFamily: theme.fontFamily ? `'${theme.fontFamily}', system-ui, sans-serif` : 'Inter, system-ui, sans-serif', fontSize: 12, fill: c.text });
        columnY += 24;
      }
    }
    return { type: 'group', children: elements };
  }

  const lines: string[] = [];
  const maxCharsPerLine = Math.floor(node.width / 9);

  if (node.label) {
    const explicitLines = node.label.split('\n');
    for (const el of explicitLines) {
      const words = el.split(" ");
      let currentLine = "";
      for (const word of words) {
        if ((currentLine + " " + word).trim().length > maxCharsPerLine) {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = currentLine ? currentLine + " " + word : word;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
  }

  const lineHeight = 18;
  const iconSize = 24;
  const gap = 8;
  
  // Calculate total content block height to mathematically center it
  let contentHeight = 0;
  if (node.icon) contentHeight += iconSize;
  if (node.icon && lines.length > 0) contentHeight += gap;
  if (lines.length > 0) contentHeight += lines.length * lineHeight;

  const startBlockY = cy - contentHeight / 2;
  let currentY = startBlockY;

  if (node.icon) {
    const iconX = cx - (iconSize / 2);
    const iconSvg = getIconSVG(node.icon, c.text, iconSize, iconSize);
    if (iconSvg) {
      elements.push({ type: 'raw-svg', svg: iconSvg, x: iconX, y: currentY });
    }
    currentY += iconSize + gap;
  }

  if (lines.length > 0) {
    // text elements are drawn with dominantBaseline: 'central', so add half lineHeight
    let textY = currentY + lineHeight / 2;
    lines.forEach((line) => {
      elements.push({
        type: 'text', x: cx, y: textY, content: line,
        textAnchor: 'middle', dominantBaseline: 'central', fontFamily: theme.fontFamily ? `'${theme.fontFamily}', system-ui, sans-serif` : 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 600, fill: c.text
      });
      textY += lineHeight;
    });
  }

  return { type: 'group', children: elements };
}

// --- Edge Routing ---

function buildEdgePath(edge: LayoutEdge, nodes: LayoutNode[]): string {
  if (!edge.sections || edge.sections.length === 0) return "";
  
  const findNode = (id: string, nList: LayoutNode[]): LayoutNode | undefined => {
    for (const n of nList) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNode(id, n.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  
  const sourceNode = findNode(edge.source, nodes);
  const targetNode = findNode(edge.target, nodes);
  
  const parts: string[] = [];
  for (const sec of edge.sections) {
    let startPt = sec.startPoint;
    let endPt = sec.endPoint;
    // Work on copies so we never mutate the shared LayoutResult bend points.
    const bendPoints = (sec.bendPoints || []).map((bp) => ({ ...bp }));

    if (sourceNode) {
      const nextPt = bendPoints.length > 0 ? bendPoints[0] : endPt;
      startPt = getPerimeterIntersection({ ...sourceNode }, startPt, nextPt);
      // Ensure a straight runway for the start arrowhead
      if (bendPoints.length > 0) {
        const bp = bendPoints[0];
        const dx = bp.x - startPt.x;
        const dy = bp.y - startPt.y;
        const MIN_RUNWAY = 18;
        if (Math.abs(dy) < 1 && Math.abs(dx) < MIN_RUNWAY && Math.abs(dx) > 0) {
          const shift = (MIN_RUNWAY - Math.abs(dx)) * Math.sign(bp.x - startPt.x);
          bp.x += shift;
          if (bendPoints.length > 1) bendPoints[1].x += shift;
        } else if (Math.abs(dx) < 1 && Math.abs(dy) < MIN_RUNWAY && Math.abs(dy) > 0) {
          const shift = (MIN_RUNWAY - Math.abs(dy)) * Math.sign(bp.y - startPt.y);
          bp.y += shift;
          if (bendPoints.length > 1) bendPoints[1].y += shift;
        }
      }
    }
    if (targetNode) {
      const prevPt = bendPoints.length > 0 ? bendPoints[bendPoints.length - 1] : startPt;
      endPt = getPerimeterIntersection({ ...targetNode }, endPt, prevPt);

      // Ensure a straight runway for the target arrowhead
      if (bendPoints.length > 0) {
        const lastIdx = bendPoints.length - 1;
        const bp = bendPoints[lastIdx];
        const dx = endPt.x - bp.x;
        const dy = endPt.y - bp.y;
        const MIN_RUNWAY = 18;
        if (Math.abs(dy) < 1 && Math.abs(dx) < MIN_RUNWAY && Math.abs(dx) > 0) {
          const shift = (MIN_RUNWAY - Math.abs(dx)) * Math.sign(bp.x - endPt.x);
          bp.x += shift;
          if (lastIdx > 0) bendPoints[lastIdx - 1].x += shift;
        } else if (Math.abs(dx) < 1 && Math.abs(dy) < MIN_RUNWAY && Math.abs(dy) > 0) {
          const shift = (MIN_RUNWAY - Math.abs(dy)) * Math.sign(bp.y - endPt.y);
          bp.y += shift;
          if (lastIdx > 0) bendPoints[lastIdx - 1].y += shift;
        }
      }
    }

    parts.push(`M ${startPt.x} ${startPt.y}`);
    for (const bp of bendPoints) {
      parts.push(`L ${bp.x} ${bp.y}`);
    }
    parts.push(`L ${endPt.x} ${endPt.y}`);
  }
  return parts.join(" ");
}

export function buildSceneEdge(edge: LayoutEdge, theme: ThemeColors, allNodes: LayoutNode[], maskLabels: boolean = false): { paths: SceneElement[], texts: SceneElement[] } | null {
  const d = buildEdgePath(edge, allNodes);
  if (!d) return null;

  let dash = undefined;
  if (edge.style === 'dashed') dash = "8,5";
  if (edge.style === 'dotted') dash = "3,3";

  let markerEnd = undefined;
  const styleId = edge.style || "solid";
  const arrowType = edge.arrow || "forward";
  const customColorSuffix = edge.metadata?.color ? `-${edge.metadata.color.replace('#', '')}` : "";
  
  if (arrowType === "forward" || arrowType === "both") {
    markerEnd = `url(#arrow-${styleId}${customColorSuffix})`;
  } else if (arrowType === "open") {
    markerEnd = `url(#arrow-open-${styleId}${customColorSuffix})`;
  } else if (arrowType && arrowType !== "none" && arrowType !== "back") {
    markerEnd = `url(#arrow-${arrowType}-${styleId}${customColorSuffix})`;
  }

  const paths: SceneElement[] = [];
  const texts: SceneElement[] = [];
  
  const edgeColor = edge.metadata?.color || theme.edgeColor;
  
  if (dash && markerEnd) {
    // Draw the dashed line without the marker
    paths.push({
      type: 'path', d, fill: 'none', stroke: edgeColor, strokeWidth: 2,
      strokeDasharray: dash
    });
    // Draw an invisible line with the marker to prevent renderer bugs dropping it
    paths.push({
      type: 'path', d, fill: 'none', stroke: 'transparent', strokeWidth: 2,
      markerEnd
    });
  } else {
    paths.push({
      type: 'path', d, fill: 'none', stroke: edgeColor, strokeWidth: 2,
      strokeDasharray: dash, markerEnd
    });
  }

  if (edge.label && edge.sections && edge.sections.length > 0) {
    const sec = edge.sections[0];
    let midX = 0, midY = 0;
    let isHorizontal = false;
    let segmentLength = 0;
    let textAnchor: 'start' | 'middle' | 'end' = 'middle';

    if (sec.bendPoints && sec.bendPoints.length > 0) {
      if (sec.bendPoints.length === 2 && edge.source === edge.target) {
        if (sec.bendPoints[0].x < sec.startPoint.x) {
          midX = Math.max(sec.bendPoints[0].x, sec.bendPoints[1].x) - 8;
          textAnchor = "end";
        } else if (sec.bendPoints[0].x > sec.startPoint.x) {
          midX = Math.min(sec.bendPoints[0].x, sec.bendPoints[1].x) + 8;
          textAnchor = "start";
        } else {
          midX = (sec.bendPoints[0].x + sec.bendPoints[1].x) / 2;
          if (sec.bendPoints[0].y < sec.startPoint.y) {
            midY = Math.max(sec.bendPoints[0].y, sec.bendPoints[1].y) - 8;
          } else {
            midY = Math.min(sec.bendPoints[0].y, sec.bendPoints[1].y) + 8;
          }
        }
        if (sec.bendPoints[0].x !== sec.startPoint.x) {
          midY = (sec.bendPoints[0].y + sec.bendPoints[1].y) / 2;
        }
      } else {
        const pts = [sec.startPoint, ...sec.bendPoints, sec.endPoint];
        let maxLen = -1;
        let longestStart = pts[0];
        let longestEnd = pts[1];
        for (let i = 0; i < pts.length - 1; i++) {
          const dx = pts[i].x - pts[i+1].x;
          const dy = pts[i].y - pts[i+1].y;
          const len = dx*dx + dy*dy;
          if (len > maxLen) {
            maxLen = len;
            longestStart = pts[i];
            longestEnd = pts[i+1];
          }
        }

        let ratio = 0.5;
        if (edge.metadata?.labelPosition === "start") ratio = 0.25;
        if (edge.metadata?.labelPosition === "end") ratio = 0.75;

        midX = longestStart.x + (longestEnd.x - longestStart.x) * ratio;
        midY = longestStart.y + (longestEnd.y - longestStart.y) * ratio;
        isHorizontal = Math.abs(longestStart.y - longestEnd.y) < Math.abs(longestStart.x - longestEnd.x);
        segmentLength = Math.sqrt(maxLen);
      }
    } else {
      let ratio = 0.5;
      if (edge.metadata?.labelPosition === "start") ratio = 0.25;
      if (edge.metadata?.labelPosition === "end") ratio = 0.75;
      midX = sec.startPoint.x + (sec.endPoint.x - sec.startPoint.x) * ratio;
      midY = sec.startPoint.y + (sec.endPoint.y - sec.startPoint.y) * ratio;
      isHorizontal = Math.abs(sec.startPoint.y - sec.endPoint.y) < Math.abs(sec.startPoint.x - sec.endPoint.x);
      const dx = sec.endPoint.x - sec.startPoint.x;
      const dy = sec.endPoint.y - sec.startPoint.y;
      segmentLength = Math.sqrt(dx*dx + dy*dy);
    }

    const maxEdgeChars = 14;
    const edgeWords = edge.label.split(" ");
    const edgeLines: string[] = [];
    let curLine = "";
    for (const w of edgeWords) {
      if ((curLine + " " + w).trim().length > maxEdgeChars) {
        if (curLine) edgeLines.push(curLine);
        curLine = w;
      } else {
        curLine = curLine ? curLine + " " + w : w;
      }
    }
    if (curLine) edgeLines.push(curLine);

    const textWidth = Math.max(...edgeLines.map(l => l.length)) * 6.0 + 8; // approx 6px per char + 4px padding on each side
    
    if (isHorizontal) {
      const padding = 30; // 15px padding on either side
      if (segmentLength < textWidth + padding) {
        midY -= 14;
      }
    }

    const edgeLineHeight = 14;
    
    const bgWidth = textWidth;
    const bgHeight = edgeLines.length * edgeLineHeight - 4;
    let bgX = 0, bgY = 0;

    if (edge.labelPosition) {
      bgX = edge.labelPosition.x;
      bgY = edge.labelPosition.y;
      
      // Update midX/midY so text renders correctly inside the box
      midX = bgX + bgWidth / 2;
      midY = bgY + (edgeLines.length * edgeLineHeight) / 2;
      textAnchor = 'middle';
    } else {
      bgX = textAnchor === 'middle' ? midX - bgWidth / 2 :
                  textAnchor === 'start' ? midX :
                  midX - bgWidth;
      bgY = midY - (edgeLines.length * edgeLineHeight) / 2 + 2;
    }

    if (maskLabels) {
      texts.push({
        type: 'rect',
        x: bgX - 2, // slight padding
        y: bgY,
        width: bgWidth + 4,
        height: bgHeight,
        fill: theme.background,
        rx: 2,
        ry: 2
      });
    }

    const startEdgeY = midY - (edgeLines.length * edgeLineHeight) / 2 + edgeLineHeight / 2;

    edgeLines.forEach((line, i) => {
      texts.push({
        type: 'text',
        content: line,
        x: midX,
        y: startEdgeY + i * edgeLineHeight,
        fill: theme.edgeLabelColor,
        fontSize: 12,
        fontWeight: 500,
        textAnchor: textAnchor,
        dominantBaseline: 'central',
        fontFamily: theme.fontFamily ? `'${theme.fontFamily}', system-ui, sans-serif` : 'Inter, system-ui, sans-serif'
      });
    });
  }

  return { paths, texts };
}

// --- Main Builder ---

export function buildSceneGraph(layout: LayoutResult, passedTheme: Partial<ThemeColors> = {}, maskLabels: boolean = false): SceneGraph {
  const theme: ThemeColors = { ...DEFAULT_THEME, ...passedTheme };
  if (!passedTheme.edgeLabelColor) {
    const isDarkBg = getContrastYIQ(theme.background) === "#ffffff";
    theme.edgeLabelColor = isDarkBg ? "#cbd5e1" : DEFAULT_THEME.edgeLabelColor;
  }
  const elements: SceneElement[] = [];
  
  let minX = 0, minY = 0, maxX = layout.width, maxY = layout.height;
  
  const allEdgePaths: SceneElement[] = [];
  const allEdgeLabels: SceneElement[] = [];
  
  const uniqueColors = new Set<string>();
  layout.edges.forEach(e => {
    if (e.metadata?.color) uniqueColors.add(e.metadata.color);
  });
  let defs = getMarkerDefs(theme, Array.from(uniqueColors));

  if (theme.customIcons) {
    for (const [iconName, svgContent] of Object.entries(theme.customIcons)) {
      // iconName goes into an attribute; svgContent is caller-supplied markup.
      defs += `\n<g id="icon-${escapeXml(iconName)}">${sanitizeSvg(String(svgContent))}</g>`;
    }
  }

  if (theme.customFontUrl && isHttpsUrl(theme.customFontUrl)) {
    defs += `\n<style>
      @font-face {
        font-family: '${escapeCssString(theme.fontFamily || 'CustomFont')}';
        src: url('${escapeCssString(theme.customFontUrl)}');
      }
    </style>`;
  } else if (theme.fontFamily) {
    // Percent-encode the family name so it cannot break out of the url().
    const encodedFontName = encodeURIComponent(theme.fontFamily.trim()).replace(/%20/g, '+');
    defs += `\n<style>
      @import url('https://fonts.googleapis.com/css2?family=${encodedFontName}:wght@400;500;600;700&display=swap');
    </style>`;
  }

  for (const edge of layout.edges) {
    const res = buildSceneEdge(edge, theme, layout.nodes, maskLabels);
    if (res) {
      allEdgePaths.push(...res.paths);
      allEdgeLabels.push(...res.texts);
      
      for (const t of res.texts) {
        if (t.type === 'rect') {
          minX = Math.min(minX, t.x);
          minY = Math.min(minY, t.y);
          maxX = Math.max(maxX, t.x + (t.width as number));
          maxY = Math.max(maxY, t.y + (t.height as number));
        }
      }
    }
  }

  const padLeft = Math.max(PADDING, -minX + PADDING);
  const padTop = Math.max(PADDING, -minY + PADDING);
  const padRight = Math.max(PADDING, maxX - layout.width + PADDING);
  const padBottom = Math.max(PADDING, maxY - layout.height + PADDING);

  // Background
  const width = layout.width + padLeft + padRight;
  const height = layout.height + padTop + padBottom;
  elements.push({ type: 'rect', x: 0, y: 0, width, height, fill: theme.background });

  const rootGroup: SceneGroup = {
    type: 'group',
    transform: `translate(${padLeft}, ${padTop})`,
    children: []
  };

  const allNodeLabels: SceneElement[] = [];

  // Groups first
  const addGroups = (nodes: LayoutNode[]) => {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        rootGroup.children.push(buildNodeShape(node, theme));
        const label = buildNodeLabel(node, theme);
        if (label) allNodeLabels.push(label);
        addGroups(node.children);
      }
    }
  };

  // Leaf nodes later
  const addLeafNodes = (nodes: LayoutNode[]) => {
    for (const node of nodes) {
      if (!node.children || node.children.length === 0) {
        rootGroup.children.push(buildNodeShape(node, theme));
        const label = buildNodeLabel(node, theme);
        if (label) allNodeLabels.push(label);
      } else {
        addLeafNodes(node.children);
      }
    }
  };

  addGroups(layout.nodes);
  rootGroup.children.push(...allEdgePaths);
  addLeafNodes(layout.nodes);
  
  // Push all labels at the very end
  rootGroup.children.push(...allNodeLabels);
  rootGroup.children.push(...allEdgeLabels);

  elements.push(rootGroup);

  return { width, height, elements, defs };
}

export function getMarkerDefs(theme: ThemeColors = DEFAULT_THEME, customColors: string[] = []): string {
  let defs = "";

  const styles = ["solid", "dashed", "dotted"];
  const colors = [theme.edgeColor, ...customColors];

  for (const color of colors) {
    const colorId = color === theme.edgeColor ? "" : `-${color.replace('#', '')}`;
    for (const style of styles) {
      defs += `
        <marker id="arrow-${style}${colorId}" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M 0 0 L 12 6 L 0 12 z" fill="${color}" />
        </marker>
        <marker id="arrow-open-${style}${colorId}" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M 0 1 L 11 6 L 0 11" fill="none" stroke="${color}" stroke-width="2" />
        </marker>
        <marker id="arrow-dependency-${style}${colorId}" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M 0 1 L 11 6 L 0 11" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="0" />
        </marker>
        <marker id="arrow-inheritance-${style}${colorId}" viewBox="0 0 14 14" refX="12" refY="7" markerWidth="10" markerHeight="10" orient="auto">
          <path d="M 0 1 L 14 7 L 0 13 z" fill="${theme.background}" stroke="${color}" stroke-width="2" />
        </marker>
        <marker id="arrow-composition-${style}${colorId}" viewBox="0 0 18 14" refX="14" refY="7" markerWidth="12" markerHeight="10" orient="auto">
          <path d="M 0 7 L 8 1 L 16 7 L 8 13 z" fill="${color}" stroke="${color}" stroke-width="2" />
        </marker>
        <marker id="arrow-aggregation-${style}${colorId}" viewBox="0 0 18 14" refX="14" refY="7" markerWidth="12" markerHeight="10" orient="auto">
          <path d="M 0 7 L 8 1 L 16 7 L 8 13 z" fill="${theme.background}" stroke="${color}" stroke-width="2" />
        </marker>
        
        <marker id="arrow-crow-${style}${colorId}" viewBox="0 0 24 20" refX="20" refY="10" markerWidth="14" markerHeight="14" orient="auto">
          <path d="M 0 10 L 22 10 M 12 10 L 22 0 M 12 10 L 22 20" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </marker>
        <marker id="arrow-crow-one-${style}${colorId}" viewBox="0 0 24 20" refX="20" refY="10" markerWidth="14" markerHeight="14" orient="auto">
          <path d="M 0 10 L 22 10 M 12 10 L 22 0 M 12 10 L 22 20 M 12 2 L 12 18" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </marker>
        <marker id="arrow-crow-zero-many-${style}${colorId}" viewBox="0 0 24 20" refX="20" refY="10" markerWidth="14" markerHeight="14" orient="auto">
          <path d="M 0 10 L 4 10 M 12 10 L 22 10 M 12 10 L 22 0 M 12 10 L 22 20 M 4 10 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </marker>
        <marker id="arrow-zero-one-${style}${colorId}" viewBox="0 0 24 20" refX="20" refY="10" markerWidth="14" markerHeight="14" orient="auto">
          <path d="M 0 10 L 8 10 M 16 10 L 22 10 M 8 10 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0 M 18 2 L 18 18" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </marker>
        <marker id="arrow-one-one-${style}${colorId}" viewBox="0 0 24 20" refX="20" refY="10" markerWidth="14" markerHeight="14" orient="auto">
          <path d="M 0 10 L 22 10 M 12 2 L 12 18 M 18 2 L 18 18" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </marker>
      `;
    }
  }
  return defs;
}
