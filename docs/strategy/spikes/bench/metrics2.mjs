// Layout-only extra metrics (no PNG): flow reversals, bbox escapes, edge length distribution.
// Usage: node metrics2.mjs file.json [file2.json ...]
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
const ROOT = new URL("../../../../", import.meta.url).pathname; // repo root
const core = await import(`${ROOT}packages/core/dist/index.js`);
const { DiagramInput } = await import(`${ROOT}packages/schema/dist/index.js`);

for (const f of process.argv.slice(2)) {
  const input = JSON.parse(readFileSync(f, "utf8"));
  const parsed = DiagramInput.parse(input);
  await core.layoutNodeEdgeDiagram(parsed); // warm
  const t = performance.now();
  const layout = await core.layoutNodeEdgeDiagram(parsed);
  const ms = performance.now() - t;
  const rects = new Map();
  const leaves = [];
  const walk = (ns) => {
    for (const n of ns) {
      rects.set(n.id, n);
      if (n.children?.length) walk(n.children);
      else leaves.push(n);
    }
  };
  walk(layout.nodes);
  const dir = parsed.direction ?? "TB";
  let backward = 0;
  let bboxEscape = 0;
  let longHalf = 0;
  const lens = [];
  const examples = [];
  for (const e of layout.edges) {
    const s = rects.get(e.source);
    const t2 = rects.get(e.target);
    const sc = { x: s.x + s.width / 2, y: s.y + s.height / 2 };
    const tc = { x: t2.x + t2.width / 2, y: t2.y + t2.height / 2 };
    const isBack = dir === "TB" ? tc.y < s.y : dir === "LR" ? tc.x < s.x : false;
    if (isBack) {
      backward++;
      if (examples.length < 6) examples.push(`${e.source}->${e.target}`);
    }
    const bx0 = Math.min(s.x, t2.x) - 60;
    const by0 = Math.min(s.y, t2.y) - 60;
    const bx1 = Math.max(s.x + s.width, t2.x + t2.width) + 60;
    const by1 = Math.max(s.y + s.height, t2.y + t2.height) + 60;
    let len = 0;
    let escapes = false;
    for (const sec of e.sections) {
      const pts = [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.x < bx0 || p.x > bx1 || p.y < by0 || p.y > by1) escapes = true;
        if (i) len += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
      }
    }
    if (escapes) bboxEscape++;
    if (len > layout.height / 2) longHalf++;
    lens.push(len);
  }
  lens.sort((a, b) => a - b);
  const nodeH = leaves.map((n) => n.height).sort((a, b) => a - b)[Math.floor(leaves.length / 2)];
  console.log(JSON.stringify({
    file: f.split("/").pop(),
    leaves: leaves.length,
    edges: layout.edges.length,
    layoutMsWarm: Math.round(ms),
    layout: `${Math.round(layout.width)}x${Math.round(layout.height)}`,
    backwardEdgesAgainstFlow: backward,
    backwardExamples: examples,
    edgesEscapingEndpointBBox60px: bboxEscape,
    edgesLongerThanHalfLayoutHeight: longHalf,
    edgeLenMedianInNodeHeights: +(lens[Math.floor(lens.length / 2)] / nodeH).toFixed(1),
    edgeLenP90InNodeHeights: +(lens[Math.floor(lens.length * 0.9)] / nodeH).toFixed(1),
    edgeLenMaxInNodeHeights: +(lens[lens.length - 1] / nodeH).toFixed(1),
  }));
}
