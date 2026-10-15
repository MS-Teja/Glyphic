// Spike: can ELK be made stable under small edits?
// A = Glyphic-like INCLUDE_CHILDREN (baseline), C = hierarchical-locality (bottom-up per group, quotient edges),
// D = C + INTERACTIVE layering/crossmin seeded from previous relative positions.
import { createRequire } from "node:module";
const ROOT = new URL("../../../../", import.meta.url).pathname; // repo root
const require = createRequire(`${ROOT}packages/core/package.json`);
const ELK = require("elkjs/lib/elk.bundled.js");
const elk = new ELK();
const { generate } = await import("../bench/gen.mjs");

const H = 50, sz = (n) => ({ width: 40 + 7.5 * n.label.length, height: H });
const OPTS = { "elk.algorithm": "layered", "elk.direction": "DOWN", "elk.spacing.nodeNode": "40",
  "elk.layered.spacing.nodeNodeBetweenLayers": "60", "elk.edgeRouting": "ORTHOGONAL" };

function tree(d) {
  const parent = new Map(d.nodes.map((n) => [n.id, n.groupId ?? null]));
  const kids = new Map(); for (const n of d.nodes) { const p = n.groupId ?? null; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n); }
  const anc = (id) => { const a = []; let c = id; while (c != null) { a.push(c); c = parent.get(c); } return a; };
  return { parent, kids, anc };
}

// Mode A: one ELK call, INCLUDE_CHILDREN
async function layoutA(d) {
  const { kids } = tree(d);
  const mk = (n) => { const ch = kids.get(n.id); const o = { id: n.id, ...(ch ? {} : sz(n)) };
    if (ch) { o.children = ch.map(mk); o.layoutOptions = { "elk.padding": "[top=40,left=20,bottom=20,right=20]" }; } return o; };
  const g = { id: "root", layoutOptions: { ...OPTS, "elk.hierarchyHandling": "INCLUDE_CHILDREN" },
    children: kids.get(null).map(mk), edges: d.edges.map((e, i) => ({ id: "e" + i, sources: [e.source], targets: [e.target] })) };
  const r = await elk.layout(g); const pos = new Map();
  const walk = (ns, ox, oy) => { for (const n of ns) { const x = ox + n.x, y = oy + n.y; pos.set(n.id, { x, y, w: n.width, h: n.height, rx: n.x, ry: n.y }); if (n.children) walk(n.children, x, y); } };
  walk(r.children, 0, 0); return { pos, W: r.width, H: r.height };
}

// Mode C/D: bottom-up per compound with quotient edges; D seeds INTERACTIVE strategies from prev relative positions
async function layoutLocal(d, prev, interactive) {
  const { kids, anc } = tree(d); const rel = new Map(); const size = new Map();
  async function lay(gid) {
    const ch = kids.get(gid) ?? [];
    for (const c of ch) if (kids.has(c.id)) await lay(c.id);
    const childIds = new Set(ch.map((c) => c.id));
    // quotient edges: map endpoints to the child of gid containing them
    const qe = new Map();
    for (const e of d.edges) {
      const ms = anc(e.source).find((a) => childIds.has(a)), mt = anc(e.target).find((a) => childIds.has(a));
      if (ms && mt && ms !== mt) { const k = ms + ">" + mt; qe.set(k, (qe.get(k) ?? 0) + 1); }
    }
    const nodes = ch.map((c) => { const s = kids.has(c.id) ? size.get(c.id) : sz(c); const o = { id: c.id, ...s };
      if (interactive) { const p = prev?.get(c.id); if (p) { o.x = p.rx; o.y = p.ry; } else {
          // seed new node near the barycenter of its previously-placed neighbours, one layer below
          const nb = [...qe.keys()].filter((k) => k.endsWith(">" + c.id) || k.startsWith(c.id + ">")).map((k) => k.split(">").find((x) => x !== c.id)).map((x) => prev?.get(x)).filter(Boolean);
          if (nb.length) { o.x = nb.reduce((a, b) => a + b.rx, 0) / nb.length + 1; o.y = Math.max(...nb.map((b) => b.ry)) + 110; } } }
      return o; });
    const opts = { ...OPTS, "elk.padding": gid == null ? "[top=0,left=0,bottom=0,right=0]" : "[top=40,left=20,bottom=20,right=20]" };
    if (interactive) Object.assign(opts, { "elk.layered.layering.strategy": "INTERACTIVE", "elk.layered.crossingMinimization.strategy": "INTERACTIVE",
      "elk.layered.cycleBreaking.strategy": "INTERACTIVE" });
    const g = { id: "g_" + gid, layoutOptions: opts, children: nodes,
      edges: [...qe.keys()].map((k, i) => { const [s, t] = k.split(">"); return { id: "q" + i, sources: [s], targets: [t] }; }) };
    const r = await elk.layout(g);
    for (const n of r.children) rel.set(n.id, { rx: n.x, ry: n.y, w: n.width, h: n.height });
    size.set(gid, { width: r.width, height: r.height });
  }
  await lay(null);
  const pos = new Map(); const { parent } = tree(d);
  const abs = (id) => { if (pos.has(id)) return pos.get(id); const r = rel.get(id); const p = parent.get(id); const o = p == null ? { x: 0, y: 0 } : abs(p);
    const v = { ...r, x: o.x + r.rx, y: o.y + r.ry }; pos.set(id, v); return v; };
  for (const id of rel.keys()) abs(id);
  return { pos, W: size.get(null).width, H: size.get(null).height };
}

const leavesOf = (d) => d.nodes.filter((n) => !d.nodes.some((c) => c.groupId === n.id)).map((n) => n.id);
function moved(a, b, ids) { let m20 = 0, mH = 0, sum = 0, n = 0;
  // translation-invariant: remove the median global shift first
  const dx = [], dy = []; for (const id of ids) { const p = a.pos.get(id), q = b.pos.get(id); if (p && q) { dx.push(q.x - p.x); dy.push(q.y - p.y); } }
  const med = (v) => v.sort((x, y) => x - y)[Math.floor(v.length / 2)]; const sx = med(dx), sy = med(dy);
  for (const id of ids) { const p = a.pos.get(id), q = b.pos.get(id); if (!p || !q) continue; const dd = Math.hypot(p.x + sx - q.x, p.y + sy - q.y); n++; sum += dd; if (dd > 20) m20++; if (dd > H) mH++; }
  return { pct20: Math.round(100 * m20 / n), pctH: Math.round(100 * mH / n), mean: Math.round(sum / n) }; }

const EDITS = {
  addNodeAndEdge: (d, L) => { const g = d.nodes.find((n) => n.groupId && L.includes(n.id)); d.nodes.push({ id: "newsvc", label: "New Service", groupId: g.groupId }); d.edges.push({ source: g.id, target: "newsvc" }); },
  removeOneEdge: (d) => { d.edges.splice(Math.floor(d.edges.length / 2), 1); },
  addCrossGroupEdge: (d, L) => { d.edges.push({ source: L[2], target: L[L.length - 3] }); },
  lengthenLabel: (d, L) => { const n = d.nodes.find((x) => x.id === L[5]); n.label += " (with a much longer descriptive name)"; },
};
for (const N of [20, 50, 100, 200]) {
  const base = generate(N, 42, {}); const L = leavesOf(base);
  const a0 = await layoutA(base), c0 = await layoutLocal(base, null, false), d0 = await layoutLocal(base, c0.pos, true);
  console.log(`\nN=${N} leaves=${L.length}  canvas A ${Math.round(a0.W)}x${Math.round(a0.H)} | C ${Math.round(c0.W)}x${Math.round(c0.H)} | D(seeded from C) ${Math.round(d0.W)}x${Math.round(d0.H)}`);
  for (const [name, fn] of Object.entries(EDITS)) {
    const d = structuredClone(base); fn(d, L);
    const a1 = await layoutA(d), c1 = await layoutLocal(d, null, false), d1 = await layoutLocal(d, d0.pos, true);
    const ma = moved(a0, a1, L), mc = moved(c0, c1, L), md = moved(d0, d1, L);
    console.log(`  ${name.padEnd(18)} A moved>20px ${String(ma.pct20).padStart(3)}% >1h ${String(ma.pctH).padStart(3)}% mean ${String(ma.mean).padStart(5)}px | C ${String(mc.pct20).padStart(3)}% ${String(mc.pctH).padStart(3)}% ${String(mc.mean).padStart(5)}px | D ${String(md.pct20).padStart(3)}% ${String(md.pctH).padStart(3)}% ${String(md.mean).padStart(5)}px`);
  }
}
