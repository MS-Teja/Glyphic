I ran the build, tests, benchmarks and claim checks. Every package builds and all 236 tests pass. The main measured finding is that edges avoid boxes at every size (0 edges through unrelated boxes from 20 to 200 nodes). Large diagrams fail because of where boxes and groups get placed, and because of the output format and render cost, not because of edge routing.

# Glyphic codebase audit

## 1. Build and test status
- **Install:** `pnpm install` worked (network reachable, 9.5 s). It rewrites `pnpm-lock.yaml`, because `pnpm-workspace.yaml` lists `internal/benchmark`, which is gitignored. I put the lockfile back. A clean-clone `pnpm install --frozen-lockfile`, which is what CI runs, also works.
- **Build, typecheck, test:** `pnpm turbo run build typecheck test` passes all 9 tasks in 45 s.
  - schema: 33 tests; core: 183; mcp-server: 20.
  - Biome lint is clean.
  - About 2,183 lines of tests.
- **What the tests cover:** snapshot tests check SVG only. The PNG tests only check that a non-empty PNG comes out. Rasterizing the hero example alone takes 14.4 s of the test run.

## 2. Inventory (5,732 lines of non-test TS)

| Module | Lines | What it does | Quality | Verdict | Cost to re-create |
|---|---|---|---|---|---|
| core/layout/elk-adapter.ts | 867 | Turns input into an ELK graph; sizes nodes from labels and icons; nested groups (INCLUDE_CHILDREN, BALANCED); post-passes that straighten small edge jogs and separate overlapping edges; mindmap colours | Best code in the repo. Heuristic, with 13 regression tests and about 10 fix commits behind it. Magic numbers, `any`, and a second label-size heuristic (6 px/char) | **Keep the knowledge and tests, rewrite the code** | 2–4 weeks to rediscover the edge cases; 2 days to port |
| core/render/strategies/scene-builder.ts | 1015 | Shapes, labels, edge paths (border clipping, room for arrowheads), arrow markers, fonts | Dense. Three more text-width heuristics (14-char wrap, 8.5 px/char, 8 px/char). Bugs: `arrow:"back"` draws no arrowhead, `"both"` draws one. Edge labels in graph diagrams have no background | **Rewrite**; keep the markers and clipping | 3–5 days |
| core/render/strategies/flow-svg.ts | 271 | Drawing for gantt, sankey, git, timeline, journey, kanban | Fixed sizes. Gantt axis uses `toLocaleDateString`, so output depends on timezone and locale | **Drop** | hours each |
| core/render/strategies/data-viz-svg.ts | 311 | Pie (with label spreading), quadrant, treemap | Fine, but no advantage over Vega/ECharts | **Drop** | 1 day |
| core/layout/sequence-adapter.ts | 166 | Grid layout for sequence diagrams; label wrapping shared with the renderer | OK. No activation bars, alt/loop frames or notes | Keep only if sequence stays | 1–2 days |
| core/layout/time-adapter.ts (gantt) | 161 | Gantt layout | Fixed 1000 px width; an unparseable date silently becomes epoch 0; unknown dependencies silently dropped | **Drop** | 1 day |
| core/layout/flow-adapter.ts | 130 | Sankey (d3, fixed 1000×600) and git graph | Unknown git parents silently dropped | **Drop** | hours |
| core/layout/data-adapter.ts, treemap-adapter.ts, chrono-adapter.ts | 115+47+94 | Pie, quadrant, treemap, timeline, journey, kanban, passed to the renderer as fake "config" nodes | Trivial | **Drop** | hours |
| core/layout/canvas-adapter.ts, render/strategies/canvas-svg.ts | 91+55 | Explicit x/y coordinates, and the freeform "canvas" type | **Liability.** One x/y anywhere bypasses ELK: every node without coordinates lands at (0,0), and edges are straight lines through boxes | **Drop** | n/a |
| core/layout/state, erd, class, c4 adapters | 186 | Thin mappers onto the ELK path | They ignore `style` spacing and theme `customIcons`. ERD `many-to-one` is drawn the same as `one-to-many` | Keep as presets | hours |
| core/layout/validation.ts | 90 | Unknown-id errors with Levenshtein "did you mean" | Good; models can fix their input from it | **Keep** | hours |
| schema/format-error.ts | 100 | Short, de-duplicated Zod errors for models | Good | **Keep** | hours |
| schema/diagram.ts | 440 | Zod schema: 17 variants, 18 type names | Loose: `metadata: record(any)`, the x/y escape hatch, and icon examples (`aws-lambda`, `react`) that don't resolve | **Rewrite** smaller, versioned, graph-only | 1 day |
| core/text-metrics.ts | 55 | Hand-tuned Inter character-width table | **Liability**: wrong for any other font | Replace with real font metrics from a bundled font | 1–2 days |
| core/math/geometry.ts | 123 | Edge clipping for diamond, hexagon and cylinder borders | Fine | Keep | half a day |
| core/scene/scene-graph.ts, render/strategies/svg-renderer.ts | 122+112 | Scene types, then SVG string | Clean | Keep | hours |
| core/render/sanitize.ts | 63 | Regex SVG sanitizer | **Can be bypassed** (see §5) | Drop raw-SVG input, or use an allowlist parser | — |
| core/render/rasterizer.ts | 57 | resvg wrapper with a temp-file font hack | Loads system fonts on every render, so PNGs differ between machines | Keep, with bundled fonts only | hours |
| core/render/icon-adapter.ts | 47 | FontAwesome lookup | Pulls in 25 MB of dependency | Rewrite as a small icon subset | hours |
| core/render/theme.ts, style.ts, roughen.ts | 63+94+77 | Presets; seeded hand-drawn "sketch" style | The default `compact` style turns on a drop shadow that makes PNGs 7–23× slower | Keep; shadows off by default | hours |
| core/render/frame.ts | 128 | Pads output to 9:16 or 16:9 | Adds empty space to tall diagrams (n20: 1505 → 1820 px wide) | Drop, or default to `none` | — |
| core/react-flow/adapter.ts | 94 | React Flow JSON export | Throws away ELK's edge routes (uses `smoothstep`); leaks internal nodes (`gantt_config`, sequence lifelines as edges); nothing in the repo uses it | **Drop** | — |
| core/pipeline.ts, registry.ts, layout/index.ts, types.ts | 153+59+17+37 | Orchestration | `processDiagram` always builds a 2× PNG, even when `exportFormat:["svg"]`; duplicated code | Rewrite | hours |
| mcp-server/src/server.ts, index.ts | 268+15 | Two tools; saves to `~/Desktop`; returns the PNG inline as base64 | Sends the full schema twice; always PNG | **Rewrite** | 1 day |

`d3-shape` is a declared dependency that nothing imports.

Roughly 1,900 lines are worth carrying over (graph path, validation, geometry, scene/SVG, presets), plus about half of scene-builder. About 1,500 lines are drop candidates (the 12 non-graph types, canvas, React Flow, frame).

## 3. Measured numbers
**Setup:** synthetic architecture graphs with two levels of nested groups, about 30% of edges labelled, layout top-to-bottom, default style. Also Glyphic's own 44-node hero example. Generated by `bench/gen.mjs`, run in a 4-core, 15 GB container with Inter installed.

| | Leaves / groups / edges | ELK + passes | SVG end to end | Full `processDiagram` (2× PNG) | PNG size | PNG MB | Peak RSS | Crossings | Edges against flow | Edges > ½ canvas height | Box area / canvas | Node label px, fit to 1920 wide | Node label px as the model sees it (2576 px long edge) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| n20 | 21/4/26 | 86 ms | 76 ms | **17.3 s** | 3639×6470 | 0.74 | 881 MB | 2 | 0 | 2 | 6.1% | 14.8 | 11.1 |
| hero 44 | 34/10/38 | 269 ms | 192 ms | **14.2 s** | 4922×8750 | 1.1 | 831 MB | 6 | 2 | 6 | 7.0% | 10.9 | 8.2 |
| n50 | 52/10/56 | 289 ms | 241 ms | **27.4 s** | 6302×11204 | 1.8 | 949 MB | 4 | 2 | 3 | 5.7% | 8.5 | 6.4 |
| n100 | 104/20/129 | 461 ms | 281 ms | **62.7 s** | 11084×19704 | 7.2 | 1.87 GB | 64 | 5 | 16 | 2.8% | 4.9 | 3.7 |
| n200 | 208/41/238 | 776 ms | 887 ms | **128.9 s** | 26416×26370 | 15.2 | 5.56 GB | 275 | 15 | 41 | 1.7% | 2.0 | 2.7 |

- **Routing quality:**
  - 0 edges through unrelated boxes at every size.
  - Detour ratio (path length ÷ Manhattan distance between endpoints): median 1.00, 90th percentile ≤ 1.3.
  - Edge length in multiples of node height, 90th percentile: n20 15.7, hero 28, n50 18, n100 62, n200 115. The longest edge is 24,903 px.
  - Edges that leave the bounding box of their two endpoints (perimeter detours): hero 2, n100 8, n200 34.
- **Where the time goes:** the drop-shadow filter in the default style dominates.
  - 2× PNG without shadows: n20 0.75 s (23× faster), n50 2.1 s (12×), n100 9.0 s (7.6×).
  - A 5-node diagram: first PNG 1.5–2.2 s with shadows, 0.1 s without.
  - The ELK post-passes are cheap (46 ms at 200 nodes).
- **MCP timeouts:** the MCP TypeScript SDK's default request timeout is 60 s (`DEFAULT_REQUEST_TIMEOUT_MSEC`, checked in `node_modules`). The 100- and 200-node renders exceed it.
- **The model can't check its own output:** current frontier vision models downscale images to about 2576 px on the long edge (per vendor docs; about 1568 px on older models). So the agent reads the hero's labels at about 8 px and n100's at about 3.7 px. I also recall an 8000 px maximum dimension and a 5 MB-per-image limit on the API, which n50 and up would exceed. That is from memory: the web-search budget ran out before I could check it.
- **Layout stability, which matters for a before/after "architecture diff" pivot:**
  - Adding one cross-group edge moves 81–100% of boxes by more than 20 px. On hero and n100, 94–99% move by more than 200 px.
  - Adding one node and edge moves 100% on n20 and n50.
  - Absolute before/after comparison is meaningless on this ELK configuration. ELK's interactive/semi-interactive modes might help; I did not test them.
- **Schema size:**
  - The `render_diagram` input schema in `tools/list` is 28,031 chars, about 7.0k tokens, loaded in every session.
  - `get_schema` returns 56,453 chars of pretty-printed JSON, about 14.1k tokens.
  - 106 description fields; 79 `$ref`s pointing at paths inside sibling `anyOf` branches. Some function-calling stacks may not handle these; I didn't check.
- **Input cost compared with Mermaid:** Glyphic JSON is 2.3–2.8× the characters of an equivalent Mermaid flowchart (hero: 5,769 vs 2,086 chars; n200: 27,446 vs 11,903). It is cheaper than raw SVG but dearer than a DSL.
- **Install footprint:**
  - Cold `npm install @glyphicjs/mcp-server@1.1.4`: 7.1 s, 101 packages, **65 MB**. Largest: FontAwesome 25 MB, elkjs 7.7, MCP SDK 6.3, zod 5.2, resvg 4.3, hono 3.7, ajv 2.5.
  - Server spawn to `initialize`: 468 ms. Rendering the 3-node README example: 143–236 ms.
- **Determinism:** SVG is byte-identical within a process and across processes and timezones for graph diagrams. Gantt diagrams with dates are not (see §5).

## 4. Readability by size (I looked at every PNG)
- **~20 nodes:** usable, not good.
  - Readable when fitted to a 1920 px-wide screen, but the image needs about 3 screens of scrolling; fitted to the whole screen, labels are 4.7 px.
  - Clusters sit in a diagonal staircase with large empty corners.
  - Edges that cross clusters become 1,300 px vertical runs.
  - Labels like "cache lookup", "REST" and "writes" float between parallel lines, so it's unclear which edge they belong to.
- **Hero (44 nodes):** marginal.
  - "End Users" sits mid-right.
  - waf→alb is routed around the right edge of the canvas and sqs→notify around the left.
  - Root cause: **cycles between groups**, not between nodes. The node graph is acyclic, but Edge/CDN↔VPC (waf→alb, nat→cloudfront) and App↔Async (orders→events, sqs→notify) point both ways. Rigid nested rectangles plus a single flow direction force one edge of each pair backwards.
- **~50 nodes:** not readable as a whole (8.5 px labels).
  - Entry nodes land mid-canvas.
  - Two edges wrap the canvas perimeter.
  - At 100% zoom, panning loses edges off-screen.
- **~100 nodes:** unreadable (4.9 px).
  - A typical 1920×1080 viewport at 100% shows only long, unlabelled parallel lines and empty space.
  - The canvas is about 3×9 screens.
- **~200 nodes:** unreadable (2 px).
  - Bundles of about 10 unlabelled parallel lines; edges cross group titles.
  - About 7×12 screens at 100%.

## 5. False or overstated claims
1. **"18 types":** there are 18 type names, but flowchart and architecture are identical. c4, state, erd and class are relabels of one ELK path, and canvas is raw SVG primitives. There are 4 render strategies.
2. **"Byte-identical":**
   - PNGs depend on the host's fonts. Re-rendering 5 gallery examples here matched **0 of 5** committed PNGs; the gallery was rendered with a different font. With DejaVu Sans as the fallback, text overflows its boxes.
   - Gantt SVG changes with timezone and locale: 4 different hashes across UTC, Los Angeles, Kolkata and de_DE. In Los Angeles, a 2026-01-05 start is labelled 1/4/2026, an off-by-one-day bug.
3. **"Validated before it draws":** several bad inputs get through.
   - Duplicate ids produce ELK's raw `java.lang.IllegalArgumentException: value already present`.
   - Group cycles or a node grouped inside itself make nodes **silently vanish**.
   - An unknown `groupId` is ignored.
   - Unknown git parents and Gantt dependencies are dropped; a bad date becomes 1970 and the axis shows raw milliseconds.
   - An invalid id only says "Invalid".
4. **"Any Google Font" / "your own .ttf":**
   - The font is only an `@import` in the SVG. resvg never fetches it, so it never appears in the PNG, and browsers block external fonts in SVG shown as `<img>`.
   - Text metrics are tuned for Inter only.
   - The MCP server never passes `fontBuffer`, so a custom font can't appear in its PNG.
5. **"Accessible":** the SVG has `role="img"`, `<title>` and `aria-label` only. There is no `<desc>` and no text alternative describing the structure.
6. **"Self-hosted HTTP API":** not in the repo. `apps/` and `internal/` are gitignored; only a code comment refers to it. The hosted MCP on glyphic.web.app (described in `docs/mcp.md`) can't be verified from here.
7. **"Safe by construction":** the sanitizer passes `<a href=javascript:alert(1)>` (unquoted), `<image href=https://tracker…>` and `<handler ev:event=…>`. That is XSS when the SVG is inlined into HTML.
8. **"React Flow ✅ interactive":** see the inventory row; edge routes are lost and internal nodes leak.
9. **Benchmarks:**
   - Not reproducible: `internal/benchmark` is gitignored.
   - The docs say "resvg WASM", but `@resvg/resvg-js` is a native N-API binary.
   - "Large" there means an 8-entity ERD.
   - The stated bundle of 15–25 MB is really 65 MB.
10. **"Cheap and intact at scale":** see §3. It costs more tokens than Mermaid, the schema adds 7–21k tokens, and 100–200-node renders take 63–129 s and 1.9–5.6 GB.
11. **Comparison table, unverified:** "Mermaid: no MCP ❌" is likely false, and "parse-or-crash" ignores that `mermaid.parse()` returns errors. I couldn't check either because the search budget was used up.
12. **"Routes around obstacles":** true for the ELK path (measured). It is false as soon as any node has x/y coordinates.

## 6. Five technical conclusions for a rebuild
1. **The large-diagram failure is about placement and information design, not routing.** Routing is already fine (0 edges through boxes, detour ratio about 1.0). What fails:
   - Boxes cover only 1.7–7% of the canvas.
   - Cycles between groups force backward, perimeter-hugging edges.
   - The longest inter-group edges run 15–115 node heights.

   No post-pass fixes that. A rebuild needs:
   - Views that each show at most about 30–40 nodes.
   - Collapsible groups that combine their inter-group edges into one.
   - Detection of group-level cycles, and a choice of group ordering based on it.
   - Optionally, ports or links instead of canvas-length lines.
2. **A static 2× PNG is the wrong artifact beyond about 30 nodes.** Output reaches 26k px, 15 MB, 129 s and 5.6 GB, and models downscale it until they can't read it. Make SVG or interactive HTML (pan, zoom, search, collapse) the primary output. Return a PNG thumbnail of at most 2576 px only for the agent's self-check. Remove the default shadows (7–23× slower) and the always-on PNG.
3. **Reproducibility needs bundled fonts and real metrics.** Ship one font; measure text with its real metrics (fontkit, opentype.js or harfbuzz-wasm); render with `loadSystemFonts:false` plus that font file; format dates in UTC.
4. **Make the contract a small, strict graph schema.** One nodes/edges/groups schema with stable ids (diffs need them) and validation of duplicates, group cycles and dangling references. Cut the 12 non-graph types, canvas and the x/y escape hatch. Today's 7k-token, `$ref`-heavy union of 17 variants mostly dilutes the core idea.
5. **Carry over the ELK knowledge, not the code; expect stability to be the hard part.** The configuration, post-passes and 13 regression tests are the real asset. Any diff or "living map" pivot hits this first: one edited edge moves 80–100% of boxes. It needs constrained or incremental layout with remembered positions (ELK interactive modes or a fixed group skeleton), which I did not test.

## Files
Everything is under `/tmp/claude-0/-home-user-Glyphic/b81316dc-70f2-5510-bd50-0c3bd46253e5/scratchpad/`; the repo is unmodified.
- **Scripts in `bench/`:** gen.mjs, bench.mjs, metrics2.mjs, stability.mjs, preview.mjs, crop2.js
- **Outputs:**
  - `bench/out/*.metrics.json`
  - `bench/out/*_fit1920w.png`
  - `bench/out/fontfallback_compare.png`
  - `bench/prev/n100_TB_fit1920w.png`, `n200_TB_fit1920w.png`, `n100_LR_fit1920w.png`
  - `bench/prev/*_crop_*.png`
- **Other probes:** schema_size.mjs, edge_cases.mjs, san.mjs, det2.mjs, `npminstall/mcpclient.mjs`