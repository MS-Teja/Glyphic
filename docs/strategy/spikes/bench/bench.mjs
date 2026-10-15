// Usage: node bench.mjs <N> [direction] [outDir]   (N = leaf nodes; N="hero" uses docs example 32)
import { performance } from "node:perf_hooks";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const ROOT = new URL("../../../../", import.meta.url).pathname; // repo root

const CORE = `${ROOT}packages/core/dist`;
const t0 = performance.now();
const core = await import(`${CORE}/index.js`);
const { DiagramInput } = await import(`${ROOT}packages/schema/dist/index.js`);
const tImport = performance.now() - t0;
const { generate } = await import("./gen.mjs");
const require = createRequire(`${ROOT}packages/core/package.json`);
const { Resvg } = require("@resvg/resvg-js");

const arg = process.argv[2] ?? "20";
const direction = process.argv[3] ?? "TB";
const outDir = process.argv[4] ?? new URL("./out/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

let input;
let name;
if (arg === "hero") {
  input = JSON.parse(readFileSync(`${ROOT}docs/examples/32_production_platform_architecture.json`, "utf8"));
  name = "hero32";
} else if (arg.endsWith(".json")) {
  input = JSON.parse(readFileSync(arg, "utf8"));
  name = arg.split("/").pop().replace(".json", "");
} else {
  input = generate(Number(arg), 42, { direction });
  name = `n${arg}_${direction}`;
}
writeFileSync(`${outDir}/${name}.json`, JSON.stringify(input, null, 1));

// Warm-up on a tiny diagram so JIT/elk/resvg init isn't billed to the measured run.
const tw = performance.now();
await core.processDiagram(generate(5, 1));
const tWarmup = performance.now() - tw;

const parsed = DiagramInput.parse(input);

// ---- timings ----
let t = performance.now();
const layout = await core.layoutNodeEdgeDiagram(parsed);
const tLayout = performance.now() - t;

// Post-pass cost, re-run on a deep clone (passes are idempotent-ish; this approximates their cost).
const clone = structuredClone(layout);
t = performance.now();
core.collapseAxisAlignedJogs(clone.edges, clone.nodes);
core.separateOverlappingOrthogonalSegments(clone.edges, clone.nodes);
const tPostPasses = performance.now() - t;

t = performance.now();
const { svg } = await core.processSVG(input);
const tSvgTotal = performance.now() - t;

t = performance.now();
const png2x = core.rasterizeSVG(svg, { dpi: 2 });
const tPng = performance.now() - t;

t = performance.now();
const full = await core.processDiagram(input);
const tFull = performance.now() - t;
const rss = process.memoryUsage().rss;

writeFileSync(`${outDir}/${name}.svg`, svg);
writeFileSync(`${outDir}/${name}.png`, full.png);

// determinism within process
const { svg: svg2 } = await core.processSVG(input);
const sameSvg = svg === svg2;
const pngHash = createHash("sha256").update(full.png).digest("hex").slice(0, 16);
const svgHash = createHash("sha256").update(svg).digest("hex").slice(0, 16);

// ---- screen-fit previews (what a human sees on a 1920px-wide monitor) ----
const fitW = new Resvg(svg, { fitTo: { mode: "width", value: 1920 }, background: "white" }).render().asPng();
writeFileSync(`${outDir}/${name}_fit1920w.png`, fitW);
// 1:1 crop of the top-left-ish content region at natural size (1x), to see real detail.
const W = full.metadata.width;
const H = full.metadata.height;

// ---- geometry metrics on the layout result (layout space) ----
const leafRects = [];
const groupRects = [];
const walk = (ns, depth) => {
  for (const n of ns) {
    if (n.children && n.children.length) {
      groupRects.push({ id: n.id, x: n.x, y: n.y, w: n.width, h: n.height, depth });
      walk(n.children, depth + 1);
    } else leafRects.push({ id: n.id, x: n.x, y: n.y, w: n.width, h: n.height, label: n.label });
  }
};
walk(layout.nodes, 0);
const rectById = new Map([...leafRects, ...groupRects].map((r) => [r.id, r]));

const segs = []; // {e, a, b}
const edgeStats = [];
for (const [ei, e] of layout.edges.entries()) {
  let len = 0;
  let bends = 0;
  let first;
  let last;
  for (const sec of e.sections) {
    const pts = [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint];
    if (!first) first = pts[0];
    last = pts[pts.length - 1];
    bends += (sec.bendPoints || []).length;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      len += Math.hypot(b.x - a.x, b.y - a.y);
      segs.push({ e: ei, a, b, src: e.source, tgt: e.target });
    }
  }
  const s = rectById.get(e.source);
  const tt = rectById.get(e.target);
  const manhattanEnds = first && last ? Math.abs(last.x - first.x) + Math.abs(last.y - first.y) : 0;
  const cx = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
  const manhattanCenters = s && tt ? Math.abs(cx(s).x - cx(tt).x) + Math.abs(cx(s).y - cx(tt).y) : 0;
  edgeStats.push({ id: e.id, src: e.source, tgt: e.target, len, bends, manhattanEnds, manhattanCenters, ratio: len / Math.max(manhattanEnds, 1), label: e.label, labelPosition: e.labelPosition });
}

const EPS = 0.75;
function segIntersect(p, q) {
  // returns true for a proper crossing (not at endpoints) between two segments
  const { a: p1, b: p2 } = p;
  const { a: q1, b: q2 } = q;
  const d = (p2.x - p1.x) * (q2.y - q1.y) - (p2.y - p1.y) * (q2.x - q1.x);
  if (Math.abs(d) < 1e-9) return false; // parallel (overlaps counted separately)
  const t = ((q1.x - p1.x) * (q2.y - q1.y) - (q1.y - p1.y) * (q2.x - q1.x)) / d;
  const u = ((q1.x - p1.x) * (p2.y - p1.y) - (q1.y - p1.y) * (p2.x - p1.x)) / d;
  const lp = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const lq = Math.hypot(q2.x - q1.x, q2.y - q1.y);
  const tm = EPS / Math.max(lp, 1e-9);
  const um = EPS / Math.max(lq, 1e-9);
  return t > tm && t < 1 - tm && u > um && u < 1 - um;
}
function collinearOverlap(p, q) {
  // axis-aligned collinear overlap length (edges drawn on top of each other)
  const ph = Math.abs(p.a.y - p.b.y) < EPS;
  const qh = Math.abs(q.a.y - q.b.y) < EPS;
  const pv = Math.abs(p.a.x - p.b.x) < EPS;
  const qv = Math.abs(q.a.x - q.b.x) < EPS;
  if (ph && qh && Math.abs(p.a.y - q.a.y) < 3) {
    const lo = Math.max(Math.min(p.a.x, p.b.x), Math.min(q.a.x, q.b.x));
    const hi = Math.min(Math.max(p.a.x, p.b.x), Math.max(q.a.x, q.b.x));
    return Math.max(0, hi - lo);
  }
  if (pv && qv && Math.abs(p.a.x - q.a.x) < 3) {
    const lo = Math.max(Math.min(p.a.y, p.b.y), Math.min(q.a.y, q.b.y));
    const hi = Math.min(Math.max(p.a.y, p.b.y), Math.max(q.a.y, q.b.y));
    return Math.max(0, hi - lo);
  }
  return 0;
}
let crossings = 0;
let overlapPx = 0;
let overlapPairs = 0;
for (let i = 0; i < segs.length; i++) {
  for (let j = i + 1; j < segs.length; j++) {
    if (segs[i].e === segs[j].e) continue;
    if (segIntersect(segs[i], segs[j])) crossings++;
    const ov = collinearOverlap(segs[i], segs[j]);
    // ignore overlaps of edges sharing an endpoint node (fan-in/fan-out bundling is intentional-ish)
    const share = segs[i].src === segs[j].src || segs[i].tgt === segs[j].tgt;
    if (ov > 10 && !share) {
      overlapPx += ov;
      overlapPairs++;
    }
  }
}
// edges passing through unrelated leaf-node boxes
function segHitsRect(s, r, m = 3) {
  const x0 = r.x + m;
  const x1 = r.x + r.w - m;
  const y0 = r.y + m;
  const y1 = r.y + r.h - m;
  if (x1 <= x0 || y1 <= y0) return false;
  // Liang-Barsky clip
  let t0 = 0;
  let t1 = 1;
  const dx = s.b.x - s.a.x;
  const dy = s.b.y - s.a.y;
  const p = [-dx, dx, -dy, dy];
  const q = [s.a.x - x0, x1 - s.a.x, s.a.y - y0, y1 - s.a.y];
  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) {
      if (q[k] < 0) return false;
    } else {
      const tt = q[k] / p[k];
      if (p[k] < 0) t0 = Math.max(t0, tt);
      else t1 = Math.min(t1, tt);
      if (t0 > t1) return false;
    }
  }
  return t1 - t0 > 1e-6;
}
let edgesThroughNodes = 0;
const throughEx = [];
for (const [ei, e] of layout.edges.entries()) {
  let hit = false;
  for (const s of segs.filter((x) => x.e === ei)) {
    for (const r of leafRects) {
      if (r.id === e.source || r.id === e.target) continue;
      if (segHitsRect(s, r)) {
        hit = true;
        if (throughEx.length < 5) throughEx.push(`${e.source}->${e.target} through ${r.id}`);
        break;
      }
    }
    if (hit) break;
  }
  if (hit) edgesThroughNodes++;
}
// edge labels: overlap with unrelated leaf nodes and with each other
const labelBoxes = edgeStats
  .filter((e) => e.label && e.labelPosition)
  .map((e) => {
    const sz = core.estimateEdgeLabelSize(e.label);
    return { id: e.id, src: e.src, tgt: e.tgt, x: e.labelPosition.x, y: e.labelPosition.y, w: sz.width, h: sz.height };
  });
const rectsOverlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
let labelNode = 0;
let labelLabel = 0;
for (const lb of labelBoxes) for (const r of leafRects) if (rectsOverlap(lb, r)) labelNode++;
for (let i = 0; i < labelBoxes.length; i++) for (let j = i + 1; j < labelBoxes.length; j++) if (rectsOverlap(labelBoxes[i], labelBoxes[j])) labelLabel++;
// labels crossed by OTHER edges' segments (labels have no background mask in graph diagrams)
let labelsCrossedByOtherEdges = 0;
for (const lb of labelBoxes) {
  const crossed = segs.some((s) => layout.edges[s.e].id !== lb.id && segHitsRect(s, lb, 1));
  if (crossed) labelsCrossedByOtherEdges++;
}

const ratios = edgeStats.map((e) => e.ratio).sort((a, b) => a - b);
const q = (p) => ratios[Math.min(ratios.length - 1, Math.floor(p * ratios.length))];
const totalLen = edgeStats.reduce((s, e) => s + e.len, 0);
const totalMan = edgeStats.reduce((s, e) => s + e.manhattanEnds, 0);
const totalManCenters = edgeStats.reduce((s, e) => s + e.manhattanCenters, 0);
const leafArea = leafRects.reduce((s, r) => s + r.w * r.h, 0);

const fontSizes = [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
const minFont = Math.min(...fontSizes);
const fitWScale = 1920 / W;
const fitScreenScale = Math.min(1920 / W, 1080 / H);
const nLeaves = leafRects.length;

const result = {
  name,
  nodesTotal: parsed.nodes.length,
  leafNodes: nLeaves,
  groups: groupRects.length,
  maxGroupDepth: Math.max(0, ...groupRects.map((g) => g.depth + 1)),
  edges: layout.edges.length,
  labeledEdges: labelBoxes.length,
  inputJsonChars: JSON.stringify(input).length,
  ms: {
    importCold: Math.round(tImport),
    warmupTiny: Math.round(tWarmup),
    layoutELKplusPasses: Math.round(tLayout),
    postPassesOnly: Math.round(tPostPasses),
    svgEndToEnd: Math.round(tSvgTotal),
    pngRasterize2x: Math.round(tPng),
    processDiagramFull: Math.round(tFull),
  },
  rssMB: Math.round(rss / 1e6),
  maxRssMB: Math.round(process.resourceUsage().maxRSS / 1024),
  canvas: { layoutW: Math.round(layout.width), layoutH: Math.round(layout.height), sceneW: Math.round(W), sceneH: Math.round(H), aspect: +(W / H).toFixed(2) },
  pngPx: `${Math.round(W * 2)}x${Math.round(H * 2)}`,
  pngBytes: full.png.length,
  svgBytes: svg.length,
  canvasAreaPerLeafPx: Math.round((W * H) / nLeaves),
  leafAreaFractionOfLayout: +(leafArea / (layout.width * layout.height)).toFixed(3),
  crossings,
  crossingsPerEdge: +(crossings / layout.edges.length).toFixed(2),
  collinearOverlapPairs: overlapPairs,
  collinearOverlapPx: Math.round(overlapPx),
  edgesThroughUnrelatedNodes: edgesThroughNodes,
  throughExamples: throughEx,
  bendsPerEdge: +(edgeStats.reduce((s, e) => s + e.bends, 0) / layout.edges.length).toFixed(2),
  detour: {
    aggregate_len_over_manhattanEnds: +(totalLen / totalMan).toFixed(2),
    aggregate_len_over_manhattanCenters: +(totalLen / totalManCenters).toFixed(2),
    median: +q(0.5).toFixed(2),
    p90: +q(0.9).toFixed(2),
    max: +ratios[ratios.length - 1].toFixed(2),
    edgesOver2x: ratios.filter((x) => x > 2).length,
    edgesOver3x: ratios.filter((x) => x > 3).length,
  },
  longestEdgePx: Math.round(Math.max(...edgeStats.map((e) => e.len))),
  edgesLongerThanHalfLayoutHeight: edgeStats.filter((e) => e.len > layout.height / 2).length,
  edgesLongerThanQuarterLayoutDiag: edgeStats.filter((e) => e.len > Math.hypot(layout.width, layout.height) / 4).length,
  medianEdgePx: Math.round(edgeStats.map((e) => e.len).sort((a, b) => a - b)[Math.floor(edgeStats.length / 2)]),
  meanEdgePx: Math.round(totalLen / edgeStats.length),
  labelBoxOverlapsNode: labelNode,
  labelBoxOverlapsLabel: labelLabel,
  labelsCrossedByOtherEdges,
  fonts: {
    minFontPx: minFont,
    fit1920wide_scale: +fitWScale.toFixed(3),
    fit1920wide_nodeLabelPx: +(14 * fitWScale).toFixed(1),
    fit1920wide_edgeLabelPx: +(12 * fitWScale).toFixed(1),
    fit1920x1080_scale: +fitScreenScale.toFixed(3),
    fit1920x1080_nodeLabelPx: +(14 * fitScreenScale).toFixed(1),
    fit1920x1080_edgeLabelPx: +(12 * fitScreenScale).toFixed(1),
  },
  deterministicInProcess: sameSvg,
  svgSha: svgHash,
  pngSha: pngHash,
};
writeFileSync(`${outDir}/${name}.metrics.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
