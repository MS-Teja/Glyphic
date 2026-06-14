// A tiny, dependency-free, deterministic "hand-drawn" path generator used by the
// `sketch` style. Output is stable for a given input (seeded by geometry), so
// golden snapshots stay reproducible. We deliberately avoid pulling in rough.js
// to keep the SVG output fully under our control (and sanitizable).

export interface Pt {
  x: number;
  y: number;
}

// Mulberry32 PRNG — fast, deterministic, good enough for visual jitter.
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromPoints(points: Pt[]): number {
  let h = 2166136261;
  for (const p of points) {
    h = Math.imul(h ^ Math.round(p.x * 7), 16777619);
    h = Math.imul(h ^ Math.round(p.y * 7), 16777619);
  }
  return h >>> 0;
}

const n2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Build a hand-drawn path through `points`. Each segment becomes a quadratic
 * curve whose control point sits at the segment midpoint nudged perpendicular by
 * a seeded amount, and endpoints get a small jitter. `closed` joins back to the
 * first point.
 */
export function roughPath(points: Pt[], closed: boolean, roughness = 1.6): string {
  if (points.length < 2) return "";
  const rng = makeRng(seedFromPoints(points));
  const jitter = () => (rng() - 0.5) * 2 * roughness;

  const pts = closed ? [...points, points[0]] : points;
  const j = pts.map((p) => ({ x: p.x + jitter(), y: p.y + jitter() }));

  let d = `M ${n2(j[0].x)} ${n2(j[0].y)}`;
  for (let i = 1; i < j.length; i++) {
    const a = j[i - 1];
    const b = j[i];
    const mx = (a.x + b.x) / 2 + jitter();
    const my = (a.y + b.y) / 2 + jitter();
    d += ` Q ${n2(mx)} ${n2(my)} ${n2(b.x)} ${n2(b.y)}`;
  }
  if (closed) d += " Z";
  return d;
}

/** Rounded-rectangle corners as a point list (radius is approximated, not arced). */
export function rectCorners(x: number, y: number, w: number, h: number, inset = 0): Pt[] {
  const i = Math.min(inset, w / 2, h / 2);
  return [
    { x: x + i, y },
    { x: x + w - i, y },
    { x: x + w, y: y + i },
    { x: x + w, y: y + h - i },
    { x: x + w - i, y: y + h },
    { x: x + i, y: y + h },
    { x, y: y + h - i },
    { x, y: y + i },
  ];
}

/** Roughen an existing orthogonal/polyline path point sequence (for edges). */
export function roughPolyline(points: Pt[], roughness = 1.4): string {
  return roughPath(points, false, roughness);
}
