// How stable is the layout under small edits? (relevant to "architecture diff" use cases)
import { readFileSync } from "node:fs";
const ROOT = new URL("../../../../", import.meta.url).pathname; // repo root
const core = await import(`${ROOT}packages/core/dist/index.js`);
const { DiagramInput } = await import(`${ROOT}packages/schema/dist/index.js`);
const pos = async (d) => {
  const l = await core.layoutNodeEdgeDiagram(DiagramInput.parse(d));
  const m = new Map();
  const walk = (ns) => { for (const n of ns) { m.set(n.id, { x: n.x + n.width / 2, y: n.y + n.height / 2 }); if (n.children) walk(n.children); } };
  walk(l.nodes);
  return { m, W: l.width, H: l.height };
};
for (const f of process.argv.slice(2)) {
  const base = JSON.parse(readFileSync(f, "utf8"));
  const b = await pos(base);
  const leaves = base.nodes.filter((n) => !base.nodes.some((c) => c.groupId === n.id)).map((n) => n.id);
  const edits = {
    addNodeAndEdge: (d) => { const g = d.nodes.find((n) => n.groupId && leaves.includes(n.id)); d.nodes.push({ id: "newsvc", label: "New Service", shape: "rounded", groupId: g.groupId }); d.edges.push({ source: g.id, target: "newsvc" }); },
    removeOneEdge: (d) => { d.edges.splice(Math.floor(d.edges.length / 2), 1); },
    addOneCrossGroupEdge: (d) => { const a = leaves[2], z = leaves[leaves.length - 3]; d.edges.push({ source: a, target: z }); },
    lengthenOneLabel: (d) => { const n = d.nodes.find((x) => x.id === leaves[5]); n.label = n.label + " (with a much longer descriptive name)"; },
  };
  for (const [name, fn] of Object.entries(edits)) {
    const d = structuredClone(base); fn(d);
    const a = await pos(d);
    let moved = 0, movedFar = 0;
    for (const id of leaves) { const p = b.m.get(id), q = a.m.get(id); if (!p || !q) continue; const dist = Math.hypot(p.x - q.x, p.y - q.y); if (dist > 20) moved++; if (dist > 200) movedFar++; }
    console.log(f.split("/").pop(), name.padEnd(22), `leaves moved >20px: ${moved}/${leaves.length} (${Math.round(100 * moved / leaves.length)}%), >200px: ${movedFar}; canvas ${Math.round(b.W)}x${Math.round(b.H)} -> ${Math.round(a.W)}x${Math.round(a.H)}`);
  }
}
