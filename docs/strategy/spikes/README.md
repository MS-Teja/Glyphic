# Spikes behind the October 2026 plan

These are throwaway measurement scripts. They are not product code and are not linted, built or tested in CI. They exist so the numbers in [`../PLAN.md`](../PLAN.md) and [`../research/03-codebase-audit.md`](../research/03-codebase-audit.md) can be reproduced.

**Prerequisite:** run `pnpm install && pnpm build` at the repo root first. The scripts import `packages/*/dist` and `elkjs` from `packages/core`.

| Script | What it measures | Run |
|---|---|---|
| `bench/gen.mjs` | Synthetic architecture graphs: N leaves, nested groups, about 30% labelled edges. Imported by the others. | — |
| `bench/bench.mjs` | Render time, PNG size, peak memory, crossings, detours, label size at 1920 px, for one graph size | `node docs/strategy/spikes/bench/bench.mjs 50` (or `hero`) |
| `bench/stability.mjs` | How many boxes move when one edge or node is added, using today's global ELK layout | `node docs/strategy/spikes/bench/stability.mjs <graph.json>` |
| `stability/spike2.mjs` | ELK INTERACTIVE / semi-interactive modes: do they keep positions? Mostly no. | `node docs/strategy/spikes/stability/spike2.mjs` |
| `stability/spike3.mjs` | **Freeze + insert-next-to-neighbour + push-down**, compared with a fresh layout, over 20 random edits | `node docs/strategy/spikes/stability/spike3.mjs` |
| `routing/route*.mjs` | Edges routed with libavoid-js around a frozen layout: crossings, time, edges through boxes | `cd docs/strategy/spikes/routing && npm i && node route_nocross.mjs <frozen.json>` (export a frozen layout with `EXPORT=frozen.json node ../stability/spike3.mjs`) |

## Headline results (re-run 2026-10-15)

- **Today's engine routes well but doesn't hold its shape.**
  - 0 edges pass through unrelated boxes at 20–200 nodes, and the median detour ratio is about 1.0.
  - Adding one cross-group edge moves 81–100% of boxes.
- **Holding placement still is cheap (`spike3`).** Over 20 edits, freeze-insert-push moved an average of 0–2% of boxes by more than one node height. The worst single edit moved 7–30%. Pairwise order was 100% preserved. A fresh layout moved 25–57%.
- **Routing around frozen boxes is the expensive part (`route*`, 100 nodes).**
  - libavoid gave 0 edges through boxes, but 206 crossings in 0.45 s, or 113 crossings in 28 s with a crossing penalty.
  - Integrated ELK produced about 64 crossings on a similar graph.
