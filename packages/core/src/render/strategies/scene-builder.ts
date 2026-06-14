import { LayoutResult, LayoutNode, LayoutEdge, LayoutEdgeSegment } from "../../layout/types.js";
import { SceneGraph, SceneElement, SceneRect, ScenePath, SceneText, SceneCircle, SceneGroup, ScenePolygon, SceneEllipse } from "../../scene/scene-graph.js";
import { getPerimeterIntersection, BoundingBox } from "../../math/geometry.js";
import { getIconSVG } from "../icon-adapter.js";
import { escapeXml, escapeCssString, sanitizeSvg, isHttpsUrl } from "../sanitize.js";
import { ThemeColors, DEFAULT_THEME, resolveFontFamily } from "../theme.js";
import { StyleTokens, DEFAULT_STYLE } from "../style.js";
import { roughPath, rectCorners } from "../roughen.js";
import { wrapTextToWidth } from "../../text-metrics.js";

// Re-exported so the strategy modules can keep importing them from here.
export type { ThemeColors } from "../theme.js";
export { DEFAULT_THEME } from "../theme.js";

// Padding around the entire diagram
export const PADDING = 40;

// Drop-shadow filter id used by node shapes when style.shadow is on.
export const SHADOW_FILTER_ID = "glyphic-shadow";
const shadowFilterDef = `\n<filter id="${SHADOW_FILTER_ID}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.12"/></filter>`;

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

// Mix a hex color toward white by `amount` (0..1) to produce a soft tint fill.
function tintHex(hex: string, amount: number): string {
  if (!hex.startsWith("#")) return hex;
  if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getNodeColors(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE) {
  const fillMode = style.fillMode;
  if (node.metadata?.color) {
    const color = String(node.metadata.color);
    const isHex = color.startsWith("#");
    if (fillMode === "none") {
      return { bg: "none", border: color, text: isHex ? theme.nodeText : color };
    }
    if (fillMode === "tint" && isHex) {
      const bg = tintHex(color, 0.85);
      return { bg, border: color, text: getContrastYIQ(bg) };
    }
    // solid, or a non-hex named color
    return {
      bg: color,
      border: isHex ? darkenHex(color, 0.2) : color,
      text: isHex ? getContrastYIQ(color) : "#ffffff"
    };
  }
  if (fillMode === "none") {
    return { bg: "none", border: theme.nodeBorder, text: theme.nodeText };
  }
  // tint/solid with no explicit color: theme.nodeBackground is already a soft fill.
  return {
    bg: theme.nodeBackground,
    border: theme.nodeBorder,
    text: theme.nodeText
  };
}

// Shadow filter string for node shapes, when the style enables it.
function shadowFilter(style: StyleTokens): string | undefined {
  return style.shadow ? `url(#${SHADOW_FILTER_ID})` : undefined;
}

// --- Node shape to SceneGraph element mapping ---

// A roughened closed-path version of a shape, used when style.sketch is on.
function sketchShape(points: { x: number; y: number }[], c: { bg: string; border: string }, style: StyleTokens): ScenePath {
  return {
    type: 'path',
    d: roughPath(points, true, 1.8),
    fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth,
  };
}

function buildRectangle(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): SceneRect | ScenePath {
  const c = getNodeColors(node, theme, style);
  if (style.sketch) return sketchShape(rectCorners(node.x, node.y, node.width, node.height, style.rectRadius), c, style);
  return {
    type: 'rect',
    x: node.x, y: node.y, width: node.width, height: node.height,
    rx: style.rectRadius, ry: style.rectRadius,
    fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth,
    filter: shadowFilter(style),
  };
}

function buildRounded(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): SceneRect | ScenePath {
  const c = getNodeColors(node, theme, style);
  if (style.sketch) return sketchShape(rectCorners(node.x, node.y, node.width, node.height, style.roundedRadius), c, style);
  return {
    type: 'rect',
    x: node.x, y: node.y, width: node.width, height: node.height,
    rx: style.roundedRadius, ry: style.roundedRadius,
    fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth,
    filter: shadowFilter(style),
  };
}

function buildDiamond(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): ScenePolygon | ScenePath {
  const c = getNodeColors(node, theme, style);
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const pts = [
    { x: cx, y: node.y },
    { x: node.x + node.width, y: cy },
    { x: cx, y: node.y + node.height },
    { x: node.x, y: cy },
  ];
  if (style.sketch) return sketchShape(pts, c, style);
  return {
    type: 'polygon',
    points: pts.map((p) => `${p.x},${p.y}`).join(" "),
    fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth,
    filter: shadowFilter(style),
  };
}

function buildCylinder(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): SceneGroup {
  const c = getNodeColors(node, theme, style);
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
    filter: shadowFilter(style),
    children: [
      { type: 'path', d: pathD, fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth },
      { type: 'ellipse', cx: x + rx, cy: y + ry, rx, ry, fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth }
    ]
  };
}

function buildHexagon(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): ScenePolygon | ScenePath {
  const c = getNodeColors(node, theme, style);
  const inset = Math.min(node.width * 0.15, 20);
  const { x, y, width: w, height: h } = node;
  const pts = [
    { x: x + inset, y },
    { x: x + w - inset, y },
    { x: x + w, y: y + h / 2 },
    { x: x + w - inset, y: y + h },
    { x: x + inset, y: y + h },
    { x, y: y + h / 2 },
  ];
  if (style.sketch) return sketchShape(pts, c, style);
  return {
    type: 'polygon',
    points: pts.map((p) => `${p.x},${p.y}`).join(" "),
    fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth,
    filter: shadowFilter(style),
  };
}

function buildPerson(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): SceneGroup {
  const c = getNodeColors(node, theme, style);
  const elements: SceneElement[] = [
    { type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, rx: style.rectRadius, ry: style.rectRadius, fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth, filter: shadowFilter(style) }
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

function buildCloud(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): SceneRect {
  const c = getNodeColors(node, theme, style);
  return {
    type: 'rect',
    x: node.x, y: node.y, width: node.width, height: node.height,
    rx: 30, ry: 30,
    fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth,
    filter: shadowFilter(style),
  };
}

function buildClassNode(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): SceneGroup {
  const c = getNodeColors(node, theme, style);
  // Tables/classes need an opaque title/body even in outline (none) mode so the
  // dividing lines and rows read clearly.
  const fill = c.bg === "none" ? theme.background : c.bg;
  const titleHeight = node.icon ? 44 : 30;
  const children: SceneElement[] = [];

  children.push({
    type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height,
    rx: 4, ry: 4, fill, stroke: c.border, strokeWidth: style.strokeWidth,
    filter: shadowFilter(style),
  });

  const hasAttributes = Array.isArray(node.metadata?.attributes) && node.metadata!.attributes!.length > 0;
  const hasMethods = Array.isArray(node.metadata?.methods) && node.metadata!.methods!.length > 0;
  const hasColumns = Array.isArray(node.metadata?.columns) && node.metadata!.columns!.length > 0;

  if (hasAttributes || hasMethods || hasColumns) {
    children.push({
      type: 'line', x1: node.x, y1: node.y + titleHeight, x2: node.x + node.width, y2: node.y + titleHeight,
      stroke: c.border, strokeWidth: style.strokeWidth
    });
  }

  if (node.metadata && node.metadata.attributes && node.metadata.methods) {
    const attrRows = Array.isArray(node.metadata.attributes) ? node.metadata.attributes.length : 1;
    const attrHeight = attrRows * 24 + 8;
    const sepY = node.y + titleHeight + attrHeight;
    if (sepY < node.y + node.height) {
      children.push({
        type: 'line', x1: node.x, y1: sepY, x2: node.x + node.width, y2: sepY,
        stroke: c.border, strokeWidth: style.strokeWidth
      });
    }
  }

  return { type: 'group', children };
}

function buildStateStart(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): SceneRect {
  const c = getNodeColors(node, theme, style);
  const rx = Math.min(node.width, node.height) / 2;
  return {
    type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height,
    rx, ry: rx, fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth + 1
  };
}

function buildStateEnd(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): SceneGroup {
  const c = getNodeColors(node, theme, style);
  const rx = Math.min(node.width, node.height) / 2;
  return {
    type: 'group',
    children: [
      {
        type: 'rect', x: node.x, y: node.y, width: node.width, height: node.height,
        rx, ry: rx, fill: c.bg, stroke: c.border, strokeWidth: style.strokeWidth
      },
      {
        type: 'rect', x: node.x + 4, y: node.y + 4, width: node.width - 8, height: node.height - 8,
        rx: Math.max(0, rx - 4), ry: Math.max(0, rx - 4), fill: 'none', stroke: c.border, strokeWidth: 1.5
      }
    ]
  };
}

function buildNodeShape(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): SceneElement {
  switch (node.shape) {
    case "rounded":
    case "service": return buildRounded(node, theme, style);
    case "diamond": return buildDiamond(node, theme, style);
    case "cylinder":
    case "database": return buildCylinder(node, theme, style);
    case "hexagon": return buildHexagon(node, theme, style);
    case "person":
    case "actor": return buildPerson(node, theme, style);
    case "cloud": return buildCloud(node, theme, style);
    case "class":
    case "table": return buildClassNode(node, theme, style);
    case "state_start": return buildStateStart(node, theme, style);
    case "state_end": return buildStateEnd(node, theme, style);
    default: return buildRectangle(node, theme, style);
  }
}

// --- Node Labels ---

function buildNodeLabel(node: LayoutNode, theme: ThemeColors, style: StyleTokens = DEFAULT_STYLE): SceneGroup | null {
  if (!node.label && !node.icon) return null;
  const elements: SceneElement[] = [];
  const c = getNodeColors(node, theme, style);
  // In outline (none) fill mode, label backing rects should use the canvas
  // background so text stays legible where it overlaps edges/borders.
  const labelBg = c.bg === "none" ? theme.background : c.bg;
  const cx = node.x + node.width / 2;

  if (node.children && node.children.length > 0) {
    const lines: string[] = [];
    if (node.label) {
      const explicitLines = node.label.split('\n');
      for (const el of explicitLines) lines.push(el);
    }

    let textY = node.y + 20;
    lines.forEach((line, lineIdx) => {
      // Calculate text width approximation (roughly 8.5px per char for size 14, 700 weight)
      const textWidth = line.length * 8.5;
      // Render the group's icon (if any) inline to the left of the first title
      // line. Group/boundary nodes previously dropped their icon entirely (an
      // earlier version drew it floating in the group's center, which looked
      // like a stray duplicate of a child node's icon).
      const iconSize = 16;
      const gap = 6;
      const iconSvg = lineIdx === 0 && node.icon ? getIconSVG(node.icon, c.text, iconSize, iconSize) : "";
      const blockWidth = iconSvg ? iconSize + gap + textWidth : textWidth;
      const blockLeft = cx - blockWidth / 2;
      const textCx = iconSvg ? blockLeft + iconSize + gap + textWidth / 2 : cx;

      elements.push({
        type: 'rect', x: blockLeft - 4, y: textY - 10, width: blockWidth + 8, height: 20,
        fill: labelBg, stroke: 'none'
      });
      if (iconSvg) {
        elements.push({ type: 'raw-svg', svg: iconSvg, x: blockLeft, y: textY - iconSize / 2 });
      }
      elements.push({
        type: 'text', x: textCx, y: textY, content: line,
        textAnchor: 'middle', dominantBaseline: 'central',
        fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 700, fill: c.text
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
          textAnchor: 'middle', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 700, fill: c.text
        });
      } else {
        // When no content, stack them with a gap like regular shapes
        const gap = 8;
        const totalContentHeight = iconSize + gap + 14;
        const startY = cy - totalContentHeight / 2;
        if (iconSvg) elements.push({ type: 'raw-svg', svg: iconSvg, x: cx - (iconSize / 2), y: startY });
        elements.push({
          type: 'text', x: cx, y: startY + iconSize + gap + 7, content: node.label,
          textAnchor: 'middle', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 700, fill: c.text
        });
      }
    } else {
      elements.push({
        type: 'text', x: cx, y: titleCenterY, content: node.label,
        textAnchor: 'middle', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: 700, fill: c.text
      });
    }
    
    if (hasContent) {
      let currentY = node.y + classTitleHeight + 4;
      const attributes = Array.isArray(node.metadata?.attributes) ? node.metadata!.attributes! : [];
      for (const attr of attributes) {
        elements.push({ type: 'text', x: node.x + 10, y: currentY + 12, content: String(attr), textAnchor: 'start', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 12, fill: c.text });
        currentY += 24;
      }
      const sepY = node.y + classTitleHeight + attributes.length * 24 + 8;
      let methodY = sepY + 4;
      const methods = Array.isArray(node.metadata?.methods) ? node.metadata!.methods! : [];
      for (const method of methods) {
        elements.push({ type: 'text', x: node.x + 10, y: methodY + 12, content: String(method), textAnchor: 'start', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 12, fill: theme.nodeText });
        methodY += 24;
      }

      // Table columns render as rows beneath the title bar.
      const columns = Array.isArray(node.metadata?.columns) ? node.metadata!.columns! : [];
      let columnY = node.y + classTitleHeight + 4;
      for (const col of columns) {
        elements.push({ type: 'text', x: node.x + 10, y: columnY + 12, content: String(col), textAnchor: 'start', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 12, fill: c.text });
        columnY += 24;
      }
    }
    return { type: 'group', children: elements };
  }

  const lines: string[] = [];
  if (node.label) {
    // Wrap to the node width using proportional glyph metrics (kept in sync
    // with the node sizing in elk-adapter so the text fits its box).
    for (const el of node.label.split('\n')) {
      lines.push(...wrapTextToWidth(el, node.width - 24, 14, 600));
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
        textAnchor: 'middle', dominantBaseline: 'central', fontFamily: resolveFontFamily(theme.fontFamily), fontSize: 14, fontWeight: style.fontWeight, fill: c.text
      });
      textY += lineHeight;
    });
  }

  return { type: 'group', children: elements };
}

// --- Edge Routing ---

// Flattened id->node index, memoized per node array so edge routing is O(1)
// per lookup instead of a recursive O(N) scan per edge (was O(E*N) overall).
const nodeIndexCache = new WeakMap<LayoutNode[], Map<string, LayoutNode>>();
function getNodeIndex(nodes: LayoutNode[]): Map<string, LayoutNode> {
  let idx = nodeIndexCache.get(nodes);
  if (!idx) {
    idx = new Map<string, LayoutNode>();
    const walk = (list: LayoutNode[]) => {
      for (const n of list) {
        idx!.set(n.id, n);
        if (n.children) walk(n.children);
      }
    };
    walk(nodes);
    nodeIndexCache.set(nodes, idx);
  }
  return idx;
}

function buildEdgePath(edge: LayoutEdge, nodes: LayoutNode[], style: StyleTokens = DEFAULT_STYLE): string {
  if (!edge.sections || edge.sections.length === 0) return "";

  const nodeIndex = getNodeIndex(nodes);
  const sourceNode = nodeIndex.get(edge.source);
  const targetNode = nodeIndex.get(edge.target);

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

    if (style.sketch) {
      // Hand-drawn: roughen the whole polyline for this section.
      parts.push(roughPath([startPt, ...bendPoints, endPt], false, 1.2));
    } else {
      parts.push(`M ${startPt.x} ${startPt.y}`);
      for (const bp of bendPoints) {
        parts.push(`L ${bp.x} ${bp.y}`);
      }
      parts.push(`L ${endPt.x} ${endPt.y}`);
    }
  }
  return parts.join(" ");
}

export function buildSceneEdge(edge: LayoutEdge, theme: ThemeColors, allNodes: LayoutNode[], maskLabels: boolean = false, style: StyleTokens = DEFAULT_STYLE): { paths: SceneElement[], texts: SceneElement[] } | null {
  const d = buildEdgePath(edge, allNodes, style);
  if (!d) return null;
  const edgeStroke = style.strokeWidth;

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
      type: 'path', d, fill: 'none', stroke: edgeColor, strokeWidth: edgeStroke,
      strokeDasharray: dash
    });
    // Draw an invisible line with the marker to prevent renderer bugs dropping it
    paths.push({
      type: 'path', d, fill: 'none', stroke: 'transparent', strokeWidth: edgeStroke,
      markerEnd
    });
  } else {
    paths.push({
      type: 'path', d, fill: 'none', stroke: edgeColor, strokeWidth: edgeStroke,
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
        fontFamily: resolveFontFamily(theme.fontFamily)
      });
    });
  }

  return { paths, texts };
}

// --- Main Builder ---

export function buildSceneGraph(layout: LayoutResult, passedTheme: Partial<ThemeColors> = {}, maskLabels: boolean = false, style: StyleTokens = DEFAULT_STYLE): SceneGraph {
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

  if (style.shadow) defs += shadowFilterDef;

  if (theme.customIcons) {
    for (const [iconName, svgContent] of Object.entries(theme.customIcons)) {
      // iconName goes into an attribute; svgContent is caller-supplied markup.
      defs += `\n<g id="icon-${escapeXml(iconName)}">${sanitizeSvg(String(svgContent))}</g>`;
    }
  }

  // CSS is wrapped in CDATA so characters like '&' in the font URL are not
  // parsed as XML entities (SVG is XML; a bare '&' is a malformed entity and
  // makes resvg reject the document). escapeCssString escapes '<'/'>' so the
  // CDATA section itself cannot be broken out of.
  if (theme.customFontUrl && isHttpsUrl(theme.customFontUrl)) {
    defs += `\n<style><![CDATA[
      @font-face {
        font-family: '${escapeCssString(theme.fontFamily || 'CustomFont')}';
        src: url('${escapeCssString(theme.customFontUrl)}');
      }
    ]]></style>`;
  } else if (theme.fontFamily) {
    // Percent-encode the family name so it cannot break out of the url().
    const encodedFontName = encodeURIComponent(theme.fontFamily.trim()).replace(/%20/g, '+');
    defs += `\n<style><![CDATA[
      @import url('https://fonts.googleapis.com/css2?family=${encodedFontName}:wght@400;500;600;700&display=swap');
    ]]></style>`;
  }

  for (const edge of layout.edges) {
    const res = buildSceneEdge(edge, theme, layout.nodes, maskLabels, style);
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
        rootGroup.children.push(buildNodeShape(node, theme, style));
        const label = buildNodeLabel(node, theme, style);
        if (label) allNodeLabels.push(label);
        addGroups(node.children);
      }
    }
  };

  // Leaf nodes later
  const addLeafNodes = (nodes: LayoutNode[]) => {
    for (const node of nodes) {
      if (!node.children || node.children.length === 0) {
        rootGroup.children.push(buildNodeShape(node, theme, style));
        const label = buildNodeLabel(node, theme, style);
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

const markerDefsCache = new Map<string, string>();

export function getMarkerDefs(theme: ThemeColors = DEFAULT_THEME, customColors: string[] = []): string {
  const cacheKey = `${theme.edgeColor}|${theme.background}|${[...customColors].sort().join(",")}`;
  const cached = markerDefsCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const parts: string[] = [];
  const styles = ["solid", "dashed", "dotted"];
  const colors = [theme.edgeColor, ...customColors];

  for (const color of colors) {
    const colorId = color === theme.edgeColor ? "" : `-${color.replace('#', '')}`;
    for (const style of styles) {
      parts.push(`
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
      `);
    }
  }

  const defs = parts.join("");
  if (markerDefsCache.size > 100) markerDefsCache.clear();
  markerDefsCache.set(cacheKey, defs);
  return defs;
}
