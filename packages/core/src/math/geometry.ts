export interface Point { x: number; y: number }

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: string;
}

/**
 * Geometric helper: Finds the intersection between an orthogonal line segment and a shape's perimeter.
 * This prevents arrows from bleeding into non-rectangular shapes (diamonds, hexagons)
 * while respecting orthogonal routing endpoints.
 */
export function getPerimeterIntersection(node: BoundingBox, pt: Point, ext: Point): Point {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  
  const isHorizontal = Math.abs(pt.y - ext.y) < 1;
  const isVertical = Math.abs(pt.x - ext.x) < 1;
  
  // Buffer to pull the arrow tip 2px back from the mathematical line stroke center
  // to compensate for marker overhang (refX=9 vs tip=10 with strokeWidth=2)
  const STROKE_BUFFER = 2.0; 

  // If the point is far outside the node's bounding box, only apply the stroke buffer.
  const farOutside = pt.x < node.x - 5 || pt.x > node.x + node.width + 5 ||
                     pt.y < node.y - 5 || pt.y > node.y + node.height + 5;

  let ix = pt.x;
  let iy = pt.y;

  if (!farOutside) {
    switch (node.shape) {
    case 'diamond': {
      const rx = node.width / 2;
      const ry = node.height / 2;
      if (isHorizontal) {
        const dy = Math.abs(pt.y - cy);
        const absX = Math.max(0, rx * (1 - dy / ry));
        ix = ext.x > cx ? cx + absX : cx - absX;
      } else if (isVertical) {
        const dx = Math.abs(pt.x - cx);
        const absY = Math.max(0, ry * (1 - dx / rx));
        iy = ext.y > cy ? cy + absY : cy - absY;
      }
      break;
    }

    case 'hexagon': {
      const capWidth = node.width * 0.2;
      if (isHorizontal) {
        const dy = Math.abs(pt.y - cy);
        const dxFromEdge = dy * (capWidth / (node.height / 2));
        const absX = node.width / 2 - dxFromEdge;
        ix = ext.x > cx ? cx + absX : cx - absX;
      } else if (isVertical) {
        const dx = Math.abs(pt.x - cx);
        if (dx > node.width / 2 - capWidth) {
          const xFromEdge = node.width / 2 - dx;
          const absY = xFromEdge * ((node.height / 2) / capWidth);
          iy = ext.y > cy ? cy + absY : cy - absY;
        }
      }
      break;
    }

    case 'database':
    case 'cylinder': {
      const ry = 12;
      if (isVertical) {
        if (ext.y < cy) {
          const dx = Math.abs(pt.x - cx);
          const rx = node.width / 2;
          const val = Math.max(0, 1 - (dx / rx) ** 2);
          const absY = ry * Math.sqrt(val);
          iy = node.y + ry - absY;
        } else {
          const dx = Math.abs(pt.x - cx);
          const rx = node.width / 2;
          const val = Math.max(0, 1 - (dx / rx) ** 2);
          const absY = ry * Math.sqrt(val);
          iy = node.y + node.height - ry + absY;
        }
      }
      break;
    }
    default: {
      // Rectangle bounding box is already handled perfectly by ELK
      break;
    }
  }
  } // !farOutside

  if (isHorizontal) {
    ix += Math.sign(ext.x - pt.x) * STROKE_BUFFER;
  } else if (isVertical) {
    iy += Math.sign(ext.y - pt.y) * STROKE_BUFFER;
  } else {
    // Non-orthogonal fallback
    const dx = ext.x - pt.x;
    const dy = ext.y - pt.y;
    if (dx === 0 && dy === 0) return pt;
    const len = Math.sqrt(dx*dx + dy*dy);
    return { 
      x: pt.x + (dx/len)*STROKE_BUFFER, 
      y: pt.y + (dy/len)*STROKE_BUFFER 
    };
  }

  return { x: ix, y: iy };
}
