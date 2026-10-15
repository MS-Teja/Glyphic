// Spike 3: is "freeze + insert + push" stability cheap, and what does it cost in quality?
// F = fresh hierarchical-local layout (bottom-up per group, quotient edges) every time.
// S = stateful: first layout = F; afterwards keep every child's position relative to its parent,
//     place new children next to a neighbour, resolve overlaps by pushing down (y only, keeps order),
//     edges never move boxes. Measures over a 20-edit random script.
import { createRequire } from "node:module";
const ROOT = new URL("../../../../", import.meta.url).pathname; // repo root
const require = createRequire(`${ROOT}packages/core/package.json`);
const ELK = require("elkjs/lib/elk.bundled.js");
const elk = new ELK();
const { generate } = await import("../bench/gen.mjs");

const H = 50, GAP = 40, PADT = 40, PAD = 20;
const sz = (n) => ({ width: 40 + 7.5 * n.label.length, height: H });
const OPTS = { "elk.algorithm": "layered", "elk.direction": "DOWN", "elk.spacing.nodeNode": "40",
  "elk.layered.spacing.nodeNodeBetweenLayers": "60", "elk.edgeRouting": "ORTHOGONAL" };

function tree(d) {
  const parent = new Map(d.nodes.map((n) => [n.id, n.groupId ?? null]));
  const kids = new Map(); for (const n of d.nodes) { const p = n.groupId ?? null; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n); }
  const anc = (id) => { const a = []; let c = id; while (c != null) { a.push(c); c = parent.get(c); } return a; };
  return { parent, kids, anc };
}
function quotient(d, gid, kids, anc) {
  const childIds = new Set((kids.get(gid) ?? []).map((c) => c.id)); const qe = new Set();
  for (const e of d.edges) { const ms = anc(e.source).find((a) => childIds.has(a)), mt = anc(e.target).find((a) => childIds.has(a));
    if (ms && mt && ms !== mt) qe.add(ms + ">" + mt); }
  return [...qe].map((k) => k.split(">"));
}
// state: rel: Map id -> {rx, ry, w, h}; size: Map gid -> {width,height}
async function fresh(d) {
  const { kids, anc } = tree(d); const rel = new Map(), size = new Map();
  async function lay(gid) {
    const ch = kids.get(gid) ?? []; for (const c of ch) if (kids.has(c.id)) await lay(c.id);
    const nodes = ch.map((c) => ({ id: c.id, ...(kids.has(c.id) ? size.get(c.id) : sz(c)) }));
    const pad = gid == null ? "[top=0,left=0,bottom=0,right=0]" : `[top=${PADT},left=${PAD},bottom=${PAD},right=${PAD}]`;
    const r = await elk.layout({ id: "g", layoutOptions: { ...OPTS, "elk.padding": pad }, children: nodes,
      edges: quotient(d, gid, kids, anc).map(([s, t], i) => ({ id: "q" + i, sources: [s], targets: [t] })) });
    for (const n of r.children) rel.set(n.id, { rx: n.x, ry: n.y, w: n.width, h: n.height });
    size.set(gid, { width: r.width, height: r.height });
  }
  await lay(null); return { rel, size };
}
function stateful(d, prev) {
  const { kids, anc } = tree(d); const rel = new Map(), size = new Map();
  function lay(gid) {
    const ch = kids.get(gid) ?? []; for (const c of ch) if (kids.has(c.id)) lay(c.id);
    const qe = quotient(d, gid, kids, anc); const boxes = [];
    const padT = gid == null ? 0 : PADT, padL = gid == null ? 0 : PAD;
    for (const c of ch) {
      const s = kids.has(c.id) ? size.get(c.id) : sz(c); const p = prev.rel.get(c.id);
      boxes.push({ id: c.id, x: p ? p.rx : null, y: p ? p.ry : null, w: s.width, h: s.height, isNew: !p });
    }
    for (const b of boxes.filter((b) => b.isNew)) {
      const nb = qe.filter(([s, t]) => s === b.id || t === b.id).map(([s, t]) => (s === b.id ? t : s))
        .map((id) => boxes.find((x) => x.id === id && !x.isNew)).filter(Boolean);
      const placed = boxes.filter((x) => x.x != null);
      if (nb.length) { const a = nb[0]; b.x = a.x; b.y = a.y + a.h + GAP; }
      else if (placed.length) { b.x = padL; b.y = Math.max(...placed.map((x) => x.y + x.h)) + GAP; }
      else { b.x = padL; b.y = padT; }
      b.isNew = false;
    }
    // overlap removal: push down only, in y order (keeps x and vertical order)
    boxes.sort((a, b) => a.y - b.y || a.x - b.x);
    for (let i = 0; i < boxes.length; i++) for (let j = 0; j < i; j++) {
      const a = boxes[j], b = boxes[i];
      const xo = a.x < b.x + b.w + GAP / 2 && b.x < a.x + a.w + GAP / 2;
      if (xo && b.y < a.y + a.h + GAP / 2 && a.y < b.y + b.h + GAP / 2) b.y = a.y + a.h + GAP / 2;
    }
    let W = 0, Hh = 0; for (const b of boxes) { rel.set(b.id, { rx: b.x, ry: b.y, w: b.w, h: b.h }); W = Math.max(W, b.x + b.w); Hh = Math.max(Hh, b.y + b.h); }
    size.set(gid, { width: W + (gid == null ? 0 : PAD), height: Hh + (gid == null ? 0 : PAD) });
  }
  lay(null); return { rel, size };
}
function absolute(d, st) { const { parent } = tree(d); const pos = new Map();
  const abs = (id) => { if (pos.has(id)) return pos.get(id); const r = st.rel.get(id); const p = parent.get(id); const o = p == null ? { x: 0, y: 0 } : abs(p);
    const v = { x: o.x + r.rx, y: o.y + r.ry, w: r.w, h: r.h }; pos.set(id, v); return v; };
  for (const id of st.rel.keys()) abs(id); return pos; }
const leavesOf = (d) => d.nodes.filter((n) => !d.nodes.some((c) => c.groupId === n.id)).map((n) => n.id);
function cmp(d0, s0, d1, s1) { // displacement + order preservation over common leaves
  const a = absolute(d0, s0), b = absolute(d1, s1); const L = leavesOf(d0).filter((id) => b.has(id));
  const dx = [], dy = []; for (const id of L) { dx.push(b.get(id).x - a.get(id).x); dy.push(b.get(id).y - a.get(id).y); }
  const med = (v) => [...v].sort((x, y) => x - y)[Math.floor(v.length / 2)]; const sx = med(dx), sy = med(dy);
  let mH = 0; for (const id of L) if (Math.hypot(b.get(id).x - a.get(id).x - sx, b.get(id).y - a.get(id).y - sy) > H) mH++;
  // relative-to-parent displacement (what a reader perceives inside a group)
  const { parent } = tree(d0); let rH = 0; for (const id of L) { const p = s0.rel.get(id), q = s1.rel.get(id); if (Math.hypot(p.rx - q.rx, p.ry - q.ry) > H) rH++; }
  // orthogonal order preservation over sampled pairs
  let pairs = 0, kept = 0; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j += 3) {
    const p = a.get(L[i]), q = a.get(L[j]), p2 = b.get(L[i]), q2 = b.get(L[j]);
    const sxo = Math.sign(Math.round((p.x - q.x) / 10)), syo = Math.sign(Math.round((p.y - q.y) / 10));
    const sxn = Math.sign(Math.round((p2.x - q2.x) / 10)), syn = Math.sign(Math.round((p2.y - q2.y) / 10));
    pairs++; if (sxo === sxn && syo === syn) kept++; }
  return { globalMovedPct: Math.round(100 * mH / L.length), inGroupMovedPct: Math.round(100 * rH / L.length), orderKeptPct: Math.round(100 * kept / pairs) };
}
function quality(d, st) { // proxy: mean Manhattan edge length (in node heights), % edges pointing up, canvas area
  const pos = absolute(d, st); let len = 0, up = 0; for (const e of d.edges) { const s = pos.get(e.source), t = pos.get(e.target);
    if (!s || !t) continue; len += Math.abs(s.x + s.w / 2 - t.x - t.w / 2) + Math.abs(s.y + s.h / 2 - t.y - t.h / 2); if (t.y + t.h <= s.y) up++; }
  const sz0 = st.size.get(null); return { len: len / d.edges.length / H, upPct: 100 * up / d.edges.length, area: sz0.width * sz0.height };
}
function rng(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s % 1000000) / 1000000; }; }
function randomEdit(d, r, k) {
  const L = leavesOf(d); const groups = d.nodes.filter((n) => d.nodes.some((c) => c.groupId === n.id) && !d.nodes.some((c) => c.groupId === n.id && d.nodes.some((g) => g.groupId === c.id)));
  const t = r();
  if (t < 0.35) { const g = groups[Math.floor(r() * groups.length)]; const nb = L[Math.floor(r() * L.length)]; const id = "new" + k;
    d.nodes.push({ id, label: "New Thing " + k, groupId: g.id }); d.edges.push({ source: nb, target: id }); return "addNode"; }
  if (t < 0.65) { d.edges.push({ source: L[Math.floor(r() * L.length)], target: L[Math.floor(r() * L.length)] }); return "addEdge"; }
  if (t < 0.85) { d.edges.splice(Math.floor(r() * d.edges.length), 1); return "removeEdge"; }
  const pid = L[Math.floor(r() * L.length)]; const n = d.nodes.find((x) => x.id === pid); n.label += " v2 extended"; return "relabel";
}
for (const N of (process.argv[2] ? [+process.argv[2]] : [50, 100, 200])) {
  const base = generate(N, 42, {}); const r = rng(7);
  let d = structuredClone(base); const f0 = await fresh(d); let sPrev = f0, fPrev = f0, dPrev = structuredClone(d);
  const steps = []; for (let k = 0; k < 20; k++) {
    const d1 = structuredClone(dPrev); const kind = randomEdit(d1, r, k);
    const s1 = stateful(d1, sPrev), f1 = await fresh(d1);
    steps.push({ kind, S: cmp(dPrev, sPrev, d1, s1), F: cmp(dPrev, fPrev, d1, f1) });
    sPrev = s1; fPrev = f1; dPrev = d1;
  }
  const avg = (k, m) => Math.round(steps.reduce((a, s) => a + s[k][m], 0) / steps.length);
  const mx = (k, m) => Math.max(...steps.map((s) => s[k][m]));
  const qS = quality(dPrev, sPrev), qF = quality(dPrev, fPrev);
  if (process.env.EXPORT) { const pos = absolute(dPrev, sPrev); const { kids } = tree(dPrev); globalThis.__exp = { nodes: [...pos].map(([id, b]) => ({ id, ...b, group: kids.has(id) })), edges: dPrev.edges }; }
  console.log(`N=${N}: per-edit over 20 edits | fresh: global moved>1h avg ${avg("F","globalMovedPct")}% max ${mx("F","globalMovedPct")}%, in-group ${avg("F","inGroupMovedPct")}%, order kept ${avg("F","orderKeptPct")}%`);
  console.log(`        stateful: global moved>1h avg ${avg("S","globalMovedPct")}% max ${mx("S","globalMovedPct")}%, in-group ${avg("S","inGroupMovedPct")}% max ${mx("S","inGroupMovedPct")}%, order kept ${avg("S","orderKeptPct")}%`);
  console.log(`        quality after 20 edits: stateful edgeLen ${qS.len.toFixed(1)}h up ${qS.upPct.toFixed(1)}% area ${(qS.area/1e6).toFixed(1)}M | fresh edgeLen ${qF.len.toFixed(1)}h up ${qF.upPct.toFixed(1)}% area ${(qF.area/1e6).toFixed(1)}M  => debt len ${(100*(qS.len/qF.len-1)).toFixed(0)}% area ${(100*(qS.area/qF.area-1)).toFixed(0)}%`);
}
// export: final stateful layout of the last N run, for routing tests
import { writeFileSync } from "node:fs";
if (process.env.EXPORT) writeFileSync(process.env.EXPORT, JSON.stringify(globalThis.__exp));
