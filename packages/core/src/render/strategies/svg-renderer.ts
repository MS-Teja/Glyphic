import { SceneGraph, SceneElement } from "../../scene/scene-graph.js";
import { escapeXml, sanitizeSvg } from "../sanitize.js";

function renderElement(el: SceneElement): string {
  switch (el.type) {
    case 'rect': {
      let attrs = `x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"`;
      if (el.rx !== undefined) attrs += ` rx="${el.rx}"`;
      if (el.ry !== undefined) attrs += ` ry="${el.ry}"`;
      if (el.fill) attrs += ` fill="${escapeXml(el.fill)}"`;
      if (el.stroke) attrs += ` stroke="${escapeXml(el.stroke)}"`;
      if (el.strokeWidth) attrs += ` stroke-width="${el.strokeWidth}"`;
      if (el.opacity !== undefined) attrs += ` opacity="${el.opacity}"`;
      return `<rect ${attrs}/>`;
    }
    case 'circle': {
      let attrs = `cx="${el.cx}" cy="${el.cy}" r="${el.r}"`;
      if (el.fill) attrs += ` fill="${escapeXml(el.fill)}"`;
      if (el.stroke) attrs += ` stroke="${escapeXml(el.stroke)}"`;
      if (el.strokeWidth) attrs += ` stroke-width="${el.strokeWidth}"`;
      if (el.opacity !== undefined) attrs += ` opacity="${el.opacity}"`;
      return `<circle ${attrs}/>`;
    }
    case 'ellipse': {
      let attrs = `cx="${el.cx}" cy="${el.cy}" rx="${el.rx}" ry="${el.ry}"`;
      if (el.fill) attrs += ` fill="${escapeXml(el.fill)}"`;
      if (el.stroke) attrs += ` stroke="${escapeXml(el.stroke)}"`;
      if (el.strokeWidth) attrs += ` stroke-width="${el.strokeWidth}"`;
      if (el.opacity !== undefined) attrs += ` opacity="${el.opacity}"`;
      return `<ellipse ${attrs}/>`;
    }
    case 'path': {
      let attrs = `d="${escapeXml(el.d)}"`;
      if (el.fill) attrs += ` fill="${escapeXml(el.fill)}"`;
      if (el.stroke) attrs += ` stroke="${escapeXml(el.stroke)}"`;
      if (el.strokeWidth) attrs += ` stroke-width="${el.strokeWidth}"`;
      if (el.strokeDasharray) attrs += ` stroke-dasharray="${escapeXml(el.strokeDasharray)}"`;
      if (el.markerEnd) attrs += ` marker-end="${escapeXml(el.markerEnd)}"`;
      if (el.opacity !== undefined) attrs += ` opacity="${el.opacity}"`;
      return `<path ${attrs}/>`;
    }
    case 'polygon': {
      let attrs = `points="${escapeXml(el.points)}"`;
      if (el.fill) attrs += ` fill="${escapeXml(el.fill)}"`;
      if (el.stroke) attrs += ` stroke="${escapeXml(el.stroke)}"`;
      if (el.strokeWidth) attrs += ` stroke-width="${el.strokeWidth}"`;
      if (el.opacity !== undefined) attrs += ` opacity="${el.opacity}"`;
      return `<polygon ${attrs}/>`;
    }
    case 'line': {
      let attrs = `x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}"`;
      if (el.stroke) attrs += ` stroke="${escapeXml(el.stroke)}"`;
      if (el.strokeWidth) attrs += ` stroke-width="${el.strokeWidth}"`;
      if (el.strokeDasharray) attrs += ` stroke-dasharray="${escapeXml(el.strokeDasharray)}"`;
      if (el.opacity !== undefined) attrs += ` opacity="${el.opacity}"`;
      return `<line ${attrs}/>`;
    }
    case 'text': {
      let attrs = `x="${el.x}" y="${el.y}"`;
      if (el.textAnchor) attrs += ` text-anchor="${escapeXml(el.textAnchor)}"`;
      if (el.dominantBaseline) attrs += ` dominant-baseline="${escapeXml(el.dominantBaseline)}"`;
      if (el.fontFamily) attrs += ` font-family="${escapeXml(el.fontFamily)}"`;
      if (el.fontSize !== undefined) attrs += ` font-size="${el.fontSize}"`;
      if (el.fontWeight !== undefined) attrs += ` font-weight="${el.fontWeight}"`;
      if (el.fill) attrs += ` fill="${escapeXml(el.fill)}"`;
      if (el.style) attrs += ` style="${escapeXml(el.style)}"`;
      return `<text ${attrs}>${escapeXml(el.content)}</text>`;
    }
    case 'group': {
      const childrenHtml = el.children.map(renderElement).join("\n");
      const transform = el.transform ? ` transform="${escapeXml(el.transform)}"` : '';
      return `<g${transform}>\n${childrenHtml}\n</g>`;
    }
    case 'raw-svg': {
      // Caller-supplied markup (canvas raw-svg / custom icons) — sanitize it.
      const safe = sanitizeSvg(el.svg);
      if (el.x !== undefined && el.y !== undefined) {
        // SVG elements are positioned via a wrapping <g transform>, not x/y attrs.
        return `<g transform="translate(${el.x}, ${el.y})">${safe}</g>`;
      }
      return safe;
    }
    default:
      return '';
  }
}

export function renderSceneGraphToSVG(scene: SceneGraph, extraDefs: string = '', title?: string): string {
  // role="img" + <title> make the diagram accessible to screen readers.
  const ariaLabel = title ? ` aria-label="${escapeXml(title)}"` : '';
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" role="img"${ariaLabel}>\n`;
  if (title) {
    svg += `<title>${escapeXml(title)}</title>\n`;
  }
  if (extraDefs) {
    svg += `<defs>\n${extraDefs}\n</defs>\n`;
  }
  for (const el of scene.elements) {
    svg += renderElement(el) + '\n';
  }
  svg += `</svg>`;
  return svg;
}
