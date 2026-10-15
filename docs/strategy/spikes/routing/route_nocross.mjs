// Route every edge of a frozen layout with libavoid-js (orthogonal), leaf boxes as obstacles.
// Reports: time, edges through unrelated leaf boxes, edge-edge crossings, bends, and incremental re-route time.
import { readFileSync } from "node:fs";
import { AvoidLib } from "libavoid-js";
const file = process.argv[2];
const { nodes, edges } = JSON.parse(readFileSync(file, "utf8"));
await AvoidLib.load(new URL("./node_modules/libavoid-js/dist/libavoid.wasm", import.meta.url).pathname);
const A = AvoidLib.getInstance();
const leaves = nodes.filter((n) => !n.group); const byId = new Map(nodes.map((n) => [n.id, n]));
const t0 = performance.now();
const router = new A.Router(A.RouterFlag.OrthogonalRouting.value);
router.setRoutingParameter(A.RoutingParameter.shapeBufferDistance, 8);
router.setRoutingParameter(A.RoutingParameter.idealNudgingDistance, 6);
router.setRoutingParameter(A.RoutingParameter.segmentPenalty, 10);

router.setRoutingOption(A.RoutingOption.nudgeOrthogonalSegmentsConnectedToShapes, true);
router.setRoutingOption(A.RoutingOption.nudgeSharedPathsWithCommonEndPoint, true);
router.setRoutingOption(A.RoutingOption.performUnifyingNudgingPreprocessingStep, true);
const shapes = new Map();
for (const n of leaves) {
  const s = new A.ShapeRef(router, new A.Rectangle(new A.Point(n.x, n.y), new A.Point(n.x + n.w, n.y + n.h)));
  new A.ShapeConnectionPin(s, 1, 0.5, 0.5, true, 0, 15); // centre pin, any direction
  shapes.set(n.id, s);
}
const conns = [];
for (const e of edges) { const s = shapes.get(e.source), t = shapes.get(e.target); if (!s || !t || s === t) continue;
  const c = new A.ConnRef(router, new A.ConnEnd(s, 1), new A.ConnEnd(t, 1)); c.setRoutingType(A.ConnType.ConnType_Orthogonal); conns.push({ e, c }); }
router.processTransaction();
const t1 = performance.now();
const routes = conns.map(({ e, c }) => { const p = c.displayRoute(); const pts = []; for (let i = 0; i < p.size(); i++) pts.push({ x: p.at(i).x, y: p.at(i).y }); return { e, pts }; });
// metrics
const segs = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
const inside = (p, b) => p.x > b.x + 1 && p.x < b.x + b.w - 1 && p.y > b.y + 1 && p.y < b.y + b.h - 1;
let through = 0, bends = 0, len = 0;
for (const r of routes) { bends += Math.max(0, r.pts.length - 2);
  for (const [a, b] of segs(r.pts)) len += Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const hit = leaves.some((n) => n.id !== r.e.source && n.id !== r.e.target && segs(r.pts).some(([a, b]) => {
    for (let k = 1; k < 20; k++) { const p = { x: a.x + (b.x - a.x) * k / 20, y: a.y + (b.y - a.y) * k / 20 }; if (inside(p, n)) return true; } return false; }));
  if (hit) through++; }
const X = (s1, s2) => { const [a, b] = s1, [c, d] = s2; const h1 = a.y === b.y, h2 = c.y === d.y; if (h1 === h2) return false;
  const [H, V] = h1 ? [s1, s2] : [s2, s1]; const hx0 = Math.min(H[0].x, H[1].x), hx1 = Math.max(H[0].x, H[1].x), vy0 = Math.min(V[0].y, V[1].y), vy1 = Math.max(V[0].y, V[1].y);
  return V[0].x > hx0 + 0.5 && V[0].x < hx1 - 0.5 && H[0].y > vy0 + 0.5 && H[0].y < vy1 - 0.5; };
let crossings = 0; for (let i = 0; i < routes.length; i++) for (let j = i + 1; j < routes.length; j++)
  for (const s1 of segs(routes[i].pts)) for (const s2 of segs(routes[j].pts)) if (X(s1, s2)) crossings++;
// incremental: move one shape a bit and re-route
const t2 = performance.now(); router.moveShape_delta(shapes.get(leaves[10].id), 0, 30); router.processTransaction(); const t3 = performance.now();
console.log(JSON.stringify({ leaves: leaves.length, edges: routes.length, routeMs: Math.round(t1 - t0), edgesThroughUnrelatedBoxes: through, crossings, bendsPerEdge: +(bends / routes.length).toFixed(2), meanLenPx: Math.round(len / routes.length), incrementalRerouteMs: Math.round(t3 - t2) }));
