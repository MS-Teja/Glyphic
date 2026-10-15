// Synthetic architecture-diagram generator: N leaf nodes in nested groups,
// layered-ish DAG edges with some cross-group and skip edges, ~30% labeled.
// Deterministic (seeded) so runs are reproducible.

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOUNS = ["Order", "Payment", "User", "Catalog", "Search", "Inventory", "Shipping", "Billing", "Auth", "Notification",
  "Pricing", "Review", "Cart", "Session", "Report", "Ledger", "Fraud", "Media", "Profile", "Audit", "Analytics", "Recommendation",
  "Tenant", "Invoice", "Webhook", "Scheduler", "Export", "Import", "Identity", "Feature Flag"];
const KINDS = [
  { suffix: "Service", shape: "rounded" },
  { suffix: "API", shape: "hexagon" },
  { suffix: "Worker", shape: "rectangle" },
  { suffix: "DB", shape: "database" },
  { suffix: "Cache", shape: "cylinder" },
  { suffix: "Queue", shape: "rectangle" },
];
const EDGE_LABELS = ["gRPC", "REST", "publishes events", "reads", "writes", "SQL", "consumes", "HTTPS", "async job", "cache lookup"];
const DOMAINS = ["Commerce", "Identity", "Fulfilment", "Finance", "Platform", "Data", "Growth", "Content", "Ops", "Risk"];

export function generate(nLeaves, seed = 42, opts = {}) {
  const r = rng(seed + nLeaves);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const nodes = [];
  const edges = [];

  // Group structure: domains (top-level) each with 1-3 sub-clusters. ~7 leaves per sub-cluster.
  const nSub = Math.max(2, Math.round(nLeaves / 7));
  const nDomains = Math.max(1, Math.round(nSub / 2.5));
  const subs = [];
  for (let d = 0; d < nDomains; d++) {
    const did = `dom${d}`;
    nodes.push({ id: did, label: `${DOMAINS[d % DOMAINS.length]} Domain${d >= DOMAINS.length ? ` ${d}` : ""}`, shape: "rectangle" });
  }
  for (let s = 0; s < nSub; s++) {
    const sid = `sub${s}`;
    const parent = `dom${s % nDomains}`;
    nodes.push({ id: sid, label: `${pick(NOUNS)} Cluster ${s}`, shape: "rectangle", groupId: parent });
    subs.push(sid);
  }
  // Tier assignment: 0 = entry, 1 = api, 2 = services, 3 = workers, 4 = data
  const leaves = [];
  for (let i = 0; i < nLeaves; i++) {
    const kind = KINDS[i % KINDS.length];
    const tier = kind.suffix === "API" ? 1 : kind.suffix === "Service" ? 2 : kind.suffix === "Worker" || kind.suffix === "Queue" ? 3 : 4;
    const id = `n${i}`;
    const sub = subs[Math.floor((i / nLeaves) * subs.length)];
    const label = `${NOUNS[(i * 7 + 3) % NOUNS.length]} ${kind.suffix}`;
    nodes.push({ id, label, shape: kind.shape, groupId: sub });
    leaves.push({ id, tier, sub });
  }
  // Entry points outside all groups
  const nEntry = Math.max(1, Math.round(nLeaves / 25));
  for (let e = 0; e < nEntry; e++) {
    nodes.unshift({ id: `entry${e}`, label: e === 0 ? "End Users" : `Partner ${e}`, shape: "person" });
    leaves.push({ id: `entry${e}`, tier: 0, sub: null });
  }

  const byTier = (t) => leaves.filter((l) => l.tier === t);
  const edgeSet = new Set();
  const addEdge = (s, t) => {
    const k = `${s}->${t}`;
    if (s === t || edgeSet.has(k)) return;
    edgeSet.add(k);
    const e = { source: s, target: t };
    if (r() < 0.3) e.label = pick(EDGE_LABELS);
    edges.push(e);
  };
  for (const l of leaves) {
    if (l.tier === 4) continue;
    // 1-2 edges to the next tier, preferring the same sub-cluster (80%)
    const nextTiers = [l.tier + 1, l.tier + 2].filter((t) => t <= 4);
    const fan = 1 + (r() < 0.8 ? 1 : 0) + (r() < 0.25 ? 1 : 0);
    for (let k = 0; k < fan; k++) {
      const t = k === 0 ? nextTiers[0] : pick(nextTiers);
      let cands = byTier(t).filter((c) => c.sub === l.sub);
      if (cands.length === 0 || r() < 0.2) cands = byTier(t);
      if (cands.length) addEdge(l.id, pick(cands).id);
    }
  }
  return {
    type: "architecture",
    title: `Synthetic platform (${nLeaves} services)`,
    direction: opts.direction ?? "TB",
    nodes,
    edges,
  };
}
