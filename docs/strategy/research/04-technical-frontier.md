# Glyphic: technical frontier and durable moat (research as of 2026-10-15)

**Method.** I ran about 45 WebSearch queries before the shared search budget ran out. I could not search further, so a few claims below rest on my own background knowledge. Those are marked **[BK, unverified]**. Star counts come from the GitHub search API today. Package versions and dependencies come from registry.npmjs.org today. WebFetch, arXiv and d2lang.com were unreachable, so paper claims come from abstracts and search snippets.

---

## 0. Five findings that change the picture

1. **The best architecture-specific layout engine is now free.** Terrastruct open-sourced TALA under MPL-2.0 on about 2026-09-07 and bundled it in D2 v0.9.0 (`--layout=tala`). The company is shutting down, and D2 moves to a nonprofit fiscally sponsored by Hack Club. TALA's licenses plus the paid D2 Studio editor had funded D2. That revenue model did not keep the company alive. The nonprofit D2 has also said it will not offer MCP, an API or server rendering.
   - Consequence 1: "a better layout engine" is now competing against a free commons (ELK, Graphviz, TALA, MSAGL, libavoid). Selling layout quality has just failed in the market.
   - Consequence 2: an MPL-2.0 architecture-layout engine is now available to build on.
2. **The typed-IR-plus-renderer thesis has already been won on distribution.**
   - Archify (tt-a1i/archify): **83,980★**, created 2026-04-15. The lead's figure of about 19k is out of date; third-party snapshots read 16k, 20k, 36k and 47k (Sep 28). The agent writes typed JSON, the JSON passes layout checks, and the output is self-contained interactive HTML. Nodes can optionally be pinned to git-verified file and line ranges.
   - Also: gitdiagram 18.2k★, Cocoon-AI generator 7.4k★, excalidraw-mcp 5.5k★, drawio-mcp 5.6k★. Glyphic has 10★.
3. **"Architecture diff on PRs" is already crowded.**
   - pr-lens (coldteadotai/pr-lens): **1,964★ in about 8 weeks**, MIT. It ships as a GitHub App, Action, CLI and agent skill, and keeps a sticky PR comment that is redrawn on every push.
   - Its npm packages (`@coldtea/pr-lens-schema`, Zod; `@coldtea/pr-lens-renderer`, no layout-library dependency) show the same structure as Glyphic: schema, then custom layout, then SVG, plus "baseline patches".
   - I read its source. It uses a lane/rank grid ("seating"). A comment there states its stability rule: seating "reads connections and document order, never a label, so a rename moves nothing."
   - Also present: Groma's `groma.md-action` (before/after interactive C4 map per PR), ArchLens, Logic.inc's action, and GitHub's own gh-aw "Update architecture diagram" bot PRs.
   - So the lead's pivot would enter a race already under way, against a competitor with about 200× the traction.
4. **Benchmarks agree: models get the parts right and the connections wrong.**
   - R2ABench (Apr 2026, 68 projects): output is syntactically valid and readable, and component identification is strong. But edges recover poorly, **invented edges are the main structural failure**, and agent frameworks add instability rather than consistent gains.
   - No public benchmark tests diagrams large enough to matter. Text2Arch (ICLR 2026, 75k samples) averages about 15 nodes and 14 edges. MermaidSeqBench uses 4 to 7 participants.
5. **Vision-based "render, look, fix" fails exactly where large diagrams fail.** TraversalBench (Apr 2026): when VLMs trace lines, accuracy holds until the first crossing and then drops sharply. Self-intersections are the main source of error. A 2026 Computer Graphics Forum replication finds LLMs do **not** benefit from crossing-minimized layouts the way humans do. So "show it to the model and let it critique" is unreliable precisely on dense diagrams. Defects should be **computed geometrically and passed to the model as text**.

---

## 1. State of the art for laying out large diagrams

| Approach | What it does well | Limits for large architecture diagrams | Status, license (checked today) |
|---|---|---|---|
| **ELK Layered** (Sugiyama) | Directed flow, ports, labels, hierarchy with `INCLUDE_CHILDREN`. Constraint hooks: `layerChoiceConstraint`, `positionChoiceConstraint`, `considerModelOrder`, layer constraints. | Cross-group edges need `INCLUDE_CHILDREN` on two or more levels. Choice constraints only take effect via the interactive visitor and need a second layout run (Domrös). Large compound graphs give big whitespace and long detours. Glyphic's 44-node hero image shows this. | elkjs **0.12.0, 2026-07-17**, EPL-2.0/GPL. elkjs 2.8k★. |
| **ELK top-down layout** [BK, unverified] | Lays out a hierarchy level by level and scales children to fit their parents. Built for zoomable views of very large models (Kiel group, 2023–24). | Readable only when zoomed. Fits semantic zoom, not print. | In ELK ≥0.9 [BK] |
| **TALA** | Orthogonal, made for architecture diagrams. Optimizes symmetry, flow and clustering. Containers are first-class, with direction per container. **Locked coordinates**: a human or AI pins positions and TALA routes the edges. | Has randomness, so "adding just one node can significantly change the diagram". Not for DAGs. Slow on large diagrams. | **MPL-2.0 since Sep 2026**, inside D2 (Go). d2 25.6k★. A D2 WASM build exists (`@terrastruct/d2` 0.1.33, 2025-08). |
| **libavoid / Adaptagrams** (Wybrow) | Incremental, obstacle-avoiding orthogonal and polyline connector routing with nudging, for fixed node positions. Used by Inkscape and Dunnart [BK]. | Routing only, no placement. Needs a placement step first. | **WASM is production-viable**: `libavoid-js` 0.5.0-beta.5 (LGPL-2.1, Feb 2026). JointJS ships `@joint/router-avoid` 4.3.3 (MPL-2.0, 2026-09-04). There is also a Rust/WASM port. LGPL needs care if statically bundled. adaptagrams 322★. |
| **HOLA** (Kieffer, Dwyer, Marriott, Wybrow) | Best Paper, InfoVis 2015. Users rated its orthogonal layouts close to hand-made ones. | Built for sparse undirected networks (for example metabolic pathways), not directed system flow. C++ in Adaptagrams (`doHOLA`), no maintained JS/WASM. Slow [BK]. | Research-grade |
| **WebCola** (constraint layout) | Alignment, separation and flow constraints. The best fit for the "LLM supplies intent" idea. | Its own docs say it works well under about 100 nodes. Reaches only a local optimum. Weak on disconnected components. | **webcola 3.4.0, last release 2019.** Stale. |
| **yFiles** (commercial gold standard) | Incremental hierarchical "from sketch" layout, partition grids and swimlanes, edge grouping and bundling, labeling. | Price | **≈€7,100 / $8,500 per developer per year**, about €42.6k / $51k per site per year. Vendor page; mapping of prices to tiers was unclear. |
| **Graphviz dot** | Good for DAGs, clusters, splines. LikeC4 uses it. | Weak orthogonal routing with ports and labels [BK]. No stability. | Mature |
| **MSAGL** | Sugiyama, edge routing and bundling. GraphMaps-style level-of-detail browsing for large graphs [BK]. | Small JS community | `@msagl/core` 1.1.24 (Apr 2026). The old `msagl-js` is deprecated. msagljs 175★. JointJS wraps it as `@joint/layout-msagl`. |
| **Mermaid + ELK** | ELK option for large flowcharts | Still described as experimental, flowchart-focused, falls back to dagre | Mermaid 90.7k★ |
| **Edge bundling** | Cuts clutter. Confluent drawings bundle by shared source or target, so connections stay traceable. | Plain bundling makes connections ambiguous. yFiles warns its bundled router can overlap nodes. Hierarchical bundling gives up tracing single edges. | — |
| **Stable / incremental layout** | Mental-map research (Misue 1995; Bridgeman's sequences of orthogonal and hierarchical drawings; Steiger et al. 2014 stabilization). yFiles has a commercial incremental mode. | **No good open-source stable layout for compound, orthogonal architecture graphs.** ELK has the hooks but no product-level solution. | Gap |
| **Abstraction / semantic zoom** | C4 levels, Ilograph perspectives (about $12–30 per seat per month, aggregator data), Structurizr views (Structurizr now ships an MCP server), LikeC4 5.9k★, Zoomable Multi-Level Trees (an element seen at one zoom level never disappears when zooming in). | Most tools need hand-authored views. Automatic view generation is rare. | Partly filled |

**Conclusion on layout.** No algorithm, commercial or academic, makes a single 150-node or larger canvas readable. Humans can only hold so much on one screen, and a better model or solver does not change that. The field's answer is **views**: abstraction, aggregated edges, semantic zoom and stable positions. A better single-canvas layout is not the answer. Glyphic's own 44-node image confirms this. The lead's diagnosis is correct.

---

## 2. LLM diagram capability as of October 2026

**Evidence:**
- **Text2Arch** (ICLR 2026): the model emits a DOT graph and Graphviz renders it. Fine-tuned 7–8B models match GPT-4o few-shot and beat DiagramAgent. The research convention is already "model does structure, engine does geometry".
- **R2ABench**: see finding 4. Relations and traceability are the gap.
- **DiagramEval** (EMNLP 2025): uses graph alignment metrics and notes that edges are hard to extract from images.
- **MermaidSeqBench**: "significant capability gaps", scored by an LLM judge.
- **SVGenius** (2025, 22 models): **every model degrades as complexity rises**. Reasoning training helps more than scale.
- **VectorGym** (Mar 2026): frontier VLMs fall "well below" what reliable real-world use needs.
- **PaperBanana** (Google/PKU, ICML 2026, 7.2k★): a multi-agent loop with a critic, where an image model renders a raster figure. It beats baselines on methodology figures, but the output is not editable, diffable or verifiable.
- **VFLM** (CVPR 2026): visual feedback helps text layout, but only after RL training against an OCR reward.
- **Feynman** (CMU, Mar 2026): the LLM writes Penrose programs and Penrose's optimizer solves the layout. The LLM-plus-solver pattern again.
- **Raster image models** such as Nano Banana Pro now draw legible technical diagrams. Small or dense text still breaks. Evidence is blogs only.

**Where it breaks.** This is my synthesis. No benchmark splits results by size above about 15 nodes, which is itself a gap.

| Size | Model drawing coordinates directly (SVG, HTML, Excalidraw) | What fails |
|---|---|---|
| ≤ about 12–15 nodes | Good, especially with one render-and-check pass. Archify, Excalidraw MCP and Cocoon adoption show users are satisfied here. | Occasional label overflow and arrow endpoints that miss |
| about 15–40 | Works with iteration, at high token cost and with uneven quality | Overlaps, edges through boxes, inconsistent spacing. Vision checks catch some of it. |
| 40+ with nesting | Fails. Crossing minimization is NP-hard and global, and vision checks fail at crossings (TraversalBench). | Engines also give unreadable single canvases |
| Any size | Structure itself | **Invented or missing edges**. This is a grounding problem, not a drawing problem. |

**Will this last two or more years?** It splits three ways:
- **"Can't draw coordinates": erodes.** Next-generation agents will simply *call* elkjs, TALA or Graphviz from code. Archify and pr-lens already embody this. The engine survives as a commodity tool, not a moat.
- **"A 200-node canvas is unreadable": permanent.** It is a limit of human perception, not of the model.
- **"Edges not grounded in evidence": persists in a different form.** Models get better at reading code. But the more code agents write, the more an independent verifier is needed: you cannot use the generator to certify its own output.

---

## 3. Bets (a)–(g): feasibility and durability

Durability means value as models improve: ↑ grows, → flat, ↓ erodes.

| Bet | Solo feasibility | Main technical risks | Durability | Moat | Notes |
|---|---|---|---|---|---|
| **(a) LLM gives layout intent (tiers, lanes, primary flow, alignment) and a solver makes the geometry** | **High**, about 1–3 months. Map to ELK partitions, layer constraints, model order and priorities, plus libavoid when positions are fixed. Glyphic is partly there already. | ELK choice constraints are partial (second run needed). Explicit x/y currently bypasses ELK; it should become a soft constraint. | → | Low | The research consensus (Text2Arch, Feynman, TALA locked coordinates) and easy to copy. Necessary but not a differentiator. |
| **(b) Stable incremental layout** (small model change gives small visual change) | **Medium**, about 3–5 months for compound orthogonal graphs. Persist a "layout lockfile" of layers, orders, positions and group boxes. Re-layout with constraints, insert new nodes into free space, re-route with libavoid. Measure displacement and order inversions. | Insertions into nested groups that ripple across the canvas. TALA's randomness rules it out here. ELK interactive mode is fragile. | **↑** | **Medium–High** | Models regenerate from scratch. Even with the prior layout as context they cannot *guarantee* continuity on large graphs, because this needs state. yFiles has it, but at €7k per developer and closed. Note that pr-lens already has a simple stability rule for small lane grids. The gap is stability **at whole-system scale**. |
| **(c) Automatic abstraction** (collapse, aggregated edges with counts, focus on changed nodes plus k hops) | **High** for the mechanics, 1–2 months. **Medium** for good grouping. | Choosing meaningful groups and names | Mechanics → ; *choosing* abstractions ↓ (models are good at semantic grouping) | Low–Medium | Let the model propose groupings. The engine enforces consistency: aggregated edges stay correct, no node vanishes when zooming in, counts are honest. |
| **(d) Interactive semantic-zoom viewer** | **Medium**, 2–4 months | Crowded: Ilograph, LikeC4, IcePanel, Structurizr. Agents now generate one-off interactive HTML. | → | Low | Needed as the *surface* for (b) and (c), not as the product. |
| **(e) In-browser / WASM engine** | **High**, 2–6 weeks. elkjs is already JS. Swap `@resvg/resvg-js` for resvg-wasm. libavoid-js and the D2/TALA WASM build exist. | Replace heuristic character-width text metrics with real font metrics (fontkit) or canvas `measureText`. | → | None | Table stakes. Also fixes the "PNG on the Desktop" output. |
| **(f) Size-scaled layout-quality benchmark and leaderboard** | **High**, 1–2 months. Existing metrics: crossings, node-edge and label overlap, bends, edge-length variance, flow consistency, area and aspect, legibility at a fixed viewport (greadability.js, gdMetriX, Sprawlter). Also new ones: **stability under edit** and **edge fidelity against ground truth**. | Metric validity (PREVis shows metric and human ratings can disagree; LLMs and humans read layouts differently). Credibility risk in being both judge and contestant. | → for the asset; ↑ for attention while the "AI draws diagrams" race runs | Brand / authority | **Cheapest growth asset.** It fills a real gap (no benchmark goes above about 15 nodes) and has an obvious audience: Archify, pr-lens, Excalidraw and draw.io MCPs, Mermaid, D2/TALA, labs. Design Arena's SVG board shows such leaderboards get press. Publish data and harness openly. |
| **(g) Deterministic extraction** (compose, k8s/Helm, OpenAPI, Terraform plan JSON, TS/Python/Go imports) **with evidence links** | **Medium.** 1–3 weeks per IaC format for a useful subset; 1–2 months for import graphs (tree-sitter or LSP). Cross-service runtime edges (HTTP, queues) are **hard**: heuristics, LLM output checked against evidence, or OpenTelemetry. | Breadth is grindy. Existing single-source tools: KubeDiagrams 2.7k★, inframap 2.1k★, rover 3.3k★, CodeBoarding 2.6k★ (LSP-based). | **↑** (the **verifier**); extraction alone → | **Medium–High**, compounding | Rule: "the LLM proposes an edge, the verifier accepts it": every node and edge resolves to a file and line, or is flagged as unverified. pr-lens edges are model-asserted from the diff, and Archify's evidence pinning is optional. Neither is a deterministic verifier. |

---

## 4. Which capability is the most durable moat

**Test.** Does it rest on a constraint that model progress cannot remove?
- Temporary model weaknesses are eroding: cannot place coordinates, cannot write valid SVG, cannot route edges. That was Glyphic's original premise.
- Permanent constraints remain:
  1. Human working memory and screen space.
  2. Trust, meaning verification that does not come from the generator.
  3. Time: history, drift and diffs need state across commits.

**Answer.** The moat is a **persistent, versioned, evidence-verified system model** (an "architecture lockfile" in git) with a **stable-layout view and diff engine** on top. That is (g) plus (b), with (c) as the view layer. This asset becomes *more* valuable as models improve:
- Agents produce more code, and larger systems, per week. Human review becomes the bottleneck, and the question shifts to "what changed structurally, and is it real?"
- Only a verified model gives "real": R2ABench's main failure is invented edges.
- Only a stable mental map across versions makes "what changed" readable at scale. Per-PR redraws by an LLM cannot.
- The model also **serves agents directly** as queryable context, for example "what depends on X?" or blast radius. The CGF 2026 result suggests agents need structure more than pictures, so the same asset grows with agent usage.
- Accumulated per-repo history creates switching cost (a system of record).

**What is *not* a moat:**
- The layout engine on its own: ELK and TALA are free, and Terrastruct just showed that selling layout does not sustain a company.
- The 18 diagram types.
- The viewer.
- WASM.
- The FSL license. FSL also deters embedding by skills, which is the main distribution channel (the Archify lesson).

**Pushback on the lead's pivot.** The idea is right but the entry point is weak. A "per-PR architecture diff" Action is already shipped by pr-lens (1.96k★, includes stability), Groma, ArchLens, Logic and GitHub's gh-aw. Glyphic can win where those are structurally weak:
- **Whole-system scale.** pr-lens is a lane grid scoped to the blast radius.
- **Deterministic verification.** Their graphs come from an LLM reading the diff.
- **Multi-repo / org-wide maps** built from IaC and manifests.

So the PR diff should be a *feature* of the verified, stable system model, not the product.

**Suggested technical order, solo:**
1. **Weeks 0–6: benchmark (f).** Stratify by size (10, 25, 50, 100, 200 nodes, synthetic plus extracted real repos), and add stability-under-edit and edge-fidelity tracks. Run Glyphic, raw ELK, Graphviz, TALA, Mermaid-ELK, frontier-LLM direct SVG/HTML, and Archify/pr-lens where they can run. This shows the user where Glyphic actually stands and is the launch asset.
2. **Months 1–3: verifier and extractors (g).** Compose, k8s, Helm, OpenAPI, Terraform JSON, and TS/Python imports, each with file:line evidence and an "unverified" flag on LLM-proposed edges.
3. **Months 2–5: layout lockfile and stable incremental re-layout (b).** ELK constraints plus libavoid re-routing, with the benchmark's stability metrics as the regression gate.
4. **Months 3–6: auto-views (c) in a WASM viewer (d, e).** C4-like levels, aggregated edges, focus on changed nodes plus k hops, semantic zoom.

Keep the ELK post-passes from `packages/core/src/layout/elk-adapter.ts`. Treat TALA as an optional MPL backend for small static views; it is not usable for diffs because of its randomness. Make the engine MIT or Apache so skills embed it. Charge for hosted state: private-repo history, drift alerts, policy checks and org-wide maps. Do not charge for rendering.

---

## Sources

**Layout engines and algorithms**
- [ELK hierarchyHandling](https://eclipse.dev/elk/reference/options/org-eclipse-elk-hierarchyHandling.html); [ELK forum on cross-group edges](https://www.eclipse.org/forums/index.php/t/1094727/); [ELK "Constraining the Model" (Domrös)](https://eclipse.dev/elk/blog/posts/2023/23-01-09-constraining-the-model.html); [ELK considerModelOrder](https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-strategy.html); [ELK Layered overview 2025](https://eclipse.dev/elk/blog/posts/2025/25-08-21-layered.html)
- [TALA is open-source (D2 blog)](https://d2lang.com/blog/tala-is-open-source/); [D2 is non-profit](https://d2lang.com/blog/d2-non-profit/); [GIGAZINE](https://gigazine.net/gsc_news/en/20260909-tala-is-open-source/); [RuntimeWire (secondary)](https://runtimewire.com/article/terrastruct-open-sources-tala-alexander-wang-winds-down-business); [D2 releases](https://github.com/terrastruct/d2/releases); [TALA tour](https://d2lang.com/tour/tala/); [D2.js WASM README](https://cdn.jsdelivr.net/npm/@terrastruct/d2@0.1.33/README.md)
- [libavoid-js](https://cdn.jsdelivr.net/npm/libavoid-js@0.5.0-beta.5/README.md); [JointJS avoid-router](https://docs.jointjs.com/api/avoid-router/loadAvoidRouter); [sprotty-routing-libavoid](https://github.com/aksem/sprotty-routing-libavoid); [libavoid-rust](https://github.com/boxabirds/libavoid-rust)
- [HOLA paper](https://ialab.it.monash.edu/~dwyer/papers/hola2015.pdf); [Adaptagrams dialect / doHOLA](https://www.adaptagrams.org/documentation/namespacedialect.html); [WebCola](https://ialab.it.monash.edu/webcola/)
- [yFiles pricing (vendor)](https://www.yworks.com/products/yfiles-for-html/pricing/); [yFiles layered / incremental](https://www.yworks.com/pages/layered-graph-layout); [yFiles edge bundling](https://docs.yworks.com/yfiles-html/dguide/layout-edge_bundling/)
- [msagljs](https://github.com/microsoft/msagljs); [msagl-js deprecated](https://www.npmjs.com/package/msagl-js); [Mermaid ELK (draw.io)](https://www.drawio.com/blog/mermaid-elk-layout)
- [Confluent bundling (Bach et al.)](https://ialab.it.monash.edu/~dwyer/papers/confluentbundling.pdf); [Mental-map sequences, GD 2004](https://link.springer.com/chapter/10.1007/978-3-540-31843-9_24); [Zoomable Multi-Level Trees](https://arxiv.org/pdf/1906.05996); [Semantic zoom + bundling, 2026](https://arxiv.org/pdf/2604.08823)

**Architecture tools**
- [Ilograph](https://blog.ilograph.com/posts/about-ilograph/); [LikeC4](https://github.com/likec4/likec4); [Structurizr MCP](https://docs.structurizr.com/ai/mcp); [Simon Brown, Structurizr vNext and AI talk](https://gotopia.tech/events/193/%2Fgoto-night-simon-brown)

**LLM diagram capability**
- [Text2Arch](https://arxiv.org/pdf/2604.14941) ([ICLR](https://proceedings.iclr.cc/paper_files/paper/2026/hash/a2e28663712d5a3429a98918c3058f7b-Abstract-Conference.html)); [R2ABench](https://arxiv.org/html/2604.06683v1); [DiagramEval](https://arxiv.org/pdf/2510.25761); [MermaidSeqBench](https://arxiv.org/pdf/2511.14967); [SVGenius](https://arxiv.org/pdf/2506.03139); [VectorGym](https://arxiv.org/html/2603.29852v1); [PaperBanana](https://arxiv.org/pdf/2601.23265); [VFLM](https://arxiv.org/pdf/2603.22187); [Feynman](https://arxiv.org/abs/2603.12597); [TraversalBench](https://arxiv.org/abs/2604.10999); [Graph Drawing for LLMs](https://arxiv.org/pdf/2505.03678); [CGF 2026 replication](https://onlinelibrary.wiley.com/doi/10.1111/cgf.70436); [ChatGPT layered drawing](https://arxiv.org/html/2303.08819); [DiagrammerGPT](https://diagrammergpt.github.io/); [Bluefish](https://arxiv.org/pdf/2307.00146)
- [Design Arena SVG board (aggregator)](https://benchmarklist.com/arenas/design_arena_svg/); [Nano Banana Pro vs 2 (blog)](https://www.analyticsvidhya.com/blog/2026/02/nano-banana-2-vs-nano-banana-pro/); [Excalidraw MCP article](https://dev.classmethod.jp/en/articles/excalidraw-mcp-claude-code/)

**Layout-quality metrics**
- [greadability](https://github.com/rpgove/greadability); [gdMetriX (GD 2024)](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.GD.2024.45); [PREVis](https://arxiv.org/pdf/2407.14908); [Sprawlter](https://www.cs.ubc.ca/labs/imager/tr/2020/sprawlter/sprawlter-preprint.pdf)

**Competitors and extraction tools**
- [Archify](https://github.com/tt-a1i/archify); [Taku on Archify](https://taku.ai/blog/skill-archify); [Botmonster on Archify](https://botmonster.com/coding/archify-architecture-diagram-agent-skill/)
- [pr-lens](https://github.com/coldteadotai/pr-lens); [Groma action v1.0.0](https://github.com/MrLesk/groma.md-action/releases/tag/v1.0.0); [ArchLens](https://github.com/archlens-ai/archlens-action); [Logic diagram action](https://github.com/with-logic/logic-diagram-action); [gh-aw architecture bot PR](https://github.com/github/gh-aw/pull/65824)
- [KubeDiagrams](https://arxiv.org/abs/2505.22879v1)

**Inspected directly:** the pr-lens renderer package source, saved at `/tmp/claude-0/-home-user-Glyphic/b81316dc-70f2-5510-bd50-0c3bd46253e5/scratchpad/dl-prlens/package/src/layout/seating.ts`, and Glyphic's `/home/user/Glyphic/packages/core/src/text-metrics.ts`.