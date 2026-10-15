# Competing strategies and adversarial judging (raw)

These are the raw outputs of the October 2026 strategy workflow: four independent strategists, each given a different lens, and two adversarial judges who scored and red-teamed all four. [`../PLAN.md`](../PLAN.md) is the synthesis. Claims here are the agents' own. The judges flagged many as unsupported; see each judge's `unsupported_claims`.

## Scoreboard

Each strategy is scored 1–10 on six dimensions, for a total out of 60.

| Strategy | OSS-veteran judge | Staff-engineer judge | Sum |
|---|---|---|---|
| distribution | 25 | 29 | 54 |
| revenue | 28 | 27 | 55 |
| contrarian | 29 | 30 | 59 |
| moat | 27 | 33 | 60 |

## Strategy (distribution): Glyphic Maps: a distribution-first plan. Turn the engine into a zoomable, code-checked repo map that agents build and READMEs show off

### one liner

Type "/map" in Claude Code, Codex or Cursor and get one HTML file you can zoom like Google Maps, from the whole system down to a single file. Every arrow is checked against the code, it takes one agent call instead of 25 repair rounds, and it comes with a README badge so anyone can explore it.

### thesis

The 2026 market killed Glyphic's original premise as a product.

**Models now draw small diagrams well enough.** The two biggest diagram projects of the year let the agent place coordinates and skip auto-layout on purpose: Archify (83,979★; its README says "no general-purpose auto-layout") and diagram-design (55,780★). Their packaging won: a one-command agent skill and a single self-contained HTML file that screenshots well [market #1-2; demand §1.1].

**Three gaps remain that models do not close, and each grows as agents write more code:**

1. **Scale is a limit of human perception, not of drawing.**
   - No engine or model makes one 150-node canvas readable: not ELK, not TALA, not yFiles [tech §1].
   - Glyphic's own renders prove it: hero labels are 10.9 px; at 100 and 200 nodes labels are 4.9 px and 2 px on a canvas of 3×9 to 7×12 screens [codebase §3-4].
   - The field's answer is navigation: levels, aggregated edges, semantic zoom [market #9; tech §1].
   - The winning skills do not have it. Archify users are filing for it now: cross-diagram drilldown (#280), expandable subgraphs (#401), routing conflicts (#660), "arrows are disorganized" (#6) [demand §1.5].
2. **Models invent edges.**
   - In R2ABench, invented edges are the main structural failure [tech §0.4].
   - "Wrong, not ugly" is the top complaint about DeepWiki, GitDiagram and Archify [demand §1.6, §3].
   - The more code agents generate, the more a verifier that is not the generator is worth.
3. **The default AI diagram is a throwaway image.**
   - It lives in a chat or on the Desktop. It doesn't live in the repo, doesn't refresh, and doesn't spread.

**Why the gap persists.** The leaders' design (the agent hand-places SVG, then repairs in a loop) structurally cannot produce large zoomable layouts without becoming an engine. Their own trackers record the cost: about 25 repair rounds for an 8-node map (#214) and "tens of millions of tokens" (#22) [market table]. Glyphic already has the engine part that works: 0 edges through unrelated boxes at 200 nodes, median detour ratio 1.00 [codebase §3]. What fails is placement and output format. Views and HTML fix both.

**The distribution-first conclusion.** Nobody stars an invisible engine [market #2]. So:
- Package the engine as the visible artifact, a zoomable map.
- Ship it through the channel that actually spreads in late 2026: agent skill, CLI, one HTML file, README badge and share links.
- Make every map carry a link back.

Mermaid spread by living where code lives. Excalidraw spread through links and a recognizable look. DeepWiki and GitDiagram spread through a badge or URL trick. Glyphic should combine those loops on the one job the leaders have left open.

### target user

**Primary:** a developer who uses a coding agent (Claude Code, Codex, Cursor, OpenCode) every day on a codebase too big to hold in their head. Roughly: 30+ modules or services, a monorepo, or a codebase largely written by agents. They need to onboard, explain or re-orient.

**Highest-leverage sub-persona: maintainers of mid-to-large public OSS repos (about 1k-50k stars).** They want a contributor-facing architecture map they can link from the README. Their adoption is public (badge, committed glyphic.json), so each one is an advertisement seen by hundreds of contributors. This is the DeepWiki-badge / GitDiagram mechanic.

**Secondary users:**
- Mermaid power users whose flowcharts with subgraphs have outgrown one screen. They come in through Mermaid import. Evidence: four or more Obsidian plugins exist just to add pan/zoom to Mermaid, and Mermaid issue #1860 "ZOOM!!!" [demand §3].
- DevRel and tech writers who want an explorable architecture embed.

**Paying users (from month 3):**
- Small engineering teams (5-50 devs) with private repos who want the map rebuilt on every push, private share links, and PR context.
- Consultants who need editable draw.io export (demand grade g).

**Explicitly not targeted** (graded D/F in the demand report): agent builders wanting a diagram API or MCP, educators, non-technical knowledge workers, and buyers of a layout engine.

### job to be done

"When I face a codebase too big to hold in my head, often one an agent wrote, I want to:
- see the whole system on one screen;
- zoom smoothly into the part I care about without losing my place;
- click any arrow to see the line of code that proves it exists;
- get all of that from one agent command, without hand-drawing or a token bonfire.

Then I want to link it from the README so the next person doesn't have to ask me."

The secondary job is the team version: "keep that map current on main and show me where this PR lands on it."

### evidence of demand

**1. The channel and the appetite are proven.**
- 2026's breakout diagram projects are all agent skills or AI apps: Archify 83,979★ (created 2026-04-15), diagram-design 55,780★, next-ai-draw-io 36k, beautiful-mermaid 11.2k, drawio-skill 10.2k [market #1].
- MCP render tools are an order of magnitude smaller: Excalidraw MCP about 5k, mcp-mermaid about 0.6k [demand §1.1].
- AWS pulled its diagram MCP server: "superseded by diagram agent skill" [demand §1.1].
- Glyphic has 10★ and about 79 weekly npm downloads [demand §1.1].
- Conclusion: the packaging lost, not necessarily the engine.

**2. The leader's users are hitting exactly what Glyphic's engine does** [market table; demand §1.5]:
- Repair loops: about 25 rounds for an 8-node map (#214).
- Token burn: "tens of millions of tokens" (#22), "slow and token-heavy" (#66).
- Overlaps that pass validation (#61).
- Opposite-direction edges collapsed into one line (#248).
- 3 of 5 bundled examples fail containment, with a 6 px text floor (#344).
- Users asking for drilldown and expandable subgraphs (#280, #401) and for better routing (#660, #6).

**3. Large-system pain asks for navigation, not a bigger picture.**
- Ilograph calls whole-system "master" diagrams "almost always a mistake" [demand §1.5].
- Every tool that copies with scale uses views: Ilograph, IcePanel, LikeC4, Structurizr [market #9].
- Obsidian users hack CSS to pan big Mermaid C4 diagrams; InfraSketch says 50+ resources is "essentially unreadable"; a Cloudcraft reviewer: "layout is super messy" [demand §3].
- Glyphic's own n100/n200 renders are unreadable as single canvases [codebase §4].

**4. Correctness is the top complaint** [demand §3; tech §0.4]:
- DeepWiki "hallucinating pretty convincingly."
- GitDiagram "a connection… that doesn't exist."
- "A confidently wrong architecture diagram is worse than no diagram at all."
- R2ABench: invented edges are the main failure.

**5. Viral repo-to-picture mechanics work.**
- GitDiagram has about 17-18k★ on a URL trick [demand §2; tech §0.2].
- DeepWiki pre-indexed 30k repos at launch and spread through its badge [market table].

**6. The people losing the most time need it.** Review time is up 91% on high-AI teams (Faros) and up 49% with no extra features shipped (Harvard/Jellyfish, Oct 2026) [demand §3]. Codebases nobody wrote by hand are piling up "cognitive debt" (grade i3, C).

**Honest counter-evidence**
- Large-diagram pain is low intensity. Mermaid's top layout and zoom issues have only 30-50 👍 [demand §1.5].
- Willingness to pay for diagrams specifically is about 2/5 [demand §2].
- Stars rarely become money: ChartDB has about 23k★ and reported "$1K collected revenue" [market #5].

So this plan treats the zoom map as an adoption bet, not a revenue bet.

### why now

**1. The rails are fresh and the habit has formed.**
- Claude Skills (Oct 2025), then the Agent Skills open standard (2025-12-18), then Vercel's `npx skills add` and the skills.sh install leaderboard (2026-01-20). Every winner launched January to April 2026 [market #1].
- One command now installs into every agent. A June 2026 MCP server missed that wave, but a December skill can still catch it.

**2. A large, active pool of users is hitting limits right now.** Archify is growing about 5k★ a week and has 77 open issues and 102 open PRs [demand §1.1; market table], with its most-requested gaps (drilldown, routing, token cost) unfilled. This window closes if Archify or a fork adds auto-layout and zoom.

**3. Layout engines just became free commons, so we use them rather than sell them.**
- Mermaid 12 made ELK the default (2026-09-10) [demand §1.2].
- TALA was open-sourced under MPL-2.0 (2026-09-07) as Terrastruct shut down [tech §0.1].
- Selling layout is now provably dead, so value moves to packaging, navigation and verification.

**4. Incumbents in model-based views just left the field.**
- Structurizr's cloud service reached end of life on 2026-09-30 [market table].
- DeepWiki covers public repos only, and Google Code Wiki's private access is a waitlist [market whitespace #8].
- A local-first tool that runs inside your own agent on private code has no free incumbent.

**5. PNG-for-agents is dead.** Current frontier vision models downscale images to about 2576 px, so the agent reads Glyphic's own hero image at about 8 px [codebase §3]. TraversalBench shows vision self-checks collapse at edge crossings [tech §0.5]. The right shape is HTML/SVG for humans plus a defect report as text for agents, which is exactly what a rebuild should ship.

**6. AI-written code is overloading reviewers** (+91% / +49% review time) [demand §3]. "Show me the system I didn't write" is a daily need in late 2026, not a quarterly one.

### wedge v1

**Product: "Glyphic Maps."** Ship in 6 weeks (code complete by day 40, Tue Nov 24, 2026). One install string:

`npx skills add MS-Teja/glyphic`

It works in Claude Code (also listed in the plugin marketplace), Codex, Cursor, OpenCode, Gemini CLI and Copilot.

**1. The skill: `/map` command (also fires on "map this repo").** SKILL.md teaches the agent to:
- Explore the repo.
- Write `glyphic.json`, a compact system model:
  - nodes with stable ids, `kind`, `parent` (giving 3-4 levels: system → containers → modules → key files);
  - edges with `kind` (import / http / queue / db / config);
  - required `evidence` on each node and edge: `{path, lines, match}`.
  - The schema is ≤1.5k tokens and lives inside SKILL.md. There is no get_schema call, unlike today's 7k-token tools/list plus 14k-token get_schema [codebase §3].
- Run `npx glyphic build`.
- Fix whatever the text report flags, then stop. Target: ≤2 fix rounds at p90.

**2. CLI `npx glyphic build`.** One npm package, <15 MB installed (today's install is 65 MB, of which FontAwesome is 25 MB).
- **Strict validation with model-fixable messages:**
  - duplicates, group cycles, dangling references and unknown groups become errors (today they vanish silently or crash);
  - Levenshtein "did you mean" suggestions (kept from validation.ts).
- **Evidence verifier:** the file exists, the line range is valid, and the `match` string occurs within it.
- **Geometric defect report as text:** overlaps, labels under 11 px at fit, crossings per level. Defects are computed, not seen by a vision model [tech §0.5].
- **Exit codes** the agent can loop on.

**3. Engine.**
- ELK layered with Glyphic's ported post-passes (label-aware sizing, edge separation, jog collapse, border clipping) [codebase §2].
- Applied hierarchically, level by level. Collapsed groups show aggregated edges with counts.
- Group-level cycle detection chooses group order. This fixes the hero's waf→alb around-the-world edges [codebase §4].
- Bundled Inter font with real font metrics. resvg with loadSystemFonts:false. No default shadows (they cost 7-23× in speed) [codebase §3].

**4. Output: a single `architecture.html` file** (target ≤300 KB at 100 nodes).
- **Semantic zoom:** scroll and groups open in place, children appear inside their parent. Nothing seen at one level disappears at the next.
- Search (`/`).
- Click a node: focus plus a k-hop trace.
- Click an edge: an evidence panel with deep links (GitHub, GitLab, or `vscode://` locally).
- Verified edges solid, unverified edges dashed. Header shows a count, e.g. "41 edges · 37 verified."
- **Distinctive "cartographic" default theme** so screenshots identify themselves, the way Excalidraw's hand-drawn look does: groups as tinted regions with map-style labels, major flows as thicker "highways." The existing seeded sketch style is kept as an alternate theme.
- **Small attribution footer:** "Explore · Make a map of your repo →" with the install command. It is removable via flag, on the honor system, like React Flow's attribution [BK].

**5. README kit, offered when the build ends.**
- `docs/architecture.svg`: an overview of ≤40 nodes with ≥12 px labels, which renders natively on GitHub.
- An ARCHITECTURE.md snippet.
- A badge: "Explore the architecture → glyphic.dev/owner/repo."

**6. `glyphic share`.**
- Uploads the model to the user's own GitHub gist (secret by default) and returns `glyphic.dev/g/<gistId>`.
- A static viewer on the existing Firebase/Cloudflare hosting, plus a tiny worker that renders an OG preview card. Slack, X and Discord links unfurl with a picture.
- We store nothing, so cost is roughly zero.

**7. `glyphic build diagram.mmd`.** Imports Mermaid flowcharts with subgraphs into the same zoomable map. It is the hook for Mermaid's user base and for models' Mermaid prior [market whitespace #7].

**8. glyphic.dev.**
- A landing page whose hero is a live zoomable map of a famous system.
- An **Atlas** of 30 famous repos (e.g. kubernetes, next.js, vscode, supabase, ollama, deno, langchain, excalidraw, mermaid). Each is a shareable URL with a "claim/correct this map" link.
- A paste-Mermaid/JSON playground.

**9. DiagramBench v0.** An open harness and leaderboard, stratified by size (10/25/50/100 nodes).
- **Contenders:** Glyphic, Archify, diagram-design, Mermaid-ELK, D2-TALA, raw frontier-model SVG/HTML.
- **Metrics:** tokens, wall time, repair rounds, overlaps, minimum label px at fit, crossings, and edge fidelity on 5 hand-checked repos.
- It doubles as the launch post.

**Not in v1:** MCP server, PNG to Desktop, 17 other diagram types, the React Flow export, GitHub Action, Cloud.

### keep from repo

- ELK configuration and post-passes in packages/core/src/layout/elk-adapter.ts (label-aware sizing, INCLUDE_CHILDREN nested groups, overlapping-edge separation, jog collapse, BALANCED alignment): the knowledge and its 13 regression tests. Port them first, then rewrite the code against the new schema.
- packages/core/src/layout/validation.ts: unknown-id errors with Levenshtein 'did you mean', the model-fixable error style
- packages/schema/src/format-error.ts: short, de-duplicated Zod errors aimed at models
- packages/core/src/math/geometry.ts: edge clipping on diamond, hexagon and cylinder borders
- scene/scene-graph.ts and render/strategies/svg-renderer.ts (clean scene-to-SVG path), plus the arrow-marker and border-clipping parts of scene-builder.ts
- render/roughen.ts: the seeded sketch style, kept as an alternate theme (a recognizable look helps screenshots identify themselves)
- render/rasterizer.ts (resvg), only for the agent's self-check thumbnail capped at 2576 px, with the bundled font and loadSystemFonts:false
- The Glyphic name, the @glyphicjs npm scope, the glyphic.web.app hosting (redirect to glyphic.dev if it can be bought) and the existing GitHub Sponsors setup
- The pnpm + turbo + Biome + vitest monorepo tooling and CI, which already pass cleanly (236 tests, 45 s)
- The audit's benchmark scripts (bench/gen.mjs, metrics2.mjs, stability.mjs in the scratchpad) as the seed of DiagramBench

### drop from repo

- The 12 non-graph diagram types (gantt, sankey, pie, quadrant, treemap, timeline, journey, kanban, git, plus sequence for v1) and the '18 diagram types' positioning. The winners have 10 and 44 types, so breadth is not what separates them [market #1].
- The 'canvas' type and the explicit x/y escape hatch, which bypasses ELK and stacks every other node at (0,0) [codebase §2]
- The React Flow export: it has no consumer, throws away ELK's edge routes and leaks internal nodes
- frame.ts 9:16/16:9 padding
- The stdio MCP server as the primary surface: saving to ~/Desktop, the inline base64 PNG, the duplicated 7k + 14k-token schema. Deprecate @glyphicjs/mcp-server on npm with a pointer to the skill, and drop smithery.yaml.
- The always-on 2x PNG and the default drop shadow (7-23x slower, and renders at 100+ nodes exceed the MCP 60 s timeout)
- The FontAwesome dependency (25 MB) and the dead d3-shape dependency; replace with a small bundled icon subset
- The regex SVG sanitizer and raw-SVG input (it can be bypassed into XSS); HTML output must escape every label
- The heuristic character-width tables in text-metrics.ts and scene-builder.ts; use the bundled font's real metrics
- The FSL-1.1-ALv2 license on core
- Unverifiable or false claims in the README and docs: byte-identical PNGs, 'safe by construction', 'any Google Font', the 'Mermaid: no MCP' comparison table, 'resvg WASM', the 15-25 MB bundle figure, and benchmarks that point at the gitignored internal/benchmark
- The 440-line, 17-variant Zod union schema with metadata: record(any)

### rebuild or evolve

**Rebuild the product, transplant the engine.** Keep the same GitHub repo; optionally transfer it to a `glyphic` org (GitHub redirects old URLs). The 10 stars are not worth protecting, but the npm scope and the name are.

**New layout:**
- `packages/glyphic`: the only thing users install. CLI, bundled. MIT.
- `packages/engine` (`@glyphicjs/engine`): MIT. Schema, validation, evidence verification, layout, scene, SVG. Small and embeddable, so other skills, Archify included, can call it and credit it [market whitespace #2].
- `packages/viewer`: the single-file HTML template.
- `skills/glyphic/SKILL.md`, with per-agent install manifests.
- `bench/`: the DiagramBench harness and data.

**Order of work:**
1. Write the new ≤1.5k-token schema.
2. Port elk-adapter's 13 regression tests and make them pass on the new path before writing anything else. That keeps the 2-4 weeks of edge-case knowledge, while re-porting the code takes about 2 days [codebase §2].
3. Then build hierarchical layout, the verifier, and the viewer.

Archive the old packages with clear npm deprecation messages rather than maintaining them. Evolving the old codebase would mean carrying about 1,500 lines of drop candidates and a 17-variant schema whose main effect is to dilute the core idea [codebase §2, §6].

### distribution plan

**Principle:** using the product makes it visible. Every surface ships with a link back, and the launch hits the channels that actually moved 2026 diagram tools: X, Chinese and Japanese developer communities, skills.sh, plugin directories and GitHub Trending. HN and dev.to were not those channels; Archify got 1 HN point and still reached about 84k★ [demand §1.7; market #1].

**Built-in loops**

| # | Loop | How it works |
|---|---|---|
| L1 | Footer | Every architecture.html footer links "Make a map of your repo" with the copy-paste install command. |
| L2 | README badge and committed map | The skill offers "Add the architecture badge + docs/architecture.svg to README?" at the end of every build. Each badge links to glyphic.dev/owner/repo, which shows "make yours." Adoption is measured with GitHub code search for the badge URL or glyphic.json, so no telemetry is needed. This is the DeepWiki/GitDiagram mechanic. |
| L3 | Share links | Links unfurl as OG preview cards in Slack, Discord and X. |
| L4 | Atlas, "claim your map" | Maintainers of mapped repos commit a corrected glyphic.json, which turns into L2. |
| L5 | DiagramBench leaderboard | Other tool authors submit runs and share their rank, which spreads the benchmark and the brand. |
| L6 (day 60+) | GitHub Action PR comments | On public repos, comments say "this PR touches these 3 regions" and link to the stable map with those regions highlighted. Every contributor sees one; this is how review bots spread. |
| L7 | Embedded engine | `@glyphicjs/engine` inside other skills with a "layout by Glyphic" credit. Also an `import archify.json` path that gives Archify's audience zoom and auto-layout. Offer it in an Archify discussion and to the maintainer; never spam its issues. |

**First 1,000 stars**

- **Days 29-40: build the pre-launch arsenal**
  - Generate the 30-repo Atlas.
  - Record 15-second screen captures zooming from "Kubernetes: 8 regions" down to a single kubelet package, with an evidence click.
  - Write READMEs in English, Simplified Chinese and Japanese from day one.
  - Private beta with 20 maintainers of 1k-50k★ repos, reached by DM on X and Discord. Get 5 quotes and 10 committed maps.
- **Day 40 (Tue Nov 24, 2026): launch wave 1.** US Thanksgiving week barely affects these channels.
  - An X thread built around the zoom GIF plus the token/defect comparison ("same repo: 1 build + 1 fix vs N repair rounds", measured by DiagramBench).
  - Chinese posts on V2EX, Juejin and Zhihu; Japanese posts on Qiita, Zenn and note.com.
  - Submissions to skills.sh, the Claude Code plugin marketplace, Cursor/Codex/OpenCode skill directories, and the awesome-agent-skills and awesome-claude-code lists.
  - Ask the 20 beta maintainers to post their own maps that day.
  - Target 200+ stars in 24 hours to reach daily GitHub Trending for TypeScript. That threshold is from background knowledge, unverified.
- **Day 47 (Tue Dec 1): launch wave 2**, leading with the benchmark rather than the product. A second wave keeps Trending alive.
  - Show HN: "We measured how AI agents draw 10- to 100-node systems."
  - r/ClaudeAI, r/ChatGPTCoding, r/programming (benchmark post), Product Hunt.
- **Days 41-90: weekly "Map drop."** Five famous repos every week, each one a post and an SEO page.

**First 100 real users.** A real user has committed a glyphic.json, or built two or more maps.
- 20 come from the beta.
- About 30 come from Atlas "claim your map" outreach to those repos' maintainers. Ask them; don't open unsolicited PRs.
- The rest come from the launch and the L1/L2 loops.
- Run a Discord server, reply to every issue within 24 hours, and turn the first 10 feature requests into public fixes, credited on X.

**Avoid:** HN-first, MCP-registry-first, and a paid Product Hunt push. Those channels did not move this category in 2026 [demand §1.7].

### monetization

**Goal: "a bit of money on the side" without taxing adoption.** Local use, public repos, share links, the Atlas, the engine and the benchmark stay free forever. Charge only for **private, hosted, always-current state and white-label**. Never charge for rendering, layout or policy checks: Terrastruct died selling layout, and free policy checkers already exist in dependency-cruiser, ArchUnit and drawio-skill [market #4; demand §4].

**1. Sponsorship (from launch).** The proven model for a viral skill: Archify sells README sponsor slots, mostly to LLM-API resellers [market #5].
- GitHub Sponsors tiers: $5 individual; $49/mo logo in the README and on glyphic.dev; $299/mo "featured," capped at 3 slots, developer-tool companies only, clearly labelled.

**2. Glyphic Cloud (private beta from day 75, general availability around month 4).**
- **Team, $29/mo per org:** up to 5 private repos, map rebuilt on every push, private share links behind GitHub login, PR comments on private repos, history slider, no attribution footer.
- **Business, $99/mo:** unlimited repos, GitLab/Bitbucket, Notion/Confluence embeds, SSO later.
- Extraction is deterministic where possible, and the customer brings their own LLM key, so gross margin stays high.
- The benchmarks put this pricing below IcePanel ($40-80 per editor) and near Hava ($59-249) [demand §3].

**3. Later, months 6-12, only if teams ask:** a Confluence/Jira macro on the Atlassian Marketplace. draw.io's roughly 65k installs show this is where open-source diagram tools actually earn money [market #5, whitespace #9].

**Realistic numbers:**
- **Day 90:** $100-400/mo from sponsors.
- **Month 12 base case** (about 5k★, around 300 public repos with maps): 15-30 paying orgs, so $0.6-2k MRR from Cloud plus $300-800 from sponsors. Total about $1-3k/mo.
- **Bear case:** under $300/mo. ChartDB reached about 23k★ but only "$1K collected revenue" [market #5].
- **Bull case** (Archify-like virality, 20k+★): sponsor slots alone reach $2-5k/mo.

This is side money, not a salary, and the plan should be judged on adoption first.

### license

**MIT for everything in the repo:** engine, CLI, viewer template, skill and benchmark harness. The benchmark datasets are CC-BY-4.0. The hosted Cloud service is closed source.

**Relicense core from FSL-1.1-ALv2 now.** The user is the sole copyright holder, there is no adoption to protect, and FSL deters exactly the embedding by other skills that this plan needs for distribution. Every comparable winner is MIT, Apache or MPL [market #4; tech §4].

**Third-party pieces:**
- elkjs (EPL-2.0) as an unmodified dependency: fine.
- resvg (MPL-2.0): fine.
- Inter font (OFL): fine to bundle.
- libavoid (LGPL): avoid bundling it statically.
- TALA: only ever an optional external backend.

### moat

**Honestly, there is close to no moat on day 0.** Speed and packaging are the only edge at launch. The defensible assets accumulate in this order:

1. **Public footprint as a network.** Every committed glyphic.json and README badge is a backlink, an advertisement and an Atlas entry. Hundreds of maintainer-claimed maps give glyphic.dev an index of systems that compounds in SEO and is tedious for a fork to rebuild. This is the DeepWiki-badge effect.
2. **Category referee.** Whoever owns the only size-stratified, open diagram benchmark sets the terms the whole "AI draws diagrams" race is judged by. No existing benchmark goes above about 15 nodes [tech §0.4, §3f]. Labs, Archify, pr-lens, Mermaid and D2 all have a reason to cite it.
3. **A capability the leaders gave up by design.** Archify and diagram-design deliberately skip auto-layout [market table]. Adding hierarchical zoom, aggregated edges and group-cycle-aware placement means building an engine, and Glyphic already has a measured, working one [codebase §3].
4. **From month 2-3: stable-layout lockfile plus per-repo history in Cloud.** This is the tech report's durable moat: a persistent, versioned, evidence-checked system model in git. It gains value as agents write more code, because a generator cannot certify itself and you need state across commits to show what changed [tech §4].

**Not moats:** the layout algorithm (ELK and TALA are free), the number of diagram types, the viewer or WASM build, and the license.

### competitors and how we win

- **Archify (84k★, MIT):** the incumbent for this exact audience.
  - We don't attack it. We do the job it says it doesn't do: auto-layout and whole-system zoom with drilldown (its #280 and #401).
  - We publish measured numbers on repair rounds and tokens (its #214, #22, #66) and on text and containment defects (#61, #344).
  - We offer `glyphic import archify.json` and the MIT engine to its maintainers. If Archify embeds Glyphic, that is the best possible outcome: a credit line inside an 84k★ project.
- **diagram-design (56k★):** editorial taste for small diagrams, non-deterministic by its own README. Not a fight. Our docs recommend it for blog-scale visuals and Glyphic for "the whole system."
- **DeepWiki and Google Code Wiki (free, big brands):** Mermaid-grade static diagrams with documented hallucinations, public repos only or a waitlist for private ones [market table; demand §3]. We win on:
  - running inside your own agent on private code;
  - per-edge verification counts;
  - zoom instead of separate static images;
  - the map living in your repo.
- **GitDiagram (about 18k★):** a URL-trick static diagram. We copy the mechanic (glyphic.dev/owner/repo, from day 75) but serve a zoomable, verified map.
- **next-ai-draw-io, drawio-mcp, the Excalidraw MCP App:** freeform canvases where the model places shapes, with no link to code. We win on scale and verification. We add a draw.io export (day 41-60) so consultants can still edit by hand, which turns their user base into an inbound channel.
- **drawio-skill (10k★):** closest to a living map with PR diffs and policy rules, but it has the Graphviz look and is Python-heavy. We win on look, zoom and a zero-config Node install, and we don't compete on policy.
- **Mermaid (91k★) and beautiful-mermaid:** in every model's training data and rendered natively on GitHub. We import Mermaid rather than replace it ("your Mermaid, but zoomable and big").
- **LikeC4, Structurizr, IcePanel, Ilograph:** model-based views, but the model is hand-authored [market #10]. We generate the model and export to the LikeC4 and Structurizr DSLs, which reaches their communities and catches Structurizr's orphaned cloud users.
- **PR-diff tools** (pr-lens 2k★, CodeBoarding, Groma, ArchLens, Eraserbot, CodeRabbit diagrams): we don't enter as a PR product. The PR comment arrives in month 2-3 as one view of the stable map. That is where they are weak: they re-lay out from scratch every run and draw LLM-asserted edges [market §3; tech §0.3].
- **Native chat visuals** (Claude, March 2026; ChatGPT Intelligent UI, October 2026): fine for throwaway small diagrams. We win when the map has to be large, correct, persistent in the repo, and linkable.

### key risks

- Archify (102 open PRs) or a fork adds auto-layout and drilldown before or just after launch, and its 8,000x distribution gap makes Glyphic irrelevant. Mitigation: ship the engine as MIT plus an Archify import from day 41, so a fix inside Archify becomes our credit instead of our death.
- Chat platforms make interactive diagrams native: Claude visuals (Mar 2026) and ChatGPT GPT-6 Intelligent UI (Oct 7, 2026) [demand §1.4]. Ad-hoc 'draw me the system' moves into the chat window. Only the in-repo, verified, large-scale map survives that.
- Wrong maps go viral for the wrong reason. A famous repo's maintainer publicly disputes an Atlas map, and 'confidently wrong is worse than none.' Mitigation: verified/unverified styling and counts, an obvious 'correct this map' flow, and beta-checking every Atlas map with its maintainers before launch.
- Stars without retention. People map once and never again, so maps go stale. Mitigation: track second-build rate; the Action that refreshes on push arrives by day 75.
- The demand behind the zoom thesis is inferred and low intensity: Mermaid zoom and layout issues have only 30-50 thumbs-up, and willingness to pay for diagrams is about 2/5 [demand §1.5, §2]. The money may never show up, even if stars do.
- Execution risk for one person in 6 weeks: hierarchical top-down layout, real text metrics, the semantic-zoom viewer, the skill, share links, the Atlas and the benchmark. ELK's top-down mode is unverified [tech §1, BK]. Cut order if late: benchmark v0 down to tokens and defects only, then Mermaid import, then the OG worker.
- Benchmark credibility. The judge is also a contestant, and the Archify community may take it as an attack. Mitigation: open harness, reproducible runs, invite each tool's authors to tune their own entry, and publish the cases where Glyphic loses (small diagrams, aesthetics).
- Backlash against the attribution footer, or forks that strip it. Keep it tasteful and removable with a flag, following React Flow's precedent [BK].
- The Chinese and Japanese channels need native-quality posts and someone present in those communities. Use AI translation plus a paid native reviewer, and recruit community translators from the beta.
- If the glyphic.dev/owner/repo service goes viral, inference costs could spike the way GitDiagram's did [BK]. Mitigation: deterministic extraction first, a cheap model only for naming and grouping, daily budget caps, sponsor-funded.
- Security: model-written labels and evidence snippets rendered into HTML on the glyphic.dev origin. The current sanitizer is bypassable [codebase §5]. Escape everything, run share links in a sandboxed origin, and execute no SVG passthrough.

### kill criteria

- Archify ships auto-layout plus drilldown or zoom before Nov 24: don't launch head-on. Within a week, re-scope to engine-for-skills plus the Archify import plus the benchmark.
- The pre-launch benchmark at 40 or more nodes does not show Glyphic clearly ahead of Archify and Mermaid-ELK, meaning at least 2x fewer geometric defects or at least 3x fewer repair tokens and rounds. Then drop every 'engine' claim, and reconsider whether the zoom viewer alone is worth launching.
- A 10-person comprehension test (find the path from X to Y; name everything that touches the database), run before launch, shows the zoom map no faster or more accurate than Archify's static output or DeepWiki. Then kill the zoom thesis.
- 14 days after launch: under 400 stars and fewer than 30 public repos with a committed glyphic.json or badge (counted with GitHub code search). Then stop building features, do 10 user interviews, and decide on a pivot within 2 weeks.
- Day 90: under 1,500 stars, or fewer than 150 public repos with a committed map, or under 20% of first-month users building a second map within 30 days. Then end the growth push and keep the engine library and benchmark in maintenance mode.
- Cloud: fewer than 5 paying orgs within 60 days of private beta, or fewer than 3 of 20 interviewed teams saying they would pay $29/mo. Then build no more paid features and run on sponsorship only.

### roadmap 90 days

- Days 1-7 (Oct 15-21): decisions and cleanup.
- Relicense to MIT.
- Deprecate @glyphicjs/mcp-server and @glyphicjs/core on npm with a pointer to the skill.
- Strip the false claims from the README and docs.
- Write the ≤1.5k-token v1 system-model schema: stable ids, parent levels, required evidence.
- Port the elk-adapter regression tests and post-passes.
- Bundle Inter with real font metrics; resvg with loadSystemFonts:false; no shadows; SVG-first.
- Days 8-14: validator and layout.
- Validator: duplicates, group cycles, dangling and unknown references are errors; did-you-mean suggestions.
- Evidence verifier (file, line range, match string).
- Geometric defect report as text, with exit codes.
- Hierarchical per-level layout with aggregated inter-group edges and counts.
- Group-cycle-aware ordering, to fix the hero's perimeter edges.
- Days 15-28: the single-file architecture.html viewer.
- Semantic zoom, search, focus with k-hop trace, evidence panel with GitHub/GitLab/vscode:// links, verified/unverified styling.
- Cartographic default theme, sketch alternate, attribution footer.
- Target ≤300 KB at 100 nodes.
- README-safe overview SVG: ≤40 nodes, ≥12 px labels.
- Days 29-35: packaging and launch assets.
- SKILL.md packaged for Claude Code (plugin marketplace), Codex, Cursor, OpenCode, Gemini CLI and Copilot via `npx skills add`.
- `npx glyphic` CLI, Mermaid flowchart import, `glyphic share` (gist-backed link plus OG-card worker).
- glyphic.dev landing page and 30-repo Atlas.
- DiagramBench v0: 10/25/50/100 nodes × 6 contenders × tokens, rounds, defects, minimum label px, edge fidelity on 5 hand-checked repos.
- Days 36-40: private beta with 20 OSS maintainers.
- Fix the top issues.
- Collect 5 quotes and 10 committed maps.
- Record 15-second zoom GIFs.
- Finalize the English, Chinese and Japanese READMEs.
- Get every Atlas map maintainer-checked where possible.
- Day 40 (Tue Nov 24): launch wave 1.
- X thread with GIFs.
- V2EX, Juejin and Zhihu; Qiita, Zenn and note.com.
- skills.sh, plugin and skill directories, awesome lists.
- Beta maintainers post their maps.
- Push for daily GitHub Trending.
- Day 47 (Tue Dec 1): launch wave 2, benchmark-led.
- Show HN, Reddit (r/ClaudeAI, r/ChatGPTCoding, r/programming), Product Hunt.
- Open the leaderboard to submissions.
- Days 41-60: grow from launch feedback.
- Weekly Map drop (5 repos per week).
- `import archify.json`; export to draw.io, LikeC4 and Structurizr.
- Deterministic extractors that cross-check agent edges: TS/JS imports, Python imports, docker-compose, package workspaces.
- Issues answered in under 24 hours; Discord.
- DiagramBench v1 adds stability-under-edit and a 200-node tier.
- Days 60-75: stability and the Action.
- Layout lockfile v0: persist positions; a single-node edit moves under 10% of boxes. Today it moves 81-100% [codebase §3].
- glyphic-map-action: rebuild on main and publish to GitHub Pages; PR comment linking the stable map with changed regions highlighted (viral loop L6).
- Dynamic badge endpoint.
- Days 75-90: the hosted service and the money.
- glyphic.dev/owner/repo for Atlas and claimed repos, plus budget-capped auto-generation for public repos using deterministic extraction and a cheap model for naming.
- Glyphic Cloud private beta (private repos, rebuild on push, private links, no footer) at $29/$99.
- Sponsor tiers live.
- Day-90 review against the kill criteria and success metrics.

### success metrics

- Adoption (the primary metric): public repos with a committed glyphic.json or badge, counted with GitHub code search. Targets: 30 at launch (beta), 150 by day 60, 300+ by day 90.
- Stars: 1,000 within 14 days of the Nov 24 launch; 3,000-5,000 by day 90 (stretch 10k). At least 3 days on daily GitHub Trending for TypeScript in launch week.
- Skill installs reported by skills.sh and the directories: 5k by day 60, 10k by day 90.
- Retention: at least 30% of users who build one map build a second within 30 days (measured among Discord and beta users and from repeat commits to committed maps).
- Share and viewer reach: 20k unique monthly visitors to glyphic.dev and share-link viewers by day 90, with at least 5% clicking through to 'make yours.'
- Quality gates, published in DiagramBench:
- 50-node map in 1 build plus ≤2 fix rounds at p90.
- Repair tokens ≤1/3 of Archify's on the same repos.
- 0 node or label overlaps.
- Minimum label ≥11 px at default zoom on every level.
- ≥80% of edges verified on Atlas repos.
- Lockfile: a single-node edit moves under 10% of boxes.
- Community: 25 external contributors and 10 Atlas maps claimed or corrected by their maintainers by day 90. The benchmark cited or linked by at least 3 other tools or labs.
- Money (secondary): $100-400/mo from sponsors by day 90; 10 Cloud beta orgs, at least 5 paying by day 150; $1-3k MRR at 12 months is the base case.

### premises challenged

- The user: 'AI can't draw large diagrams, so build a better renderer.' No renderer makes a large system readable as one picture: not ELK, not TALA, not yFiles. Glyphic's own renders prove it (hero labels 10.9 px; n200 at 2 px across 7x12 screens) [codebase §3-4; tech §1]. Large is a navigation problem, so the product is a zoomable map, not a bigger diagram.
- The user: 'the model can draw small and medium diagrams.' Partly true, but incomplete. The models draw them well enough to look good, but at repair-loop cost (Archify #214, about 25 rounds) and with invented edges (R2ABench) [market table; tech §0.4]. Correctness and cost, not drawing, are the measurable gaps at every size.
- The lead's pivot, 'architecture diff for PR review' as the product: rejected as a front door.
- At least 8 entrants shipped in 2026: pr-lens 2k★, CodeBoarding, Groma, ArchLens, Eraserbot, CodeRabbit, Greptile, gh-aw.
- drawio-skill already gives away the 'paid' policy checks.
- Practitioners managing review load don't ask for diagrams (HN 48329446).
- CodeSee Review Maps shut down [market §3; demand §3].
- Actions also spread slowly: one repo at a time, with trust gates.
It returns in month 2-3 as one view of the stable map, and as a viral loop.
- The lead: 'Archify ~19k stars.' It has 83,979★. The gap is about 8,000x, so a head-on 'another diagram skill' launch loses. Enter only on the job Archify explicitly skips (auto-layout and zoom), and offer to be its engine.
- The repo: '18 diagram types' as a selling point. There are really 4 render paths, and breadth doesn't separate the winners (Archify has 10 types, diagram-design 44) [codebase §5; market #1]. Ship one thing: the system map.
- The repo: an MCP server as the distribution vehicle. Skills beat MCP render tools by an order of magnitude. AWS replaced its diagram MCP with a skill, and Excalidraw, draw.io and Lucid own the incumbent MCP slots [demand §1.1; market #6].
- The repo: PNG as the output. Beyond about 30 nodes it is 26k px, 15 MB, 129 s and 5.6 GB, and models downscale it until they can't read it [codebase §3]. HTML is for humans, a text defect report is for agents, and PNG is only a thumbnail.
- The repo's claims: 'byte-identical,' 'safe by construction,' 'any Google Font,' 'validated before it draws.' All are false or overstated [codebase §5]. A distribution-first launch that gets audited by thousands of eyes cannot carry them; fix or delete each one before launch.
- The repo: the FSL license as protection. With no adoption, there is nothing to protect. It blocks embedding by other skills, which is the cheapest distribution there is, and selling layout already failed for Terrastruct [market #4].
- The usual plan: 'launch on HN and dev.to.' Archify got 1 HN point and still reached about 84k★. 2026 diagram tools spread on X, in Chinese and Japanese developer media, on skills.sh and GitHub Trending [demand §1.7].
- Market and tech reports: 'evidence links differentiate.' They are now table stakes: Archify, openflowkit and Lucid Train all have them [market #7]. They are necessary, not sufficient, so make verification mandatory and visible as a count, and differentiate on zoom and layout.
- Tech report: 'build the verified model and stability lockfile first because that's the moat.' Directionally right, but in the wrong order for distribution. Nobody adopts an invisible model. Ship the visible zoom map first, and let verification and stability compound behind an installed base.
- The user's goal: 'stars become money.' ChartDB has about 23k★ and $1K total revenue; Kroki runs on donated servers [market #5]. Plan for sponsorship plus a small private-repo Cloud: $1-3k/mo base case at 12 months, not a salary.

## Strategy (revenue): Glyphic Layout: open-core auto-layout for React Flow and other apps that render generated graphs, with a Sidekiq-style Pro license

### one liner

A drop-in layout engine for React Flow. Edges never cut through boxes, groups nest cleanly, labels fit, and the graph doesn't jump when you or your AI add a node. The core is MIT; a $49/mo Pro license adds stable incremental layout, collapsible groups and a big-graph mode.

### thesis

The user's revised premise is right on the facts but points at the wrong buyer. Models can draw small diagrams, and nobody can make a 150-node single canvas readable [tech §1]. People who draw diagrams for documents will not pay for layout:
- Terrastruct sold TALA to diagram authors and shut down [market insight 4; tech finding 1].
- Structurizr's cloud service died [demand finding 3].
- Mermaid 12 now bundles ELK by default [demand finding 2].

One group still pays real money for layout: developers who put graphs inside their own products. The evidence:
- yFiles survives on roughly €7.1k per developer per year for incremental "from sketch" layout and edge routing [tech §1; market table].
- xyflow became ramen-profitable selling React Flow Pro at $169–289/mo per org [market insight 5].
- GoJS is still shipping commercial releases (4.0.5, modified 2026-10-02) [npm registry check].

React Flow, the default free node-UI stack (38.7k stars, ~11.2M weekly downloads, unverified), lists "not a layout or diagram generator" as its gap [market table].

**Why the gap lasts as models improve.** A graph inside a product is not drawn once. It is data that changes on every render: users edit it, and increasingly an AI generates or rewrites 10–50 nodes at a time [BK, unverified]. That graph needs layout that is deterministic, fast (under a second in a worker) and stable across edits. Stability needs state and algorithms. A smarter model cannot guarantee it, because models regenerate from scratch [tech §3 bet b, durability up].

**Where Glyphic fits.** No open-source engine offers stable layout for nested orthogonal graphs [tech §1, "Gap" row]. The only product that does is closed and costs thousands per developer. That leaves the startup segment below yFiles unserved, and a solo developer can fill it. Glyphic's real asset is ELK plus routing post-passes, measured at 0 edges through unrelated boxes from 20 to 200 nodes [codebase §3]. It is aimed at the wrong user today: PNGs for agents, saved to the Desktop. Point it at the embedders who already pay for graph UI.

### target user

**Primary persona.** A senior frontend or full-stack engineer at a B2B SaaS company of 10–300 people. The company ships a node-based UI built on React Flow:
- an AI workflow or agent builder
- a data-lineage or pipeline view
- a service or infrastructure topology map
- a security attack-path or IAM graph
- a CI or ML pipeline viewer

Their graphs are generated by code or by an LLM, not placed by hand. They run 30–500 nodes with nested groups. This engineer has already lost sprints to elkjs options, dagre, edges that ignore ELK's routes, and bug reports like "the graph jumps when I add a step" and "arrows go through boxes". Their company already pays for React Flow Pro, or can put $49–199/mo on a card without procurement. This person is the buyer.

**Secondary (free, for distribution).**
- Authors of agent skills (Archify- and diagram-design-style) and people using coding agents. They need a deterministic "layout hands" call so the agent stops placing coordinates by hand and burning repair rounds.
- Platform teams building internal service catalogs.

**Explicitly not targeted.**
- Diagram authors writing docs. They won't pay, per Terrastruct and ChartDB.
- Educators and non-technical users [demand, graded D/F].
- PR reviewers. That space is crowded, see below.

### job to be done

"My product renders a graph that code or an AI just generated or changed. Lay it out in under a second: edges don't cross boxes, groups nest, labels fit, and nothing the user already understood moves. I don't want to become a graph-drawing expert or pay yFiles prices to get there."

### evidence of demand

**Payment behavior from embedders (strongest evidence).**
- React Flow Pro charges $169/$289 per month per org and became "ramen profitable within a few months" [market table and insight 5].
- yFiles costs about €7,100 / $8,500 per developer per year (about €42.6k per site), and its headline features are incremental hierarchical layout, edge routing and grouping [tech §1; market table, yFiles row].
- GoJS 4.0.5 sits under a commercial license and was modified 2026-10-02, so the commercial diagram SDK market is active [npm registry, checked today].
- Background analogues, unverified this session: AG Grid, MUI X Pro, Highcharts and Sidekiq Pro all sell a commercial tier on top of a free or OSS core to developers who embed it [BK].

**Product gap.**
- React Flow's listed weakness is "not a layout or diagram generator" [market table].
- "No good open-source stable layout for compound, orthogonal architecture graphs. ELK has the hooks but no product-level solution" [tech §1, stable/incremental row]. Stable layout is the one bet rated durability-up with a medium–high moat [tech §3 bet b].
- @tisoap/react-flow-smart-edge 5.0.0 (MIT, "Custom React Flow Edge that never intersects with other nodes", modified 2026-08-16) exists, and so does a separate "maintained fork", @jalez/react-flow-smart-edge. People keep re-solving obstacle-avoiding edges in React Flow [npm registry, checked today].

**Technical asset that fits.**
- 0 edges through unrelated boxes at every size from 20 to 200 nodes.
- Detour ratio median 1.00.
- ELK plus post-passes takes 86–776 ms from 20 to 200 nodes, and the post-passes alone take 46 ms at 200 nodes.
- SVG output is byte-identical across processes for graph diagrams.

All four figures are from [codebase §3]. React Flow measures node sizes in the DOM, which sidesteps the heuristic text metrics weakness [codebase §2].

**Distribution lever (free side).**
- The skill winners hand layout to the model and pay for it: Archify #214 took ~25 repair rounds for 8 nodes, #22 and #66 complain about token burn, #61 shows overlaps passing validation, #248 collapses edges, #660 has corridor conflicts [market insight 2–3; demand finding 5].
- "A deterministic layout hands library for skill authors" is listed whitespace, and beautiful-mermaid reached 11k stars as an embedded renderer [market whitespace 2].

**What is missing, stated honestly.**
- None of the four reports measured React Flow teams' layout pain directly. The demand report graded "agent/LLM-app builders needing a diagram API" D, but that is a different persona (an API, not an embedded layout library).
- My own web searches were all refused because the session's search budget was exhausted.

So the paying persona is a strong hypothesis supported by payment precedent, not measured pain. That is why the plan opens with a 3-week validation gate before any Pro code.

### why now

1. **Layout for diagram authors became free in September 2026.** TALA went MPL-2.0 [tech finding 1] and Mermaid 12 ships ELK by default [demand finding 2]. That kills every author-facing layout business, but it leaves embedders' stability and routing needs exactly as unserved as before.
2. **AI now writes the graphs inside products.** Agent and workflow builders generate and rewrite whole subgraphs from prompts [BK, unverified]. Models fail at placing large or complex graphs (the user's own revised premise) and cannot guarantee continuity across edits [tech §3 bet b]. A machine-placed graph needs a machine layout engine.
3. **AI coding agents make basic layout free but leave the hard part unsolved.** An agent can wire elkjs into React Flow in an hour. It will not deliver "add one node, nothing else moves". Glyphic's own ELK setup moves 81–100% of boxes on a single edit [codebase §3]. The hard part is exactly what teams will pay for.
4. **The price gap is wide open.** yFiles is around €7k per developer, elkjs and dagre are free (@dagrejs/dagre 3.1.1 updated Aug 2026; elkjs 0.12.0 Jul 2026, per npm), and nothing serious sits in between at $49–199/mo.
5. **Glyphic's current shape is clearly lost.** It has ~10 stars and ~79 weekly downloads [demand finding 1], and plain MCP rendering is commoditized [market insight 6]. A pivot costs almost nothing in existing goodwill.

### wedge v1

**Six weeks to a public launch. Pro code starts only after the week-3 validation gate passes.**

**1. @glyphicjs/layout 2.0 (MIT): the engine.**
- Pure TypeScript; runs in the browser, a web worker and Node.
- Small, versioned graph schema:
  - nodes `{id, width, height, parentId?, pinned?}`
  - edges `{id, source, target, sourceHandle?, targetHandle?, label?}`
  - options `{direction, spacing, preset}`
- Output: node x/y, group boxes, edge polylines, and label anchors.
- Ported ELK config and post-passes: label-aware sizing, nested groups via INCLUDE_CHILDREN, overlapping-edge separation, jog collapse.
- Strict validation that returns model-fixable messages: duplicate ids, group cycles, a node grouped inside itself, dangling parents, unknown endpoints, with did-you-mean suggestions. This fixes the silent-vanish and raw Java exception bugs [codebase §5].
- Deterministic output, golden tests, and the 13 ported regression cases.

**2. @glyphicjs/react-flow (MIT): the flagship.**
- `useGlyphicLayout(nodes, edges, opts)`:
  - uses React Flow's DOM-measured node sizes, so no font heuristics;
  - runs in a worker;
  - animates position changes.
- `<GlyphicEdge>` draws the actual routed polyline with rounded corners, correct arrowheads (fixes the arrow:"back"/"both" bugs [codebase §2]) and a label with a background, pinned to its segment.
- Group/parent node support and a "Tidy up" control.
- Copy-paste templates:
  - AI workflow builder (Next.js + Vercel AI SDK + React Flow + Glyphic)
  - data lineage, 150 nodes
  - microservice map with nested groups
  - CI pipeline

**3. Public benchmark and docs site** (replaces the glyphic.web.app playground).
- Engines compared: dagre, elkjs defaults, react-flow-smart-edge, Mermaid-ELK, D2/TALA and Glyphic.
- Graph sizes: 20, 50, 100 and 200 nodes.
- Metrics: edges through boxes, crossings, edges against the flow, minimum label px at 1920 wide, ms, and displacement after inserting one node.
- Seeded from the codebase report's harness (scratchpad bench/gen.mjs, stability.mjs, metrics2.mjs) and published openly [tech §3 bet f].

**4. Pro v0, private beta for 3–5 design partners.**
- "Stable mode": a layout lockfile (JSON of per-node layer, order and position) plus incremental relayout that keeps unchanged nodes in place and inserts new ones into free space. Pinned nodes become soft constraints instead of today's bypass of ELK.
- Collapse/expand groups with aggregated edges and counts.
- Gate: on the n50 benchmark, inserting one node moves 10% or fewer of existing nodes by more than 20 px, while keeping 0 edges through boxes. Today the figure is 100% [codebase §3].

**5. Pricing page and checkout** through a merchant of record such as Polar or Lemon Squeezy [BK], with a founding-customer offer.

**Stretch for weeks 6–8:** a headless `glyphic` CLI plus an agent skill (`npx skills add MS-Teja/glyphic`). The agent writes graph JSON and gets back SVG or self-contained HTML, a thumbnail of at most 2576 px for self-checking, and a text defect report (overlaps, crossings, minimum label px). Defects go back to the model as text because vision checks fail on dense diagrams [tech finding 5].

### keep from repo

- packages/core/src/layout/elk-adapter.ts: the ELK option set, label-aware sizing, nested-group handling (INCLUDE_CHILDREN), overlapping-edge separation and jog-collapse post-passes. Port the knowledge and its 13 regression tests; rewrite the code (magic numbers, `any`, duplicate label heuristic) [codebase §2]
- packages/core/src/layout/validation.ts: unknown-id errors with Levenshtein did-you-mean
- packages/schema/src/format-error.ts: short, de-duplicated validation errors (now aimed at both developers and agents)
- packages/core/src/math/geometry.ts: border clipping for diamond, hexagon and cylinder shapes (used by GlyphicEdge and the headless SVG)
- packages/core/src/scene/scene-graph.ts and render/strategies/svg-renderer.ts: the clean scene to SVG path, for the headless CLI and skill
- Arrow-marker and edge-clipping logic from render/strategies/scene-builder.ts; rewrite the rest
- render/rasterizer.ts (resvg), only for skill thumbnails of at most 2576 px, with a bundled font and loadSystemFonts:false [codebase §6.3]
- The benchmark and stability scripts written by the codebase researcher (scratchpad bench/gen.mjs, bench.mjs, metrics2.mjs, stability.mjs), as the seed of the public benchmark and a CI regression gate
- Brand, GitHub repo MS-Teja/Glyphic, the @glyphicjs npm scope, and the pnpm/turbo/Biome/vitest tooling. The user is the sole contributor (50 of 50 commits), so relicensing is clean

### drop from repo

- The 12 non-graph diagram types and their code: flow-svg.ts, data-viz-svg.ts, time-adapter.ts (gantt, which depends on timezone and has an off-by-one-day bug), flow-adapter.ts, data/treemap/chrono adapters, sequence-adapter.ts. Type breadth does not separate winners [market insight 1; codebase §2]
- The canvas type and the x/y escape hatch (canvas-adapter.ts, canvas-svg.ts): one coordinate bypasses ELK and puts every other node at (0,0). Pinning comes back as a Pro soft constraint
- core/react-flow/adapter.ts as written: it discards ELK routes and leaks internal nodes. It is replaced by a new flagship package, not removed as a direction
- @glyphicjs/mcp-server: deprecate on npm with a pointer. Removes Desktop PNG saving, the 7k-token tool schema and the 14k-token get_schema [codebase §3; market insight 6]
- The 17-variant Zod union in schema/diagram.ts (metadata: record(any), unresolvable icon examples), replaced by a small versioned graph schema
- text-metrics.ts heuristic Inter width table (React Flow measures nodes in the DOM; headless uses real font metrics)
- frame.ts aspect padding, the default drop shadow (7–23x slower PNGs) and the always-on 2x PNG in pipeline.ts
- The FontAwesome dependency (25 MB) and the unused d3-shape dependency
- The regex SVG sanitizer and raw-SVG input (it can be bypassed: javascript: hrefs, external images) [codebase §5.7]
- The FSL-1.1-ALv2 license on core
- False or overstated README claims: '18 types', PNG 'byte-identical', 'any Google Font', 'safe by construction', React Flow 'interactive', Mermaid 'no MCP', the absent self-hosted HTTP API, and the 15–25 MB bundle figure (it is 65 MB) [codebase §5]
- smithery.yaml and MCP-directory listings as the primary surface

### rebuild or evolve

Rebuild as Glyphic 2.0 in the same repo, keeping the name, npm scope and git history. Create clean new packages (`layout`, `react-flow`, later `svg`/`cli`/`pro`), port roughly 1,900 lines of knowledge (ELK passes, validation, geometry, SVG) with their tests, and delete everything else in one "2.0 reset" PR.

Why not evolve the current pipeline:
- It is shaped around diagram types and PNG output, which is the wrong axis.
- Its React Flow export is upside down: it discards ELK's edge routes.
- Its claims would not survive a B2B buyer reading the code.

Why not start a new repo or brand: there is no equity to protect and no reason to lose the history.

Estimated cost: about 2 weeks for the engine port with the agents' help, 2 weeks for the React Flow package and docs, and 4–8 weeks of uncertain R&D for stability. Stability is the real work and the real product.

### distribution plan

**Principle.** Go where embedders already look (the React Flow ecosystem, search, templates). Use the agent-skill world only for stars and credibility. The user's past channels (HN, dev.to) did little for this category. 2026 diagram tools spread through X GIFs, skills.sh, GitHub Trending and Chinese and Japanese developer communities [demand finding 7; market insight 1].

**Path to the first 1,000 stars**, about 4 months:

1. **Benchmark launch, week 6, target 150–400 stars.**
   - Show HN: "We laid out 1,000 graphs with dagre, elkjs, smart-edge, Mermaid-ELK, TALA and Glyphic."
   - r/reactjs and r/javascript.
   - Submissions to JavaScript Weekly, React Status and Bytes.
   - The hero asset is a 15-second side-by-side GIF: the same 'add one node' edit, with dagre reshuffling and Glyphic holding still.
   - No benchmark covers graphs above ~15 nodes, so this fills a real gap and earns links [tech §3 bet f].
2. **React Flow ecosystem, ongoing.**
   - Open a PR adding Glyphic to the xyflow docs' layouting options, and offer xyflow co-marketing as a complement to their Pro examples [BK that the page exists].
   - Answer every GitHub Discussions and Discord thread about auto-layout or edges through nodes with a working StackBlitz.
   - Get listed in awesome-react-flow lists.
   - Ship Svelte Flow and Vue Flow adapters by day 90 (cheap, and more reach).
3. **Templates.** Publish an "AI workflow builder" Next.js starter (React Flow, Vercel AI SDK, Glyphic) to template galleries. It is the most searched use case and demos AI edits without the jump [BK].
4. **Search content.** Four deep posts, each ending in a demo:
   - "react flow auto layout"
   - "react flow edges through nodes"
   - "elkjs react flow example"
   - "why your graph jumps when you add a node"
5. **Skill track, weeks 7–12, +300–500 stars.**
   - `npx skills add MS-Teja/glyphic`, listed on skills.sh.
   - Offer Archify and diagram-design an opt-in auto-layout pass via PR, quoting measured savings in repair rounds and tokens against their own issues (#214, #61, #248, #660). One merge is worth more than any launch post.
6. **Second launch, about day 75.** "Stable layout: add 20 AI-generated nodes, nothing you knew moves." Post on X, HN, Zenn/Qiita (Japanese) and Juejin (Chinese), using translations from the user's agents.

**First 100 real users** = 100 public GitHub dependents or known production installs, not stars.
- Mine GitHub dependents of @xyflow/react that also depend on elkjs or dagre. Their issue trackers tell you who hurts.
- Contact 50 of them personally with a fix-your-graph StackBlitz built on their own public data shape.
- Offer free Pro to OSS projects (Langflow- and Flowise-class tools are ideal logos) in exchange for a "Used by" mention.

**Viral loop.**
- Mild by design: no watermark inside customers' apps.
- The free skill/CLI HTML output carries a removable "laid out with Glyphic" link.
- The benchmark invites other engines to submit PRs, which brings their audiences.

### monetization

**Model: Sidekiq or AG Grid-style open core. A free MIT core, plus a separate commercial package with features that matter only to companies shipping a product. No hosted service, no LLM inference cost, no customer graph data on the user's servers. Ops burden is close to zero.**

**Tiers**

| Tier | Price | Who it's for | What's included |
|---|---|---|---|
| Free (MIT) | $0 | Everyone | Engine, React Flow/Svelte/Vue adapters, routed edges, groups, validation, CLI/skill, benchmark. One-shot layout must be excellent and free, or adoption dies. |
| Pro | $49/mo or $490/yr per product, unlimited developers | Startups. Priced under typical card-expense thresholds, so no procurement step | Stable mode (lockfile, incremental insert, pinned soft constraints); collapse/expand with aggregated edges; large-graph worker mode for 500–2,000 nodes; live re-route on drag; swimlanes and partitions; email support within 2 business days |
| Business | $199/mo or $1,990/yr | Larger customers | Multiple products, OEM/on-prem redistribution rights, priority fixes, invoices, security-questionnaire answers |

- **Free Pro** for OSS, non-commercial and education users.
- **Perpetual fallback**: if a customer cancels, they keep the last version released while they paid. This lowers buyer risk.
- **Delivery**: a license-gated private npm registry, plus a console notice in development mode only. No runtime phone-home, which embedders hate.
- **Payments**: a merchant of record such as Polar, Lemon Squeezy or Paddle handles global VAT/GST [BK].
- **Founding offer**: the first 20 customers get 50% off for life.

**Why this model and not the others**
- **React Flow Pro** worked because embedders pay and the crust is thin, but it rides 11M weekly downloads. Glyphic rides on top of React Flow to borrow that pool [market insight 5].
- **Sidekiq Pro** is the solo-maintainer template: a per-org annual license, production-only features, no hosting [BK].
- **TALA** failed: it sold layout to authors and closed the engine, which choked D2's adoption [tech finding 1]. The lesson is not to paywall one-shot quality and not to sell to authors.
- **Excalidraw+** needs a 134k-star free editor and carries collaboration-hosting ops. Not available to the user.
- **The tldraw license** (source-available core, ~$6k/yr) only works once you dominate. It would kill a 10-star project [market table].
- **Archify-style README sponsor slots** need virality, so treat them as upside only.
- **ChartDB** shows the counter-evidence: 23k stars, about $1K total revenue, from selling to individuals [market insight 5].

**Twelve-month numbers.** MRR counts annual plans divided by 12.

| Case | Customers at month 12 | MRR at month 12 | Notes |
|---|---|---|---|
| Base | 40 Pro + 5 Business | about $3k | Revenue path: $150–300 by month 3 (design partners on founding pricing), $800–1,200 by month 6, $2.5–4k by month 12. Needs roughly 1,500–2,500 companies on the free tier at a 2–3% company-level conversion. |
| Bear | 10 Pro + 1 Business | about $700 | |
| Bull | 120 Pro + 15 Business | about $8.9k | Glyphic gets recommended in the xyflow docs, or one large AI workflow tool adopts it. |

**Side income, capped to protect focus**
- One tasteful dev-tool sponsor slot on docs and README once docs pass ~5k visitors a month: $100–500/mo.
- A fixed-fee "Integration Sprint" ($2,000, at most one a month, months 2–6, only for prospective Pro customers). It funds early months and teaches requirements.
- GitHub Sponsors: expect pocket change.

**Never charge for** one-shot rendering, SVG output or the skill. Those are commodities [tech §4].

### license

Make @glyphicjs/layout, @glyphicjs/react-flow (plus Svelte and Vue), @glyphicjs/svg, the CLI, the agent skill and the benchmark corpus all MIT. Relicense core from FSL-1.1-ALv2 to MIT at 2.0; the user is the sole author, so this needs no one else's consent. FSL protects nothing at 10 stars and actively deters embedding by skills and products [market insight 4; tech §4].

@glyphicjs/pro ships under a plain commercial EULA:
- licensed per product, unlimited developers
- source included for customers
- perpetual fallback
- free for OSS, non-commercial and education use

Do not put Pro under FSL. FSL allows non-competing production use without payment, so it cannot enforce the license. Keep elkjs (EPL-2.0 / GPL-3.0) as an unmodified dependency rather than a fork. If libavoid-js (LGPL-2.1) is used for live routing, load it as a separately replaceable WASM module.

### moat

**The moat is modest, and that is fine for an indie revenue goal.** The defensible layers, in order:

1. **Stable incremental layout for nested orthogonal graphs.** Pro builds this as the layout lockfile, constrained relayout, insertion into free space and a displacement-metric regression gate. No OSS engine has it; only closed yFiles does, at about €7k per developer [tech §1]. It needs state and months of edge-case work, so a coding agent won't one-shot it, and its value grows as AI edits more graphs [tech §3 bet b].
2. **The regression corpus and public benchmark.** Every customer bug becomes a fixture. The benchmark makes Glyphic the reference that other engines get measured against, which is brand and authority [tech §3 bet f].
3. **Ecosystem position.** Being the layout answer in the React Flow docs, templates and Discord, and the engine inside popular skills, gives search and default-choice lock-in.
4. **Switching cost in customers' persisted lockfiles.** Once a product stores Glyphic layout state for its users' graphs, ripping the engine out means users' graphs move.

**Not a moat:**
- one-shot layout (ELK, dagre and TALA are free);
- edge-avoiding routing on its own (react-flow-smart-edge exists);
- the renderer, WASM, and the number of diagram types.

Year two has an option: the same stable engine is the precondition for the lead's living-map and PR-diff ideas [codebase §6.5]. If those prove out, they get built on an engine that embedders have already paid for.

### competitors and how we win

**DIY elkjs or @dagrejs/dagre with a coding agent.** This is the real competitor. Win on four things: routed edges that are actually drawn (even Glyphic's old adapter threw them away), groups and labels that work out of the box, validation errors you can act on, and stability, which an agent cannot produce in an afternoon. The benchmark quantifies the difference.

**@tisoap/react-flow-smart-edge (MIT, v5 Aug 2026).** It routes each edge separately around nodes and does no placement. Glyphic does placement and routing together, separates parallel and overlapping edges, keeps groups and labels aware, and is deterministic. Position it as "smart-edge's successor when your graph is generated".

**React Flow Pro examples (auto layout, expand/collapse) [BK].** These are examples, not a maintained engine. Present Glyphic as a complement and ask xyflow to recommend it. If they ship an official stable-layout engine, a kill criterion triggers.

**yFiles, GoJS, JointJS+ (commercial SDKs).** Glyphic costs 10–50x less, keeps the developer's existing React Flow UI instead of a proprietary canvas, and has an MIT core. Glyphic loses on enterprise breadth and doesn't fight there.

**@msagl/core (MIT), libavoid-js, @joint/router-avoid (MPL), D2/TALA (MPL).** These are research-grade or engine-only pieces with no React Flow integration. TALA's randomness ("adding just one node can significantly change the diagram") disqualifies it from stable product UIs [tech §1]. Glyphic may use libavoid internally.

**Archify, diagram-design and other skills.** Glyphic doesn't compete with them; it becomes their optional layout engine.

**PR-diff tools (PR Lens, CodeBoarding, CodeRabbit, Groma, ArchLens, Eraserbot) and repo-wiki tools (DeepWiki, Code Wiki).** Different markets, deliberately avoided.

### key risks

- The paying persona is unvalidated. No research report measured layout pain among React Flow product teams, and this session's web searches were refused. The evidence is payment precedent (React Flow Pro, yFiles, GoJS), not observed demand for this product. Mitigation: the week-3 interview and pre-pay gate before writing any Pro code.
- Stability may be technically hard or impossible to do well on ELK. Today one edit moves 81–100% of boxes, and ELK's interactive and choice-constraint modes were untested [codebase §3, §6.5; tech §3 rates it medium feasibility, 3–5 months]. If stable mode fails the displacement gate, the Pro tier loses its core reason to exist.
- Platform risk from xyflow. They already monetize layout examples in Pro [BK] and could ship an official engine. There is also the risk of being seen as freeloading on their ecosystem. Mitigation: approach them early as a complement and partner; keep the engine framework-agnostic (Svelte, Vue and headless adapters).
- Coding agents commoditize the free tier and lower willingness to pay. If 'good enough' DIY layout satisfies most teams, conversion falls below 1%.
- Free substitutes keep improving: react-flow-smart-edge v5, @dagrejs/dagre 3.x, MSAGL, TALA under MPL, and Mermaid's ELK work.
- Selling to businesses as a solo maintainer: support load, security questionnaires and procurement at the Business tier; one demanding customer can eat the week. Mitigation: published support boundaries, and Business only by invoice and annual billing.
- Distribution failure repeats. The user's earlier launches got little traction, and the plan depends on being visible in the React Flow ecosystem and on a GIF landing on X.
- Identity drift: leaving 'AI diagrams' gives up the agent-skill star wave. Mitigation: the free skill track, and pitching the product as 'layout for graphs that AI generates'.
- License-compliance leakage: an honor-system commercial npm package will be used without paying by some companies. Accept this as the Sidekiq/AG Grid tradeoff; don't add DRM.
- Revenue ceiling: even the bull case (about $9k MRR) is a side income, not a company. That matches the user's stated goal, but it should be said plainly.

### kill criteria

- Week 3 (validation, before any Pro code): contact 30 or more React Flow product teams. If fewer than 10 confirm recurring layout or stability pain, or fewer than 3 will pre-pay founding pricing ($245/yr) or commit as design partners, abandon the Pro track. Fall back to an MIT-only engine plus skill and benchmark with no revenue goal, or hand over to another strategy lens.
- Week 8 (technical gate): if stable mode cannot keep single-node insertion at 10% or fewer of existing nodes moving more than 20 px on n50 (20% or fewer on n100) while keeping 0 edges through boxes, drop the stability promise. Re-scope Pro to collapse plus big-graph mode only, and re-run the pricing test.
- Month 4: fewer than 300 stars and fewer than 1,000 weekly npm downloads of @glyphicjs/react-flow means distribution has failed. Freeze Pro feature work and spend the next 6 weeks only on ecosystem placement; if still flat, stop.
- Month 6: fewer than 5 paying organizations, or under $300 MRR. Stop selling, open-source Pro under MIT, and keep the project as a portfolio and hobby piece.
- Month 12: under $1,000 MRR. Stop investing in revenue features, and keep only maintenance at 2 hours a week or less.
- At any time: if xyflow ships an official stable-layout or edge-routing engine inside React Flow or React Flow Pro, pivot to framework-agnostic or headless positioning (Svelte, Vue, Cytoscape, server-side) within a month, or wind down Pro.
- At any time: if support exceeds 6 hours a week for 4 consecutive weeks below $2k MRR, raise prices or drop the Business tier.

### roadmap 90 days

- Days 1–5: Reset. Publish a short public post-mortem ('what I got wrong about AI diagrams') and open the 2.0 reset PR that deletes non-graph types, canvas, MCP server, FSL and the false claims. Relicense to MIT. Deprecate @glyphicjs/mcp-server on npm. Put up a landing page with pricing and a design-partner form.
- Days 1–21 (in parallel): Validation. Pull GitHub dependents of @xyflow/react that also use elkjs or dagre, read their layout issues, contact 30–50 teams with a personalized StackBlitz fix, and run 10 calls. Gate: at least 10 confirmations and at least 3 pre-pays or design partners.
- Days 1–14: Port the engine to @glyphicjs/layout 2.0: small graph schema, ELK config and post-passes, strict validation (duplicates, group cycles, dangling parents), determinism tests, the 13 regression cases, and a worker build.
- Days 15–35: Build @glyphicjs/react-flow: useGlyphicLayout with DOM-measured sizes, GlyphicEdge with real routes, labels and correct arrowheads, group nodes, animated transitions, Tidy-up control. Write 4 templates, including the AI workflow builder.
- Days 25–42: Build the benchmark on the codebase researcher's harness (dagre, elkjs, smart-edge, Mermaid-ELK, TALA and Glyphic at 20/50/100/200 nodes; crossings, edges through boxes, displacement, ms). Launch the docs site with live demos.
- Day 42: Launch 1. Show HN, r/reactjs, X GIF, JavaScript Weekly, React Status and Bytes. Open the xyflow docs PR and post in React Flow Discussions. Target 150–400 stars and 20 production dependents.
- Days 42–70: Pro stable-mode R&D with design partners: lockfile format, constrained relayout (ELK model order and interactive constraints), free-space insertion, displacement gate in CI. Then collapse/expand with aggregated edges. Week-8 technical kill check.
- Days 56–75: Release the headless CLI and agent skill (SVG/HTML, a thumbnail of at most 2576 px, a text defect report). List on skills.sh. Offer opt-in auto-layout PRs to Archify and diagram-design, with measured repair-round and token savings.
- Days 70–90: Pro general availability on the private registry with founding pricing. Ship Svelte Flow and Vue Flow adapters. Launch 2: 'Stable layout: add 20 AI nodes, nothing moves', with Zenn/Qiita and Juejin translations.
- Day-90 targets: 500+ stars, 2,000+ weekly downloads of @glyphicjs/react-flow, 25+ public dependents, 5–10 paying organizations, $300–600 MRR, support at 3 hours a week or less.

### success metrics

- MRR: $300–600 by day 90, $1,000 by month 9, $3,000 (base case) by month 12; bull case $8k+
- Paying organizations: 40+ by month 12; logo churn under 3% a month; at least 30% of revenue on annual plans
- Free-to-paid conversion among identifiable company dependents: 2–3% or more
- Adoption: 10,000+ weekly npm downloads of @glyphicjs/react-flow and 150+ public GitHub dependents by month 12 (rank these above stars)
- Stars: 1,000 by about month 4 and 2,500 by month 12 (secondary)
- Quality gates enforced in CI and published: 0 edges through unrelated boxes at every benchmark size; single-node insertion moves 10% or fewer of nodes by more than 20 px on n50 and 20% or fewer on n100 (baseline today: 81–100% [codebase §3]); 100-node layout under 500 ms in a worker
- Ecosystem placement: listed in xyflow's layouting docs or templates, and at least one popular agent skill offering Glyphic as its layout engine
- Ops: support at 4 hours a week or less on average; zero hosted infrastructure beyond the docs site and the license registry

### premises challenged

- The user's original premise, 'AI can't draw diagrams', is the wrong axis. Small diagrams are solved and huge ones are unreadable for humans [tech §1–2]. The money question is who pays for layout, and the answer is developers embedding graphs in products, not diagram authors.
- Market insight 4, 'selling a better layout engine has not sustained a company', holds for authors (Terrastruct, Structurizr cloud). It does not hold for embedders: yFiles has survived for decades at about €7k per developer, GoJS was still releasing in Oct 2026, and React Flow Pro is ramen-profitable. The buyer, not the product category, decided those outcomes.
- The lead and codebase report said 'the React Flow export has no consumer, drop it'. The adapter as written is wrong, but React Flow is the best buyer pool and distribution rail Glyphic has. It is the consumer to rebuild for.
- The lead's pivot to an architecture diff for PR review as the paid product is wrong. At least 6–8 free or bundled competitors exist (PR Lens 1.96k stars, CodeBoarding, Groma, ArchLens, drawio-skill's free policy checks, CodeRabbit and Greptile diagrams), CodeSee died, and practitioners don't ask for diagrams [market §3; demand quotes]. It needs hosted state and LLM costs, which mean ops burden for a solo developer.
- The tech report's moat, a hosted, verified living system model, may be the most durable idea, but it takes 6+ months, needs hosted state and has no proven buyer. That makes it a poor 12-month indie-revenue path. Let embedders fund the stability engine it depends on first.
- The demand report's #2, compliance-grade SOC 2 diagrams from infrastructure-as-code, is weak for a subscription. It is an annual chore, typical startup infrastructure diagrams are small enough for models to draw, and Hava, Cloudcraft and Lucidscale connect to the live cloud.
- The repo treats 18 diagram types, an MCP server and PNG output as the product. They are 4 render paths, the MCP slot is commoditized by official servers (AWS even replaced its MCP with a skill), and PNG is the wrong artifact beyond about 30 nodes [codebase §5–6; market insight 6; demand finding 1].
- The repo says FSL protects the business. At 10 stars it protects nothing and blocks embedding, so relicense to MIT and sell a separate Pro package.
- The repo says large diagrams fail because of edge routing. Routing is fine (0 edges through boxes); placement, group-level cycles and stability are what break [codebase §6.1]. For products, the fix is collapse/expand plus stable positions, which become the Pro features.
- The lead's assumption that stars are success fails a counter-test: ChartDB has 23k stars and about $1K total revenue [market insight 5]. Track production dependents at companies and paying organizations.
- The lead's facts were stale: Archify has about 84k stars (not ~19k), Terrastruct has shut down, TALA is open source, and Structurizr cloud reached end of life on 2026-09-30 [market, method caveats].
- Several repo claims are false and would fail a B2B buyer's code review: PNG 'byte-identical' (0 of 5 gallery PNGs reproduced), 'validated before it draws' (nodes silently vanish), and 'safe by construction' (sanitizer bypass) [codebase §5]. They must be fixed or removed before charging anyone.

## Strategy (contrarian): Truemap (working name): stop generating diagrams and start testing them. The architecture diagram already in a repo becomes a check that coding agents have to pass.

### one liner

Truemap is CI for your architecture diagram. It checks every arrow in your README's Mermaid diagram against the actual code, comments on the PR when a change makes the diagram wrong (with file:line evidence), and gives your coding agent the patch to fix it.

### thesis

Start from first principles: a diagram is only worth something if it is true, and people only read it when it is current. The reports show that drawing is now commoditized from every direction:
- Small and medium diagrams look fine when models draw them (tech §2).
- Chat apps render visuals natively: Claude since Mar 2026, ChatGPT Intelligent UI since Oct 7 2026 (demand #4).
- Layout engines are free: Mermaid 12 ships ELK as the default (demand #2), TALA went MPL-2.0 (market #4, tech #1), and beautiful-mermaid is MIT (market table).
- Large single-canvas diagrams cannot be fixed by anyone, because the limit is human perception (tech §1). Glyphic's own renders at 50 nodes and up confirm this (codebase §4).
- Selling the drawing step has failed repeatedly: Terrastruct, Structurizr cloud, CodeSee (market #4).

What is not commoditized is truth over time:
- Models get the boxes right and the arrows wrong. Invented edges are the main structural failure in R2ABench (tech #4).
- The top complaint about AI diagrams is that they are wrong, not ugly (demand #6).
- Keeping docs current is the #1 architecture-documentation problem in IcePanel's 2025 survey, and 56% of teams report stale docs in vFunction's (demand §3).

Two structural reasons keep this gap open as models improve:
1. A generator cannot certify its own output, so a verifier has to be independent and deterministic (tech §4).
2. Drift grows with code velocity, and agents are pushing velocity up. PR size is up 154% and review time up 91% (Faros, demand §3). Architecture docs are now also read by agents, through AGENTS.md/CLAUDE.md-style context [BK, unverified]. A stale diagram used to be harmless; now it misleads the agent that writes the next PR.

The key insight is that a diagram is the only part of a team's docs that makes structured, machine-checkable claims: these nodes exist, and A depends on B.

Software engineering research solved the core computation 30 years ago with "reflexion models" (Murphy, Notkin & Sullivan, 1995) [BK, unverified]. You take a high-level model and a mapping to the source, then compute three outcomes:
- convergences: drawn edges the code confirms;
- divergences: dependencies in the code that the diagram doesn't show;
- absences: drawn edges the code doesn't confirm.

It never spread because humans had to write and maintain the mapping by hand. LLMs are now good at semantic grouping (tech bet c), so they can draft the mapping cheaply, while the verdict stays deterministic. That combination did not exist before 2025–26.

So the move is not to build another generator against 84k-star Archify and 56k-star diagram-design. Build the referee, and make it work on everyone's diagrams, theirs included.

### target user

PRIMARY: the tech lead or staff engineer of a 5–50-engineer product team, or the maintainer of a 1k–50k-star OSS repo.
- Their repo has a Mermaid flowchart/C4 diagram in README.md, docs/ or ARCHITECTURE.md.
- Coding agents (Claude Code, Codex, Cursor, Copilot) now write a large share of the PRs.
- Typical stack: a TypeScript or Python monorepo with docker-compose.
- They know the diagram they drew last spring is partly wrong, and they review more AI-written PRs than they can read deeply (demand §3: review time +49% to +91%).
- Persona sketch: "Priya". About half of her team's PRs are agent-authored. Last month an agent made billing talk to the auth database directly, and nobody noticed for three weeks.

SECONDARY, in order:
(a) Architecture-as-code users (LikeC4 at 5.9k stars, plus Structurizr users left without hosting after the cloud EOL on 2026-09-30, market table) who want their model checked against the code, not just rendered.
(b) Users of AI doc generators (Archify, DeepWiki, Code Wiki, gitdiagram) who need to know which arrows to trust (demand §3: "a confidently wrong architecture diagram is worse than no diagram at all").
(c) Later, as a paid add-on: the engineer who owns SOC 2, ISO or PCI evidence and needs a dated system or data-flow diagram backed by evidence. Demand ranked this "#2" (demand §4).

NOT targeted:
- LLM-app builders who want a diagram API (graded D, demand §2).
- Educators.
- Non-technical users.
- People who want prettier pictures.

### job to be done

"When the code changes, often because an agent wrote it, tell me in the PR, before merge, whether our architecture diagram is still true. Show exactly which arrows broke and which new dependencies aren't drawn, each with the file:line that proves it. Give my agent a minimal patch, either to the diagram or to the code. That way the humans and agents reading our docs aren't misled, and agents can't quietly add a dependency our architecture doesn't allow."

Secondary job: "Tell me which arrows in this AI-generated diagram I can trust."

### evidence of demand

WRONGNESS is the real pain:
- R2ABench (Apr 2026, 68 projects): components are identified well, edges are recovered poorly, and "invented edges are the main structural failure" (tech #4, tech §2).
- Accuracy complaints across tools (demand §3):
  - DeepWiki: "hallucinating pretty convincingly", "the high-level compilation pipeline diagram is wrong" (HN 45002092).
  - GitDiagram: "a connection in the diagram that doesn't exist in the codebase" (HN 42521769).
  - Archify: "a confidently wrong architecture diagram is worse than no diagram at all" (LinkedIn).
  - Archify #614: unreachable modules drawn as live components (market table).
  - Code Wiki: "only partly right" (The Register, market table).
- Demand #6: "The top complaint about AI diagrams is that they are wrong, not that they are ugly."

STALENESS is chronic (demand §3):
- IcePanel 2025 survey: keeping docs current is the #1 challenge.
- vFunction 2025: 56% have out-of-date docs.
- "they are outdated immediately" (HN 18508284).
- Teamscale: updating diagrams "is often neglected as it does not provide any short-term benefit".

AI-PR REVIEW burden is the strongest measured pain with budget behind it (demand §3, audience (c) graded B):
- Faros: review time +91%, PR size +154%.
- Harvard/Jellyfish: review time +49% with no increase in features shipped.
- Qodo: reviewing AI code is the #1 delivery constraint.

PEOPLE ALREADY PAY FOR CONFORMANCE but write rules by hand. Free rule-checkers (dependency-cruiser, ArchUnit, import-linter, Nx boundaries) exist and are used (demand §4). drawio-skill ships CI architecture rules (market table). Commercial conformance tools (Sonargraph, Lattix, Structure101) exist [BK, unverified]. None of them uses the diagram the team already drew as the spec.

MERMAID-IN-GIT is the format to target:
- diagram-design's own README "recommends Mermaid for diagrams that live in Git and change often" (market table).
- Mermaid is in every model's training data and renders natively on GitHub and GitLab (market table).
- Mermaid 12 made ELK the default (demand #2).

THE SKILL CHANNEL WORKS: Archify got 84k stars, diagram-design 56k, drawio-skill 10k, all distributed through `npx skills add` (market #1).

COUNTER-EVIDENCE I take seriously (see risks):
- In HN 48329446, on PR review load, nobody asks for diagrams.
- Teams turn off CodeRabbit's sequence diagrams (demand §3).
- Blind: "architecture diagrams utterly useless".

I read these as evidence that *decorative* diagrams are a vitamin. A diagram that blocks a bad merge is a different product, but that is a hypothesis, and the week-2 and week-8 gates test it.

NOT VERIFIED: my WebSearch budget was exhausted, so I could not run a competitor scan specifically for "diagram drift checkers". The nearest known signal is ArchDoc PR #22 (drift checks plus an impact comment, market §3). Swimm-style code-coupled docs are a precedent [BK, unverified]. Week 0 must include a GitHub search for direct competitors.

### why now

1. Agents now write both the code and the diagrams.
   - Skills put model-drawn diagrams into millions of repos in 2026: Archify 84k, diagram-design 56k (market #1).
   - Agent-heavy teams merge much larger PRs: +154% (demand §3).
   - Drift is now produced faster than humans can notice it.
2. Agents also read the docs. Architecture docs sit in agent context through AGENTS.md/CLAUDE.md conventions [BK, unverified]; Lucid Train's whole pitch is a spec file for coding agents (market table). A wrong diagram now produces wrong code, not just a confused new hire.
3. Mermaid has become the standard text format:
   - Mermaid 12 (2026-09-10) makes ELK the default (demand #2).
   - GitHub renders Mermaid in Markdown, issues and PR comments [BK, unverified for overlay styling].
   - So the PR comment can show the team's own diagram with overlays at zero rendering cost, and no layout engine is needed.
4. LLMs make the old adoption barrier, the hand-written mapping, nearly free. Models group semantically well (tech bet c), while the check itself stays deterministic. In other words, this technique was not practical before cheap agents.
5. Benchmarks have now measured the failure mode: R2ABench (Apr 2026) and TraversalBench (tech #4, #5). That gives a credible, timely story: "AI draws convincing arrows; here's how many are real."
6. Users are stranded:
   - Structurizr cloud reached EOL on 2026-09-30 (market table).
   - Terrastruct shut down (market #4).
   - Models-as-code users need a reason to keep their model, and "it's tested against the code" is one.
7. The drawing race has been lost, which frees the user. With drawing commoditized (TALA open-sourced in Sep 2026), the only defensible position left is judging what gets drawn.

### wedge v1

Six weeks, and deliberately narrow: one diagram language, a few evidence sources, and no layout engine.

1. `npx truemap check`
   - Discovers ```mermaid flowchart/graph blocks (plus a C4Container subset if time allows) in *.md, *.mdx and *.mmd files.
   - Parses them with a tolerant subset parser into a small Zod IR with stable ids. Golden tests run against about 200 real-world diagrams.
2. Fact extractors, every edge with file:line evidence:
   - JS/TS imports (oxc-parser), aggregated to code units.
   - npm/pnpm/yarn workspace dependencies.
   - Python imports (tree-sitter).
   - docker-compose: depends_on, links, and env vars whose URL or hostname names another service.
   - A curated SDK catalog of about 100 entries that maps external systems (pg→Postgres, ioredis→Redis, stripe, @aws-sdk/client-s3→S3, kafkajs, openai…). The community extends it, so it compounds.
3. Mapping:
   - `truemap init` auto-drafts `truemap.yaml`, mapping each node to globs, units or externals. It fuzzy-matches labels to packages, directories and compose services, reusing Glyphic's Levenshtein did-you-mean code.
   - The bundled agent skill lets the user's own agent refine the mapping, so no API key and no inference cost for the maintainer.
   - The CLI itself never calls an LLM.
4. Reflexion verdicts:
   - VERIFIED: the drawn edge has evidence.
   - UNVERIFIED: drawn, but no static evidence. This is info-level, never "wrong"; it can be acknowledged with `%% truemap: runtime` or pinned to evidence.
   - BROKEN: the evidence existed in `truemap.lock` at the last green commit and is gone now.
   - UNDRAWN: there is a code dependency between mapped nodes that the diagram doesn't show.
   - PHANTOM: the node maps to nothing.
   - Plus a truth score and a coverage score.
5. Output formats:
   - Terse, capped, LLM-fixable text in Glyphic's format-error style.
   - JSON.
   - SARIF, which renders as annotations in "Files changed" (free on public repos; private repos need GitHub Advanced Security [BK]).
   - `--fix`, which emits a minimal Mermaid text patch.
6. GitHub Action:
   - Posts one sticky PR comment that re-emits the team's own Mermaid with linkStyle/classDef overlays: green verified, red dashed broken, orange dotted undrawn. GitHub renders it natively.
   - Includes an evidence table with links and a suggested patch.
   - Warn-only by default.
   - `mode: spec` fails CI on UNDRAWN dependencies: "your diagram is the guardrail; agents can't add a dependency it doesn't allow."
   - Badge JSON for shields.io: "architecture diagram: 14/15 arrows verified".
7. An Agent Skill (open standard; skills.sh; Claude Code plugin; Codex/Cursor):
   - Before coding, read the diagram as architectural constraints.
   - After coding, run `truemap check` and fix the code or propose a diagram patch.
8. The `truemap.lock` evidence snapshot is committed to the repo, which enables "broken since <sha>".

Non-goals for v1: no rendering service, no ELK, no D2/PlantUML/draw.io, no Go/Java, no hosted app, no telemetry. Performance target: under 10 s on a 100k-LOC repo.

The launch asset is built in weeks 5–6: "The Diagram Truth Report 2026" (see distribution).

### keep from repo

- packages/core/src/layout/validation.ts: the Levenshtein closestId and did-you-mean id errors, repurposed to suggest mappings from diagram labels to code units, and for model-fixable mapping errors
- packages/schema/src/format-error.ts: its philosophy and code (terse, de-duplicated, capped at 12 bullets, written so an LLM can fix it in one shot), which becomes the CLI and skill output contract
- The Zod-schema discipline with stable ids, reused for three small versioned schemas: the parsed-diagram IR, the facts graph, and truemap.lock
- Monorepo and release tooling: pnpm workspaces, turbo, biome, vitest snapshot and golden tests, CI, the npm publishing pipeline (codebase §1 says all 236 tests pass cleanly)
- The ELK post-passes in packages/core/src/layout/elk-adapter.ts and their 13 regression tests. They are NOT shipped in the product. Relicense them MIT and upstream them to Mermaid 12's ELK layout and/or beautiful-mermaid, which builds reputation in exactly the community Truemap serves
- Kept in a drawer for month 3 or later: scene-graph.ts, svg-renderer.ts and the resvg rasterizer (bundled font, loadSystemFonts:false), only to render overlay PNGs for Slack and Confluence surfaces that can't render Mermaid
- The benchmark/measurement harness approach from the codebase audit (scratchpad bench/), reused as the at-scale scan harness for the Diagram Truth Report
- The GitHub repo history and the @glyphicjs npm org, kept only so the old packages can be deprecated with a pointer to the new project

### drop from repo

- The 'AI models can't draw diagrams' positioning, and Glyphic as the product brand (about 10 stars, about 79 weekly downloads; demand #1 says there is no brand equity to protect)
- All 12 non-graph types and their adapters and renderers: gantt, sankey, git, timeline, journey, kanban, pie, quadrant, treemap, sequence. Codebase §2 shows they are trivial or buggy, e.g. the timezone-dependent Gantt and silently dropped dependencies
- The 'canvas' type and the explicit x/y escape hatch: one coordinate bypasses ELK and puts nodes at (0,0) (codebase §2)
- The React Flow export: it discards routes, leaks internal nodes, and has no consumer
- The stdio MCP render server: PNG saved to ~/Desktop, inline base64, a 7k-token schema in tools/list and a 14k-token get_schema. The incumbents' official MCPs have commoditized this slot (market #6), and AWS dropped its diagram MCP in favour of a skill (demand #1)
- The 17-variant DiagramInput union schema
- ELK as a runtime dependency of the new product. Stable compound layout is a 3–5 month research build (tech bet b), and Glyphic currently moves 81–100% of boxes on a single edit (codebase §3)
- FontAwesome (25 MB), frame padding, default drop shadows (7–23x slower PNG), the char-width text-metrics table
- The regex SVG sanitizer, together with accepting raw SVG input (it is bypassable, codebase §5.7)
- The FSL-1.1-ALv2 license on core
- Every overstated README claim, retracted publicly: 18 types, byte-identical, validated before drawing, safe by construction, any Google Font, self-hosted HTTP API, the unreproducible benchmarks, 'cheap and intact at scale' (codebase §5). A product whose brand is truth cannot carry them
- The glyphic.web.app playground as a primary surface

### rebuild or evolve

REBUILD as a new product. Carry over about 300–400 lines (validation, format-error, schema discipline) plus the tooling, and treat the rest as sunk cost.

The user's real asset is not the engine. The codebase audit shows routing is already solved and still doesn't make large diagrams readable (codebase §6.1), and the tech report shows engines are a free commons (tech §4). The asset is first-hand knowledge of how LLMs fail at diagrams, plus the habit of writing errors a model can fix.

Concrete steps:
1. Create a new repo and packages (`truemap`, `truemap-action`, a skill repo). The name `truemap` was unregistered on npm as of 2026-10-15 (I checked: registry 404). GitHub org and domain are unverified, so check trademarks before committing.
2. Relicense @glyphicjs/core from FSL to MIT.
3. Upstream the ELK post-passes to Mermaid and beautiful-mermaid.
4. Deprecate @glyphicjs/* on npm with a pointer, then archive MS-Teja/Glyphic.
5. Publish an honest post-mortem, "I built a diagram engine for LLMs. The market went the other way. Here's what I'm building instead." It retracts the overstated claims and doubles as a pre-launch asset.

Don't "evolve" Glyphic into a PR-diff tool or a living map. Both inherit the layout-stability problem the codebase can't solve today, and both enter crowded fields (see premises).

### distribution plan

THE LAUNCH ASSET IS DATA, NOT A FEATURE LIST. The "Diagram Truth Report 2026":
- Scan every public GitHub repo with ≥500 stars that has a Mermaid flowchart/C4 block in README, docs or ARCHITECTURE.md where ≥60% of nodes auto-map to code units. Target 500–1,000 repos.
- Publish per-repo results as open data with an opt-out.
- Candidate headlines, if the data supports them: "X% of drawn arrows have no evidence in the code", "Y% of repos have an undrawn dependency between two drawn components", "median age of a broken arrow: Z months" (from git history).
- Track 2: run the same verifier on public AI-generated architecture docs (DeepWiki and Code Wiki pages, gitdiagram output, Archify output for about 25 well-known repos). This quantifies R2ABench's invented-edges finding on real projects (tech #4).
- This replaces the tech report's proposed *layout* leaderboard. A truth benchmark is newsworthy, aligned with the product, and doesn't make Truemap judge and contestant in a commodity race (tech bet f risk).

CHANNELS, in order:
1. Show HN, "Truemap – CI that fails when your architecture diagram lies", with the report submitted separately a few days later.
2. An X thread built on PR-comment screenshots: red dashed broken arrows on a famous repo's diagram, shown kindly and framed as "diagrams rot, nobody's fault".
3. r/programming, r/ExperiencedDevs, Lobsters, dev.to.
4. Translated posts on Juejin, V2EX and Zhihu, and on Zenn, Qiita and note. These communities amplified the 2026 winners, while HN gave Archify just 1 point (demand #7, market #1).
5. Directories: skills.sh, the Claude Code plugin marketplace, Codex/Cursor/Copilot skill directories, GitHub Marketplace (Action listing), awesome-mermaid and the Mermaid ecosystem/integrations page.

FIRST 100 REAL USERS, defined as public repos running the Action for at least 14 days. These are countable through GitHub code search for `uses: …/truemap-action`, so no telemetry is needed, which fits the truth brand.
- (a) A fix-PR campaign: 30 hand-reviewed PRs to repos from the scan that fix their stale Mermaid, with evidence, and mention the Action as optional. Target ≥10 merged; each merged PR is a public endorsement.
- (b) Integration PRs and issues with complementary projects:
  - Archify: verify its typed-JSON evidence, framed as "Archify draws it, Truemap checks it" (#614 is the motivating case).
  - diagram-design: its git-living diagrams go through Mermaid.
  - oh-my-mermaid (3.1k stars).
  - LikeC4, plus Structurizr DSL support in month 2 for users stranded by the EOL.
- (c) Contributions to Mermaid's ELK layout from Glyphic's post-passes, which make the user a known name in the target community.
- (d) Launch traffic and skill installs.

FIRST 1,000 STARS: one front-page HN hit for the report, plus the zh/ja posts, plus skills directories. Realistic range if the launch lands: 300–1,500 in month 1. If it doesn't land, the kill criteria apply.

VIRAL LOOPS, all visible in public repos:
- The README badge ("architecture diagram: 14/15 verified").
- The sticky PR comment, seen by every contributor to an adopting repo.
- SARIF annotations.
- The skill making agents mention the check in their PR descriptions.

### monetization

Charge for hosted state and convenience, never for checking. This follows tech §4 ("charge for hosted state… not rendering") and the xyflow "thin-crust open core" model (market #5).

FREE FOREVER (MIT): CLI, all parsers, extractors and the SDK catalog, the Action, the skill, SARIF, the badge, the lockfile spec, self-hosting.

TRUEMAP CLOUD (hosted GitHub App, closed service, billed through GitHub Marketplace for procurement-free purchase [BK that paid plans are supported]):
- Public repos: free.
- Team, $39/mo per GitHub org, up to 15 private repos:
  - no workflow YAML;
  - mapping assist included;
  - org dashboard of every diagram's truth score;
  - Slack/Teams alert when a diagram goes stale;
  - a "stale since" history.
- Business, $149/mo: unlimited repos, cross-repo diagrams (a system map whose nodes live in different repos), and checking diagrams that live in Confluence or Notion, where enterprise diagrams actually are. Atlassian Marketplace is the proven OSS-diagram revenue channel (draw.io at about 65k installs, market #5 and whitespace #9) and is a month-6+ option.
- Audit Evidence add-on, $490/yr:
  - a commit-pinned, dated PDF/HTML of the system or data-flow diagram, with per-edge evidence and the change log since the last audit;
  - plus a Terraform plan/state extractor.
  - Built for the SOC 2 "network and/or data flow diagrams that accurately depict the system" requirement (demand §3).
  - Build it only after 3 design partners confirm their auditor wants it. SOC 2 auditors may accept hand-drawn diagrams; that is my judgement, unverified.

SPONSORSHIP: once stars pass about 2k, a README sponsor tier, but from dev-tool sponsors only. LLM-API-reseller referral slots like Archify's would undercut a truth brand. Expect $100–500/mo at 2–5k stars.

REALISTIC NUMBERS:
- Month 6: $0–500 MRR.
- Month 12 base case: $800–2,500 MRR, from 20–50 orgs at a blended ~$50.
- Downside: under $200 MRR. ChartDB has 23k stars and "surpassed $1K collected revenue" in total (market #5).
- Upside: $5–8k MRR if "the diagram is the agents' guardrail" catches on with teams.

This is a side income, not a salary. It needs no inference spend from the user: the CLI is deterministic, and the skill uses the customer's agent.

### license

MIT for everything that ships as code: CLI, parsers, extractors, SDK catalog, lockfile/IR schemas, Action, skill. Also relicense Glyphic core from FSL to MIT so it can be upstreamed.

Reasons:
- Every comparable successful tool is MIT, Apache or MPL (market #4).
- FSL blocks embedding by skills and agents, which is the dominant distribution channel (tech §4).
- A verifier only spreads if other tools can bundle it without asking.

The hosted Truemap Cloud service, which holds history, the dashboard, alerts, Confluence/Notion connectors and audit exports, stays proprietary. Nothing in the OSS is held back to push people toward the paid tier.

### moat

An honest starting point: there is NO moat on day 1. Overlap checks and import graphs can be copied. What compounds:

1. Independence as positioning. Generators (Archify, DeepWiki, Code Wiki, CodeRabbit) are structurally poorly placed to say "our own arrows are wrong". The verifier role becomes more valuable as models produce more code and docs (tech §4: a generator cannot certify itself; truth and time are permanent constraints).
2. Extractor and SDK-catalog breadth. Contributed by the community, one ecosystem at a time (JS/TS, Python, Go, compose, k8s, Helm, Terraform, OpenAPI). This is grindy work that compounds, and it is the part tech bet (g) rates "Medium–High, compounding".
3. Per-repo state: truemap.yaml mappings and truemap.lock evidence history committed in each repo. That creates switching cost, plus the "broken since <sha>" capability, which needs state across commits and which LLM-per-PR tools structurally lack (tech §4 "time").
4. The open dataset and the annual Diagram Truth Report. These are authority and brand, the same lever tech bet (f) identifies, but measuring truth rather than a commodity layout metric.
5. An open evidence-annotation convention (`%% truemap:` comments, a lockfile spec) that other generators adopt. If Archify or LikeC4 emit Truemap-checkable evidence, Truemap becomes the standard and not just a tool.

What is explicitly NOT the moat: layout, rendering, diagram-type count, the viewer, the license.

### competitors and how we win

GENERATORS: Archify (84k stars), diagram-design (56k), DeepWiki and Google Code Wiki, gitdiagram, CodeBoarding, oh-my-mermaid, Lucid Train (market table).
- We don't generate, so we don't compete. We check their output and the human's.
- Win by being the complement: "draw with anything, verify with Truemap."
- Their known failures are our marketing: Archify #614 phantom modules, Code Wiki "only partly right".

PR-DIAGRAM TOOLS: PR Lens (1,964 stars in 8 weeks), CodeBoarding Action, Groma, ArchLens, Logic, gh-aw, Eraserbot (paid), CodeRabbit/Greptile bundled diagrams (market §3, tech #3, demand §3).
- They draw a NEW throwaway picture per PR, often by having an LLM read the diff. Hallucination risk, no persistent truth, layout reshuffles.
- Truemap checks the team's canonical diagram deterministically. Stability comes for free, because the human's text is the layout. The context is the whole system, because the canonical diagram is the context.
- The output is a sentence plus file:line ("this PR adds billing→auth-db at billing/src/x.ts:42, which your diagram doesn't allow"), which reviewers can act on. A picture is optional.

RULE CHECKERS: dependency-cruiser, ArchUnit, import-linter, Nx boundaries, drawio-skill CI rules, jQAssistant/Sonargraph [BK].
- They need rules written in a config language.
- Truemap uses the diagram the team already has as the spec, so docs and enforcement can't drift apart.
- Coexist: later, export truemap.yaml to dependency-cruiser rules.

MODELS-AS-CODE: LikeC4, Structurizr, IcePanel, Ilograph.
- They render and navigate hand-authored models but don't test them against code.
- Integrate: parse their DSLs in month 2–3, and become the reason their models stay true. The Structurizr cloud EOL leaves its users stranded.

DOCS-DRIFT TOOLS: Swimm-style code-coupled docs [BK, unverified]; ArchDoc's drift-check PR #22.
- These are tied to prose snippets or to one generator.
- Truemap is generator-agnostic and diagram-native.

BIGGEST THREAT: CodeRabbit, GitHub Copilot review or DeepWiki adds "diagram drift" as a feature. Defenses:
- MIT, self-hostable, deterministic (no LLM or code egress, which matters for private repos).
- The open lockfile and annotation standard.
- The dataset brand.
- Be first and become the default.

### key risks

- Vitamin risk: teams may not care enough about stale diagrams to install a check (Blind: 'utterly useless'; demand graded docs pain 3, frequency 2). The 'guardrail for agents' framing (mode: spec) is the hypothesised painkiller and still unproven. The week-2 population gate and the week-8 adoption gate test it
- False positives kill linters. Mapping mistakes, plus cross-service runtime edges (HTTP, queues) that static analysis can't see (tech bet g says these are hard), could flood microservice diagrams with UNVERIFIED verdicts. Mitigations: warn-only default, 'unverified' never shown as 'wrong', compose/env/URL heuristics, a runtime annotation escape hatch, OpenTelemetry import later
- Population risk: too few repos may keep architecture diagrams whose nodes map to code units, since many diagrams are conceptual ('User → API → DB'). Unmeasured, because the search budget ran out. This is the very first task
- Bundling risk: CodeRabbit (about $40M ARR estimate, demand #3), GitHub or DeepWiki could ship 'ask the model whether the diagram is still true' as a feature, and good-enough could beat deterministic
- Agents may get good enough that teams simply ask their agent to re-check the diagram ad hoc. Counter: that isn't reproducible, costs tokens on every PR, and keeps no history. But it is a real substitute
- The launch scan could look like shaming popular repos. Mitigations: kind framing, opt-out, publishing fixes instead of call-outs, never filing automated issues
- Monetization may stall below $500 MRR (ChartDB precedent). The audit add-on depends on auditors actually wanting evidence-backed diagrams, which is unverified
- Motivation and identity: the user built a drawing engine, and this plan sets drawing aside. If they won't enjoy building a verifier, the plan fails regardless of the market
- Competitors may already exist that I couldn't find: no web search was possible for 'diagram drift checker' after the shared budget ran out
- Mermaid parsing fidelity: the flowchart grammar lives in mermaid's jison parser [BK], so a tolerant subset parser may mis-parse edge cases and needs golden tests against mermaid itself
- SARIF annotations on private repos need GitHub Advanced Security [BK], which weakens one surface for paying users. The PR comment remains the primary surface

### kill criteria

- Week 1–2 (population gate): fewer than about 2,000 public repos with a Mermaid flowchart/C4 diagram of ≥4 nodes where ≥60% of nodes auto-map to code units. Then the developer-docs wedge is too small: pivot to verifying AI-generated docs (DeepWiki/Archify output) only, or stop
- Week 3–4 (precision gate): on a hand-labelled set of 50 real diagrams, precision below 85% on BROKEN or below 75% on UNDRAWN. Do not launch; one more week to fix, then stop if it is still below
- Week 6: the scan finds that fewer than 15% of mappable diagrams have any broken or undrawn edge. Then the 'diagrams lie' story is false; don't launch on it
- Fix-PR campaign: fewer than 8 of 30 helpful diagram-fix PRs merged, or most closed as 'don't care'. That confirms the vitamin; stop investing beyond maintenance
- Two weeks after launch: under 300 stars AND under 20 public repos running the Action. Write the post-mortem, keep the upstream Mermaid contributions, archive
- Day 90: under 50 repos with the Action active for at least 14 days, or 30-day removal rate above 50%, or fewer than 3 orgs willing to pre-pay $39/mo for private repos. Drop monetization, and keep it as a small MIT tool or archive it
- At any point: CodeRabbit, GitHub or DeepWiki ships deterministic, evidence-linked diagram drift checks for free. Reposition as the self-hosted open standard only if the lockfile/annotation spec has at least one adopter outside the project; otherwise stop

### roadmap 90 days

- Week 0–1 (Oct 15–25) — validation before code:
- Use GitHub code search to size the population of README/docs/ARCHITECTURE.md Mermaid flowchart/C4 blocks.
- Hand-check 50 diagrams for whether their nodes can be mapped to code.
- Search for direct drift-checker competitors (not done here: search budget exhausted).
- Pick the name and check the npm package, GitHub org and trademark.
- Relicense Glyphic core from FSL to MIT and deprecate the @glyphicjs packages with a pointer.
- Draft the post-mortem post.
- Gate: population kill criterion.
- Weeks 1–2: tolerant Mermaid flowchart parser into a Zod IR with stable ids; golden tests on about 200 real diagrams, cross-checked against mermaid's own parser in the tests.
- Weeks 2–3: facts graph.
- JS/TS imports via oxc-parser, workspace dependencies, docker-compose (depends_on, links, env URLs).
- The first 60 entries of the SDK catalog.
- Unit aggregation and file:line evidence.
- Weeks 3–4: auto-mapping (reusing validation.ts did-you-mean) and truemap.yaml; the reflexion engine (verified, unverified, broken, undrawn, phantom); truth and coverage scores; text, JSON and SARIF output; truemap.lock.
- Gate: precision on 50 hand-labelled diagrams.
- Weeks 4–5: the GitHub Action.
- Sticky PR comment re-emitting the team's Mermaid with linkStyle overlays, an evidence table, and a suggested patch.
- `mode: spec` failure, SARIF upload, badge JSON.
- Agent Skill for Claude Code, Codex and Cursor, published to skills.sh; `--fix` patches.
- Weeks 5–6: Python import extractor.
- Run the scan on 500–1,000 repos and the AI-docs track (about 25 repos).
- Build the Diagram Truth Report page with open data and an opt-out.
- Prepare 30 hand-reviewed fix PRs; translate the launch post into zh and ja.
- Contribute the ELK post-passes upstream to Mermaid and beautiful-mermaid.
- Week 7 (about Dec 1): launch.
- Show HN, then the report a few days later; X thread; Reddit; Lobsters; Juejin, V2EX, Zenn, Qiita.
- Directory listings; send the fix PRs; open integration issues on Archify, LikeC4 and oh-my-mermaid.
- Weeks 8–10:
- Triage issues and cut false positives.
- Add Structurizr DSL and LikeC4 parsers (for stranded Structurizr users), a D2 subset, a k8s manifest extractor, and Go imports.
- Add an Archify-JSON verification adapter and the 'broken since <sha>' history.
- Weeks 11–13 (to about Jan 13, 2027):
- Hosted GitHub App beta for private repos with 5 design partners: no YAML, org dashboard, Slack alerts.
- Pricing page through GitHub Marketplace.
- Prototype the Terraform plan JSON extractor and audit-evidence export with 2–3 SOC 2-bound startups.
- Day-90 review against the kill criteria: decide whether to build paid features, maintain, or archive.

### success metrics

- Precision of findings on the hand-labelled set: ≥90% BROKEN and ≥80% UNDRAWN before launch, re-measured monthly; false-positive issues under 20% of all issues
- Coverage: median ≥70% of diagram nodes auto-mapped without human edits on scanned repos
- Performance: `truemap check` under 10 s on a 100k-LOC repo; zero LLM calls in the CLI
- Launch: Diagram Truth Report reaches the HN front page or ≥50k views; at least one zh or ja post above 10k views
- Stars: 1,000 by day 90 (stretch 2,500)
- Adoption, the real target: 100 public repos with the Action active for at least 14 days by day 90, measured through public code search; under 40% removed within 30 days
- Skill installs: ≥500 on skills.sh by day 90
- Ecosystem: ≥10 merged third-party diagram-fix PRs; ≥1 external generator or modelling tool (Archify, LikeC4, oh-my-mermaid) emitting or consuming Truemap evidence annotations; ≥1 Glyphic ELK post-pass merged upstream into Mermaid or beautiful-mermaid
- Agent guardrail signal: ≥20 repos run `mode: spec` (failing CI), which shows the painkiller framing works
- Money: ≥5 private-repo design partners and ≥3 paying or pre-committed orgs at $39/mo by day 90; $800–2,500 MRR by month 12 as the base-case target

### premises challenged

- USER: 'AI can't draw diagrams.' This is false for small and medium diagrams. The revised version, 'still true for large ones', is also the wrong frame: nobody can draw a 150-node system as one readable canvas, human or model, because the limit is perception (tech §1). Glyphic's own renders at 50 nodes and up are unreadable even with 0 edges through boxes (codebase §3–4). Large-diagram pain is also low-intensity: Mermaid's top layout issues have 30–50 thumbs-up (demand #5). Don't build for it
- USER/REPO: 'the layout engine is the asset.' Layout is a free commons now: Mermaid 12 ELK default, TALA MPL-2.0, beautiful-mermaid (demand #2, tech #1). Selling layout just killed Terrastruct (market #4). Glyphic's routing works but isn't unique, and placement for large diagrams is unsolved anyway (codebase §6.1). The real asset is knowledge of how models fail plus model-fixable error design
- CATEGORY: 'diagram generation for LLMs' is a viable category. It is being absorbed from three sides. Chat platforms draw natively (Claude Mar 2026, ChatGPT Oct 2026). Incumbents own the MCP slot (Excalidraw, draw.io, Lucid; market #6). AWS dropped its diagram MCP in favour of a skill (demand #1). The 'agent/LLM-app builders' audience is graded D (demand §2)
- LEAD: 'pivot to architecture diff for PR review'. Rejected as the product. (1) At least 8–10 entrants have shipped, most of them free, including PR Lens (1,964 stars in 8 weeks, with a stability rule) and drawio-skill, whose CI policy checks, the lead's proposed PAID feature, are already free under MIT (market §3, tech #3). (2) Reviewers don't ask for pictures: HN 48329446; teams turn off CodeRabbit diagrams; CodeSee Review Maps died (demand §3, market table). (3) Glyphic can't yet do the core requirement: one added edge moves 81–100% of boxes, and stable compound layout is a 3–5-month research build with no OSS solution (codebase §3, tech bet b). (4) It is a bundled feature of a ~$40M-ARR review bot (demand #3). WHAT SURVIVES: the pain (review time +49% to +91%) and three real gaps (stable, verified, whole-system context). Truemap's divergence comment covers all three without a layout engine: deterministic evidence, stability from the human's own diagram text, and the canonical diagram as whole-system context
- LEAD: 'grow into a living system map (one model, many views, semantic zoom)'. Rejected as a destination. Free big-company substitutes regenerate on every change (Code Wiki, DeepWiki; market #7). Hosted models die for lack of use (Structurizr cloud EOL, CodeSee). Docs as an audience is graded C (demand §2). It is a 6-month platform before the first user (the tech §4 sequence). WHAT SURVIVES is the moat logic: a persistent, versioned, evidence-verified model, with truth and time as permanent constraints (tech §4). Inverted: don't generate the living map; make the team's existing map 'living' by testing it. The verified model exists, as truemap.lock behind the team's diagram
- TECH REPORT: 'stable incremental layout is the moat.' It is defensible but is the most expensive and riskiest thing a solo developer could attempt, given today's measured instability, and a moat around a product nobody uses is worth nothing. Truemap makes stability unnecessary by never re-laying-out: it overlays the author's own text diagram
- TECH REPORT: 'launch with a size-stratified layout-quality leaderboard.' That makes the user judge and contestant in a commodity race whose winners already chose 'the model draws'. Measure TRUTH on real repos' diagrams instead: newsworthy, aligned with the product, and with nobody else's ego at stake
- STRATEGIST INSTINCT: 'beat Archify with a better skill (deterministic layout, verified edges, drill-down).' Rejected: an 84k-star head start, they can add ELK any day, and 'evidence-linked' is already table stakes (market #7). Be the checker of Archify's output, not its rival
- 'Narrow hard to one diagram kind done 10x better.' Evaluated and rejected for drawing:
- huge ERDs: ChartDB and drawDB have 23k and 40k stars and about $1K revenue; Azimutt exists [BK];
- infra and compliance network diagrams: Hava, Cloudcraft and Lucidscale exist, and SOC 2 diagrams are usually small [judgement];
- sequence diagrams: bundled in review bots;
- large architecture views: low-intensity pain.
No drawing kind admits a 10x when engines are free. Narrow on a CLAIM TYPE instead: the arrows of one language (Mermaid flowchart/C4), verified
- REPO CLAIMS: 18 types, byte-identical, validated, safe by construction, any Google Font, cheap at scale (codebase §5). These must be publicly retracted. A truth-branded product can't launch on a codebase with overstated claims, and an honest post-mortem is itself good launch content
- REPO: 'MCP server is the integration surface.' The 2026 breakout channel was skills plus self-contained output (market #1), and for this job the right surfaces are CLI, Action, SARIF and skill, where the team already works
- REPO: FSL license. It protects zero adoption and blocks embedding by skills and agents (market #4, tech §4). Use MIT
- DEMAND REPORT: 'compliance-grade maps are the #2 opportunity.' Partly rejected as a wedge: annual frequency, small diagrams, auditors' tolerance of hand-drawn diagrams, and an enterprise trust/sales motion. Kept as a $490/yr add-on on the same engine, built only after design partners confirm demand
- USER: 'stars will lead to money.' The market evidence says they mostly don't (ChartDB, Kroki, Archify sponsor slots; market #5). Plan for side income from hosted private-repo state, with sponsorships as a bonus, and plan on keeping a day job

## Strategy (moat): Glyphic 2: the architecture lockfile. A stable, verified system map in git that gets more valuable as agents write more of the code (technical-moat strategy)

### one liner

Glyphic keeps a map of your system in git that stays in place when the code changes and links every arrow to the line of code that proves it, so you can see exactly what your agents changed and which parts are only a model's guess.

### thesis

**Every diagram tool that won in 2026 is stateless.** Each one redraws from scratch on every call.
- Model-drawn tools: Archify, diagram-design, and the Excalidraw and draw.io MCPs.
- Engine-drawn tools: Mermaid 12 with ELK, CodeBoarding re-running Mermaid, and pr-lens rebuilding its graph from an LLM read of each diff [market table; tech §0.3].

Statelessness is why small diagrams are now free: Claude inline visuals (Mar 12, 2026), ChatGPT Intelligent UI (Oct 7, 2026), Mermaid 12 with ELK as default (Sep 10, 2026) [demand §1.2, §1.4]. It is also why systems at scale still fail.

**Three constraints do not go away as models improve [tech §4]:**
1. **Human perception.** No engine or model makes one 150-node canvas readable [tech §1 conclusion]. Glyphic's own renders show it: 4.9 px labels at 100 nodes, 2 px at 200 [codebase §3, §4]. Scale needs views, plus a mental map that survives from one commit to the next.
2. **Trust.** A generator cannot certify its own output. The main structural failure of model-made architecture diagrams is invented edges [tech §0.4 R2ABench; demand §3 DeepWiki/GitDiagram quotes; Archify #614].
3. **Time.** "What changed" needs state across commits. Today, adding one cross-group edge moves 81–100% of Glyphic's boxes [codebase §3].

**Why the gap persists.** The fix is unglamorous, stateful infrastructure: a versioned graph model checked against evidence, plus stable incremental layout of nested (compound) graphs.
- **Only one closed product does it:** yFiles, at about €7.1k per developer per year [tech §1].
- **ELK does not do it out of the box.** I ran a one-hour spike on the codebase report's generator (/tmp/claude-0/-home-user-Glyphic/b81316dc-70f2-5510-bd50-0c3bd46253e5/scratchpad/stab/spike2.mjs), measuring movement with global translation removed:
  - Glyphic-style INCLUDE_CHILDREN moved 94–100% of leaves when one cross-group edge was added at 50–200 nodes.
  - Laying out each group separately (per-group locality) still moved 69–100%.
  - ELK's INTERACTIVE strategies, seeded with the previous positions, moved 15–100%, and were sometimes worse.
- **Nobody else is built for it.** Labs ship stateless visuals in chat. Incumbents are stateless by design: Mermaid goes text to render, canvases are freeform, and prompt skills redraw each time.

**Better models make this more valuable, not less:**
- Agents ship more and bigger PRs (PR size +154%, review time +91% [demand §3 Faros]), so structure drifts faster.
- Better models propose better edges, and a deterministic verifier checks them at no cost.
- The part being dropped, drawing small pictures, gets cheaper for everyone anyway.

**The bet:** stop selling "AI can't draw", which is eroding. Sell "the map that stays put and can be trusted", which compounds.

### target user

**Primary: the reviewer-in-chief.**
- A tech lead, staff engineer or lead maintainer who owns a 40–300-component system: a monorepo, or 2–10 repos.
- On a 5–50-engineer team, or a large OSS project, where Claude Code, Codex or Cursor write most PRs.
- Personally responsible for structural review and for keeping the team's mental model current.
- Already lives in GitHub PRs and CI, and already accepts lockfiles and CI gates as normal.
- This persona sits at the intersection of the demand report's best-graded audience, (c) reviewers of AI PRs (grade B), and (b)/(i3), architecture docs and onboarding.

**Secondary 1 (distribution, not revenue): skill and agent-tool authors** who need a deterministic, stable layout "hands" engine. Examples: Archify, diagram-design, pr-lens, drawio-skill. They are fighting repair loops and token burn [market whitespace #2].

**Secondary 2 (paid later): platform and compliance owners** who need a current, evidence-backed data-flow diagram for SOC 2 [demand (i1)+(d), graded C+/B-].

**Explicit non-targets:** chat users who want a quick picture, educators, non-technical knowledge workers, and agent/LLM app builders who want a render API. All are graded D or F [demand §2].

### job to be done

**Core job.** When agents change my system faster than I can read the diffs, I want one map of the whole system that:
- stays in the same place from commit to commit;
- shows which boxes and arrows a PR adds, removes or changes, in the context of the whole system;
- marks which arrows are proven by code and which are a model's guess.

That lets me keep my mental model current and catch structural mistakes before merge, such as a new service writing to the payments DB or an invented dependency.

**Sub-jobs:**
- Onboard to an unfamiliar repo.
- Keep the README or docs architecture diagram from going stale, enforced in CI like a lockfile.
- Hand an auditor a dated, accurate data-flow diagram.

**Agent sub-job:** give my coding agent a verified, text answer to "what depends on X?" instead of a guess.

### evidence of demand

**Problem evidence**

1. **Wrong diagrams are the top complaint, and the problem is grounding, not drawing.**
   - "Hallucinating pretty convincingly" (DeepWiki); "a connection in the diagram that doesn't exist" (GitDiagram); "a confidently wrong architecture diagram is worse than no diagram" (on Archify) [demand §1.6, §3].
   - R2ABench: invented edges are the main structural failure [tech §0.4].
   - Archify #614: unreachable modules drawn as live components [market table].
2. **Non-determinism and instability are admitted by the winners themselves.**
   - diagram-design's README says "the same prompt can lay out differently twice". It recommends Mermaid for diagrams that live in Git and change often, which is exactly this segment [market table].
   - drawio-skill reached 10.2k stars with incremental sync that keeps hand-tuned coordinates [market table].
   - pr-lens hard-coded a stability rule into its seating code [tech §0.3].
   - Mermaid #815 "keep node order" has 45 thumbs-up [demand §1.5].
3. **At scale, users ask for navigation, not bigger canvases.**
   - Archify #280 (cross-diagram drilldowns), #401 (expandable subgraphs), #660 (shared corridors), #6 (disorganized arrows) [demand §1.5].
   - Mermaid #1860 "ZOOM!!!" (35 thumbs-up); at least four Obsidian plugins exist only to add pan and zoom [demand §3].
   - Ilograph: master diagrams are "almost always a mistake".
4. **The "model draws, validator complains" loop is expensive.** Archify #214 (~25 repair rounds for 8 nodes), #22 (tens of millions of tokens), #66 (slow and token-heavy), #61 (overlaps pass validation), #344 (3 of 5 bundled examples fail) [market table].
5. **Stale docs are chronic.** IcePanel 2025 survey: keeping docs current is the #1 challenge. vFunction: 56% have out-of-date docs. SOC 2 requires diagrams that "accurately depict the system", updated within 12 months [demand §3].
6. **Review is the measured bottleneck.** Faros: review time +91%, PR size +154%. Harvard/Jellyfish: +49%. Qodo: the #1 constraint [demand §3].
7. **Adjacent tools show willingness to adopt.** pr-lens got 1,964 stars in about 8 weeks; CodeBoarding has 2.6k; Eraserbot has sold PR visual diffs since March 2025 [market; demand §3].

**Counter-evidence, taken seriously**
- Large-diagram issues on Mermaid (~90k-star repo) get only 30–50 thumbs-up, against 363 for a component-diagram feature request [demand §1.5].
- In the HN thread on PR review load, nobody asks for diagrams. Some teams turn off CodeRabbit's diagrams [demand §3].
- Structurizr's cloud service closed for lack of use, and Terrastruct shut down [market §2.4].

**Verdict:** demand for "correct, navigable, stable" is real, but it is inferred from complaints about stateless tools. Nobody has yet proven they will adopt a new tool for it. The plan therefore runs cheap adoption tests before any paid build (see kill criteria).

### why now

1. **Small diagrams became free in 2026.** Claude visuals (Mar 12), Mermaid 12 with ELK as default (Sep 10) and ChatGPT Intelligent UI (Oct 7) [demand §1.2, §1.4]. Value moves to state, trust and scale.
2. **Layout-engine businesses just died or opened up.**
   - TALA went MPL-2.0 (Sep 2026) and Terrastruct closed.
   - Structurizr cloud reached end of life on 2026-09-30, orphaning architecture-as-code users.
   - The layout commons (ELK, TALA, libavoid) is free to build on [market §2.4; tech §0.1].
3. **The distribution channel is open and proven.** The Agent Skills standard (Dec 2025) and `npx skills add` (Jan 2026) took Archify to about 84k stars in 6 months [market §2.1]. AWS replaced its diagram MCP server with a skill [demand §1.1].
4. **Agents can now pay the upkeep cost.** Diagrams used to rot because updating them "does not provide any short-term benefit" (Teamscale [demand §3]). An agent can fix a stale map in one command, and CI can enforce it the way it enforces package-lock.
5. **The yardstick is unclaimed.** No public benchmark goes above about 15 nodes, and none tests stability or fidelity (Text2Arch, MermaidSeqBench) [tech §0.4, §3f]. R2ABench and TraversalBench (Apr 2026) provide the academic framing.
6. **The building blocks just matured.** libavoid-js WASM (Feb 2026), @joint/router-avoid (Sep 2026), elkjs 0.12 (Jul 2026) and resvg-wasm [tech §1].
7. **The window is 6–12 months.** pr-lens already has a simple stability rule, drawio-skill has sync, and GitHub's gh-aw opens bot PRs that update architecture diagrams [tech §0.3]. Someone credible will claim "stable + verified" soon.

### wedge v1

**Glyphic 2.0: the `glyphic` CLI, the `glyphic-map` agent skill, and DiagramBench v0.1.** Code-complete in 6 weeks (by Nov 25). Public launch on Tuesday, December 1, 2026, which avoids US Thanksgiving week.

**1. Model and input**
- **Strict graph model.** Nodes, edges and nested groups with stable ids, plus `roots` (paths), `aliases` and `evidence`.
- **Two input formats:** a Mermaid flowchart subset (subgraph = group, `%% @evidence` and `%% @alias` directives), or a compact JSON IR whose schema stays under 1.5k tokens. Today's schema costs 7k–14k tokens [codebase §3].
  - Consider reusing beautiful-mermaid's pure-TS MIT parser. Whether it fits is unverified.
- **Validation:** duplicate ids, group cycles, dangling references and unknown groups. These are the silent-vanish bugs listed in [codebase §5.3].

**2. Anchored layout engine (the hard part)**
- **(a) Epoch layout, quality first.**
  - Lay out each group bottom-up with ELK layered, porting Glyphic's label sizing and edge post-passes.
  - Detect cycles between groups on the group-level graph and choose a feedback arc set that keeps entry→data as the primary flow. This targets the cause of the hero's perimeter edges [codebase §4].
  - Feed the previous order in through considerModelOrder, so a new epoch disrupts less.
- **(b) Between epochs, placement is frozen.**
  - **Insert:** score candidate slots in the node's group by edge length to its neighbours, crossings and free space; grow the group only if needed.
  - **Resize** (label change): handled by the same overlap solver.
  - **Remove:** leave a hole.
  - **Move to another group:** treated as remove plus insert.
  - **Overlap solver:** group growth is resolved by VPSC minimal-displacement separation (Dwyer–Marriott–Stuckey; WebCola's MIT implementation), pushed up the hierarchy so a change spreads only as far as space requires.
  - **Edges never move boxes:** adding or removing an edge only changes routing.
- **(c) Incremental orthogonal routing** around the fixed boxes. Use libavoid-js WASM, loaded as a separate replaceable file, or @joint/router-avoid. Re-route only edges touching changed regions, then apply Glyphic's nudging, jog-collapse and border-clipping passes. Routing is already Glyphic's strength: 0 edges through boxes, detour ratio about 1.0 [codebase §3].
- **(d) Layout debt.** Compare edge length, crossings and area against a shadow fresh layout. When debt exceeds +25%, `check` suggests `glyphic relayout`. That is its own reviewable commit, animated in the viewer.
- **(e) Lockfile.** `.glyphic/layout.lock` holds one sorted line per node: id, parent, x, y, w, h, epoch.
  - Git conflicts are per node, and a `.gitattributes` merge driver resolves them by re-inserting the conflicted nodes.
  - Deterministic: bundled Inter with real metrics via fontkit, resvg-wasm with `loadSystemFonts:false`, dates in UTC [codebase §6.3].

**3. Verifier v1: alias-grounded evidence**
- **Verified edge:** A→B is verified if a cited `file:line@sha` inside A's roots contains one of B's evidenced aliases (package name, hostname, env var, topic or route prefix), or if a deterministic extractor emitted it.
- **v1 extractors:** workspace package graphs (pnpm, npm, yarn, Cargo) and docker-compose.
- **Edge states:**
  - **Asserted:** a model claimed the edge without evidence. Drawn dashed.
  - **Stale:** the cited token is gone; a search within ±N lines and then the whole file has already failed to re-anchor it. Drawn amber.
  - **Contradicted:** an extractor says no such dependency exists. Drawn red.
- **Why this design:** it is language-agnostic, so there is no extractor grind in v1. It directly targets the invented-edge failure [tech §0.4].

**4. CLI commands**
- `glyphic render` writes:
  - a self-contained HTML viewer;
  - an SVG;
  - a PNG thumbnail of at most 2576 px, for the agent's self-check [codebase §3];
  - `defects.json`, a text report of overlaps, crossings, minimum label px at 1920 px and unverified edges. Vision self-checks fail at crossings [tech §0.5].
- `glyphic check [--strict]` is the CI gate. It fails on a stale map or on new asserted edges.
- `glyphic diff base..head` draws both revisions on the same anchored coordinates: added green, removed as a red ghost, changed amber. Untouched groups are collapsed; changed nodes plus one hop are expanded.
- `glyphic relayout` starts a new epoch.
- `glyphic timelapse <range>` uses the deterministic extractors only. It powers the launch demo.
- `glyphic query deps <id> --json` gives agents a text answer. It is a cheap hedge, because LLMs read structure better than pictures [tech §0.5, CGF 2026].

**5. HTML viewer** (single file, under 300 KB)
- Pan and zoom.
- Semantic zoom: groups show aggregated edge counts (for example ×7), and labels appear once they are 11 px or larger on screen. Anything visible at one zoom level never disappears when zooming in.
- Search.
- Click a node or edge to open its evidence (GitHub, GitLab or vscode:// links).
- Before / after / overlay toggle for diffs.

**6. Skill.** `npx skills add MS-Teja/glyphic` for Claude Code, Codex, Cursor and OpenCode. Its rules:
- Update the map, never regenerate it; keep ids.
- Cite evidence for every edge.
- Read `defects.json`, not the PNG.
- Run `check` before committing.

**7. DiagramBench v0.1** (working name; check for collisions). Separate repo; MIT harness, CC-BY-4.0 data.
- **Scale track:** 10, 25, 50, 100 and 200 nodes, synthetic plus extracted. Measures overlaps, crossings, label px at a 1920 px fit, perimeter detours, area use, time and RSS.
- **Stability track:** 20-step edit scripts. Reports a Pareto frontier of displacement (% of nodes moved more than one node height, translation removed; order Kendall tau) against quality inflation.
- **Cost track:** tokens, repair rounds and seconds per create and per update.
- **Entrants:** Mermaid 12, D2 with dagre/ELK/TALA, Graphviz, raw elkjs, drawio-skill, Archify, diagram-design, Excalidraw MCP, frontier-LLM direct SVG, Glyphic 1.x (published honestly as failing) and Glyphic 2.
- **Budget:** about $300 in API tokens.

**Ship gates.** One edit moves at most 5% of existing nodes by more than one node height at 50–200 nodes. Quality inflation stays at or below 20% after 20 edits. 100-node render (SVG + HTML) under 2 s. Install under 15 MB with no native dependencies.

**Out of scope for v1:** GitHub Action (week 7), Fidelity track (week 8), hosted service, sequence/gantt/charts, IaC extractors, MCP.

**Fallback.** If the engine slips, launch DiagramBench alone at week 6 with Glyphic ranked honestly. Ship the engine at weeks 8–9 as a second news cycle ("we topped the stability track").

### keep from repo

- Knowledge and regression fixtures from packages/core/src/layout/elk-adapter.ts: label-aware node sizing, nested groups, separating overlapping edges, collapsing small jogs, the BALANCED bk alignment and the INCLUDE_CHILDREN crash notes. Port the 13 regression tests as fixtures, not the code [codebase §2]
- core/layout/validation.ts: unknown-id errors with Levenshtein "did you mean", which models can act on
- schema/format-error.ts: short, de-duplicated Zod errors written for models
- core/math/geometry.ts: border clipping for diamond, hexagon and cylinder shapes
- core/scene/scene-graph.ts and render/strategies/svg-renderer.ts: the clean scene graph to SVG step
- From scene-builder.ts: arrow markers, room for arrowheads, edge clipping (fix the arrow:"back"/"both" bugs)
- theme.ts and style.ts presets, plus the seeded hand-drawn roughen.ts style, with shadows off by default
- The resvg rasterizer concept, moved to resvg-wasm with a bundled font and loadSystemFonts:false
- The c4, state, erd and class mappers as later presets over the one graph path (c4 first)
- Zod for a small, versioned schema; the pnpm/turbo monorepo, Biome, CI
- The benchmark seeds in the scratchpad (bench/gen.mjs, stability.mjs, metrics2.mjs, stab/spike2.mjs), which become DiagramBench's generator and stability harness
- The Glyphic name, the MS-Teja/Glyphic repo and the @glyphicjs npm scope

### drop from repo

- The 12 non-graph types: gantt, sankey, git, timeline, journey, kanban, pie, quadrant, treemap. That means flow-svg.ts, data-viz-svg.ts and the time, flow, data, treemap and chrono adapters. Sequence is deferred; CodeRabbit and Greptile already cover it
- The canvas type and the explicit x/y bypass of ELK (canvas-adapter.ts, canvas-svg.ts). Pins come back later as soft constraints in the lockfile
- The React Flow export adapter (it loses routes, leaks internal nodes and has no consumer)
- frame.ts 9:16/16:9 padding
- The regex SVG sanitizer and all raw-SVG input (bypassable; XSS risk) [codebase §5.7]
- The heuristic Inter character-width table (text-metrics.ts) and the other three width heuristics, replaced by real font metrics
- The 25 MB FontAwesome dependency, replaced by a small icon subset; also remove the unused d3-shape and d3 dependencies
- The MCP server as the primary surface (get_schema, render_diagram, PNG saved to ~/Desktop, inline base64 2x PNG). Deprecate it in favour of the skill [demand §1.1; market §2.6]
- The always-on 2x PNG in processDiagram, and the default drop shadow (7-23x slower) [codebase §3]
- The FSL-1.1-ALv2 license on core
- The 7k-14k-token union schema with 17 variants and 79 cross-branch $refs
- Overstated README claims: "18 types", "byte-identical" PNGs, "any Google Font", "safe by construction", the unverified comparison table, the "self-hosted HTTP API" [codebase §5]
- The unverifiable glyphic.web.app playground as the front door, replaced by the benchmark site and the timelapse gallery

### rebuild or evolve

**Rebuild the core, in the same repo and npm scope, as v2.0.0. Port the knowledge; do not refactor the code.**

**Why rebuild:**
- The central abstraction of 1.x is wrong for the new product. It maps a diagram type to a stateless render strategy. The new central abstraction is Model + Lock → Anchored Layout → Views.
- Roughly 1,500 of the 5.7k lines are drop candidates [codebase §2].
- The part worth keeping, about 1,900 lines, is ELK configuration knowledge and edge cases, best carried over as fixtures and tests.

**Package layout:**
- `@glyphicjs/model`: schema, validation and verifier.
- `@glyphicjs/layout`: the anchored engine.
- `@glyphicjs/render`: SVG, thumbnail and HTML viewer.
- `glyphic`: the CLI.
- `skills/glyphic-map`: the agent skill.
- DiagramBench lives in its own neutral repo or org, which protects its credibility.

**1.x on npm:** leave it published with a deprecation notice. `@glyphicjs/mcp-server` points users to the skill.

**Name:** keep "Glyphic". There are only ~10 stars to protect, but renaming buys nothing.

**License:** the user is the sole author of all 50 commits (checked in git log), so relicensing to MIT needs no CLA.

**Agents:** use coding agents to port the post-passes and write the viewer. Keep the anchored solver and the verifier rules hand-designed and gated by the benchmark.

### distribution plan

**Principle.** The engine is invisible, so ship visible motion and a yardstick. Still images sell looks, where Archify and diagram-design already win. Motion sells stability, where only Glyphic wins.

**Pre-launch (weeks 1–5)**
- **Build in public on X.** A weekly 10-second GIF: "inserted a service into a 120-node map; 2 boxes moved", side by side with Mermaid 12 or Archify re-rendering the same edit and reshuffling.
- **Pre-publication review.** Seven days before publishing, send each DiagramBench entrant's maintainers their raw results and harness config, and invite fixes: Archify, diagram-design, pr-lens, drawio-skill, D2/TALA, beautiful-mermaid, excalidraw-mcp, CodeBoarding. This makes the numbers defensible and turns launch day into quote-tweets instead of fights.

**Launch day: Tuesday, December 1, 2026. Three assets on the same day.**
1. **The DiagramBench v0.1 report and leaderboard site:** "Every diagram tool fails at 200 nodes. Here's how badly, and why." Post as a Show HN (benchmarks suit HN even though skills don't [demand §1.7]), plus lobste.rs, r/programming, and the Changelog, TLDR and Console.dev newsletters.
2. **Architecture timelapses.** Two to three years of history for 5 well-known monorepos (candidates: Vite, Nx, Turborepo, Babel, Astro), built only from deterministic workspace graphs. Only stable layout makes these possible.
   - Post 20-second videos on X.
   - Translate the write-ups with AI for Chinese channels (Juejin, V2EX, Zhihu, Bilibili) and Japanese ones (Zenn, Qiita, note.com). These communities drove the 2026 diagram virality [market §2.1; demand §1.7].
3. **The skill**, listed on skills.sh, the Claude Code plugin marketplace and the Codex, Cursor, OpenCode and Copilot directories, with a one-line install.

**Viral loops**
- **README badge** (codecov-style, free for public repos): "system map · 142 nodes · 96% verified · updated 2d ago", linking to the hosted map. It doubles as social proof and as an honest new metric.
- **Footer** "made with Glyphic" on every HTML map and PR comment.
- **"Reply with your repo and I'll render its timelapse"** during launch week. Each reply becomes an asset the maintainer reposts.
- **Benchmark submissions.** Every new entrant or result is another post.

**Embedding**
- Open integration issues or PRs offering the anchored engine as an optional layout backend:
  - Archify: aimed at #660 (corridors), #280 and #401 (drilldowns) and #214 (repair rounds).
  - drawio-skill and pr-lens.
- One accepted integration exposes the engine to tens of thousands of installs. Precedent: beautiful-mermaid reached 11k stars by being embedded in someone else's agent [market whitespace #2].

**First 100 real users**
- **(a) 30 hand-onboarded OSS maintainers** of agent-heavy repos with 50+ contributors. Always ask in Discussions first; never open unsolicited PRs. Offer them a committed verified map plus the Action.
- **(b)** People who replied to the timelapse offer.
- **(c)** The Cloud beta waitlist, collected from the HN and X posts.
- **(d)** The Action listed on GitHub Marketplace (week 8).
- **What counts as a user:** a repo whose `.glyphic/layout.lock` was updated in at least 2 separate commits. Stars don't count.

**Targets**
- 1,000 combined stars (repo + benchmark) within 30 days of launch; 3,000 by month 6.
- 100 real repos by mid-March 2027.

### monetization

**Charge for hosted state. Never charge for rendering or layout.** Terrastruct showed that selling layout does not keep a company alive [market §2.4; tech §0.1].

**Free forever (MIT):** engine, CLI, skill, viewer, Action, self-hosting and the benchmark.

**Glyphic Cloud** (GitHub App, closed source, launches as beta in weeks 10–12)
- **Public repos: free.** Hosted maps, PR comments with hosted images, the badge.
- **Team: $39/month per org.** Up to 15 private repos, with:
  - authenticated HTML maps in PR comments;
  - a lockfile history browser;
  - drift alerts when evidence goes stale on main;
  - a weekly digest of what changed structurally.
- **Org: $149/month.** Unlimited repos, plus:
  - a cross-repo org map, stitched together through verified aliases;
  - policy rules on verified edges, for example "no asserted edges into payments" or "Internet must not reach the DB";
  - an audit export: a dated PDF data-flow diagram with an evidence appendix, for SOC 2 [demand (i1)].
- **Billing:** annual plans get 2 months free. No per-seat pricing, because viewers are many and the price is per org. IcePanel likewise charges editors only.

**Sponsorship**
- GitHub Sponsors.
- Disclosed "supported by" slots on the benchmark site that never influence results.
- README sponsor slots once the repo passes 3k stars. This is the Archify model [market §2.5].

**Unit economics**
- No LLM inference on Glyphic's side: the skill runs in the user's agent and the verifier is deterministic.
- Hosting is static HTML and PNG on R2 or Pages, about $20–60/month, so gross margin is about 95%. Contrast pr-lens and CodeBoarding, which pay for metered inference.

**Realistic numbers**
- **Month 3:** $0–200/month, from sponsors.
- **Month 6:** 5–15 paying orgs, $300–1.5k MRR.
- **Month 12**, only if the kill criteria are passed: 25–60 orgs, $1.5k–6k MRR, plus $200–800 from sponsors.
- **Base case:** about $1–2k MRR at 12 months. That is "a bit of money on the side", not a salary.
- **Median outcome for OSS dev tools is close to $0.** ChartDB has about 23k stars and reported "$1K collected revenue" [market §2.5]. The user should not quit a job over this.

**Rejected options**
- Selling the engine or "Pro layouts" (Terrastruct's model).
- Per-render pricing.
- Reselling LLM credits.
- Paid "certification" on the benchmark, which would destroy its credibility.

### license

**MIT for everything public:** model, engine, renderer, viewer, CLI, skill, GitHub Action and the DiagramBench harness. **CC-BY-4.0** for benchmark datasets and results. **Proprietary** for the Glyphic Cloud service only.

**Relicense @glyphicjs/core from FSL-1.1-ALv2 to MIT in 2.0.0.**
- The user is the only commit author, so no CLA is needed.
- Every comparable tool is MIT, Apache or MPL [market §2.4].
- FSL deters embedding by skills, which is the main distribution channel [tech §4].
- The money sits in hosted state, which a license cannot protect anyway.

**Dependency hygiene:**
- **elkjs (EPL-2.0):** fine to depend on; Mermaid does.
- **libavoid (LGPL-2.1):** ship it as a separately loaded, user-replaceable WASM file, never inlined into the MIT bundle. Alternatively use @joint/router-avoid (MPL-2.0); confirm its exact terms first.
- **Inter (OFL):** bundle it.

### moat

The moat has five layers. Each is copyable on its own; together they are hard to copy.

1. **Algorithmic: anchored, incremental layout of nested graphs, with a published stability-versus-quality frontier.**
   - No OSS solution exists. ELK's interactive modes do not deliver it (my spike: 15–100% of leaves moved by a single edit at 50–200 nodes). The commercial equivalent is closed and costs about €7.1k per developer per year (yFiles [tech §1]).
   - It compounds: every regression found in a real repo becomes a benchmark fixture.
   - A funded team could copy it in about 6 months. A prompt cannot.
2. **Trust: the evidence ledger and the alias-grounded verifier.**
   - It is model-agnostic. Better models make better proposals, and the verifier never needs to be smarter than the models it checks.
   - Labs that sell generators are poorly placed to be the independent checker [tech §2, "persists in a different form"].
3. **State and history.**
   - Lockfiles and evidence live in the customer's git.
   - The hosted service accumulates structural history per repo, drift alerts and cross-repo maps, so switching cost grows with time (a "system of record" [tech §4]).
4. **Format.**
   - Publish a spec for the `.glyphic/` model and lockfile early, so Archify, pr-lens and drawio-skill can render from it or emit it.
   - If they adopt it, Glyphic becomes the "architecture lockfile" that every tool reads.
5. **Authority.** Owning DiagramBench, the only benchmark split by size, stability and fidelity, makes Glyphic the reference everyone tests against.

**Explicitly not moats:** single-canvas layout quality, breadth of diagram types, the viewer, WASM, MCP, the license [tech §4].

**What would break the moat:**
- GitHub building native stable maps into PRs (gh-aw already opens architecture-diagram bot PRs).
- CodeRabbit adding a persistent model.
- pr-lens adding deterministic verification.

### competitors and how we win

- **Archify (about 84k stars).**
  - Weakness: the agent does the layout, and the README says it has no general-purpose auto-layout. Issues show around 25 repair rounds for 8 nodes (#214), heavy token use (#22, #66), overlaps that pass validation (#61) and collapsed opposite-direction edges (#248). It keeps no state between runs.
  - How we win: don't fight its looks. Win above 40 nodes and on repeated updates, and offer the engine as its layout backend.
- **diagram-design (about 56k stars).**
  - Weakness: its own README says it is non-deterministic and recommends Mermaid for diagrams that live in git.
  - How we win: be the choice for diagrams that live in git and change often.
- **pr-lens (2k stars in 8 weeks).**
  - Weakness: edges come from an LLM reading the diff, layout is a lane grid scoped to the blast radius, and its stability rule only covers small grids.
  - How we win: whole-system context, verified edges, stability at 200 nodes measured publicly. Offer the lockfile format as a shared baseline.
- **drawio-skill (10.2k stars).** The closest competitor: sync that keeps coordinates, `prdiff`, and CI rules, all free.
  - How we win: evidence verification, semantic-zoom views, stability proven by metrics, and a single web-native install. Benchmark it openly.
- **CodeBoarding (2.6k stars).**
  - Weakness: good LSP extraction, but Mermaid is laid out from scratch every run.
  - How we win: stable diffs. Import its output as an extractor; partner rather than fight.
- **Mermaid 12 / mermaid.ai.**
  - Weakness: stateless rendering; #815 "keep node order" is still open.
  - How we win: accept Mermaid as input and add the stability and verification layer on top. Never compete on rendering.
- **D2 + TALA.**
  - Weakness: TALA is randomized ("adding just one node can significantly change the diagram"), maintainer time is limited at the nonprofit, and there is no API or MCP.
  - How we win: stability. TALA is optional and only for static views.
- **LikeC4 / Structurizr / IcePanel / Ilograph.**
  - Weakness: the model is written by hand. Ilograph's perspectives are the best answer to large diagrams, but they are authored manually.
  - How we win: the model is generated and verified. Import and export LikeC4 DSL later.
- **CodeRabbit / Greptile.**
  - Weakness: throwaway per-PR sequence diagrams.
  - How we win: a persistent structural model that coexists alongside them.
- **DeepWiki / Google Code Wiki.**
  - Weakness: diagrams are regenerated each time, accuracy complaints are common, and private-repo access is on a waitlist.
  - How we win: verified, stable, self-hostable, works on GitLab.
- **Excalidraw / draw.io official MCPs.**
  - Weakness: freeform, model-placed coordinates. They are good for small diagrams.
  - How we win: don't compete there. Export to draw.io later for consultants.
- **yFiles.**
  - Weakness: the gold standard for incremental layout, but closed and €7k per developer per year.
  - How we win: open source and free for every skill author.
- **GitHub (gh-aw).** The real threat.
  - How we win: stay host-agnostic (GitLab, Bitbucket, local), own the format and the benchmark, and stay ahead on the solver.

### key risks

- The stability engine may take longer than the 4 weeks budgeted. My spike shows off-the-shelf ELK cannot deliver it, so it is new work. Mitigations: launch the benchmark first; fall back to a minimal "freeze and insert" with VPSC; publish the frontier honestly.
- Demand risk: reviewers may not open diagrams. The HN review-load thread doesn't ask for them, some teams turn off CodeRabbit's diagrams, and large-diagram Mermaid issues get only 30-50 thumbs-up [demand §1.5, §3]. If so, the verified model must earn its keep as agent-facing text (`glyphic query`).
- Layout debt: frozen placement decays after many edits. That could make epoch relayouts frequent enough to destroy the stability promise, or leave maps ugly.
- Benchmark credibility: Glyphic is both judge and contestant, and layout metrics can disagree with human ratings (PREVis [tech §3f]). Mitigations: a neutral repo, an open harness, pre-publication review by tool authors, publishing tracks Glyphic loses, and a small human-rating subset.
- False confidence in the verifier: alias matching is string-level, so a cited line can contain an alias without being a real call. Mitigation: two labelled tiers, "extractor-proven" and "evidence-linked". Never just "verified".
- Incumbent absorption: GitHub gh-aw, CodeRabbit or mermaid.ai ship persistent maps; pr-lens adds verification.
- Distribution: stability can't be seen in a screenshot. Everything depends on animated assets, and on translation into Chinese and Japanese, which the user may not be able to produce well.
- Solo bandwidth and scope creep: languages, IaC extractors, view types and the Cloud service all compete for the same part-time hours.
- Monetization ceiling: diagrams are usually a feature, not a product. Precedents like ChartDB's $1K and Structurizr's closed cloud suggest the money stays small.
- Licensing hygiene around LGPL libavoid inside an MIT bundle.
- The Mermaid-input subset may disappoint users who expect full Mermaid compatibility.

### kill criteria

- Week 4-6 technical gate. On the stability track at 50, 100 and 200 nodes, each single edit (add node and edge, add cross-group edge, remove edge, lengthen a label) must move at most 5% of existing leaves by more than one node height, with translation removed. After a 20-edit script, edge-length and crossing inflation must stay at or below 20% versus a fresh layout. If this isn't met by week 6, even with freeze-and-insert, drop the stability claim and either reposition as "benchmark plus layout library" or stop.
- 30 days after launch: fewer than 500 combined stars AND fewer than 3 external tool authors engaging (reply, submission or integration). That means the distribution thesis failed: freeze features and keep the benchmark alive at minimal cost.
- Day 90 after launch: fewer than 30 repos (not owned by the user) with a .glyphic/layout.lock updated in at least 2 separate commits. That means no real use: don't build Glyphic Cloud.
- Across at least 200 PRs, fewer than 15% of Action comments get the map opened (measured by hosted-link clicks). That means reviewers don't want the picture: pivot the verified model to agent-facing `glyphic query`, or stop.
- On the fidelity track, the verifier catches fewer than 80% of injected fake edges, or flags more than 20% of true edges. The trust claim is then false: don't ship "verified" badges.
- Month 6: fewer than 5 paying orgs after at least 30 trials. Stop building paid features and monetize through sponsorship only.
- Any time: GitHub ships native, stable, evidence-linked architecture maps in PRs. Stop competing on the surface; become the engine and format others embed.

### roadmap 90 days

- Days 1-3 (Oct 15-18): relicense to MIT in a 2.0 branch. Rewrite the README honestly (remove the overstated claims). Add a deprecation notice to @glyphicjs/mcp-server. Create the DiagramBench repo from the scratchpad generator and stability scripts.
- Weeks 1-2: benchmark scale and stability tracks, with baseline runs of Mermaid 12, D2 (dagre/ELK/TALA), Graphviz, raw elkjs and Glyphic 1.x. Engine skeleton: strict model with validation (duplicates, group cycles, dangling references), bundled Inter with fontkit metrics, resvg-wasm, deterministic SVG.
- Weeks 2-4: anchored engine. Epoch layout: port the ELK knowledge and add handling for cycles between groups. Then freeze-and-insert with VPSC propagation up the hierarchy, incremental libavoid routing plus the ported post-passes, the layout-debt metric, and the lockfile with its git merge driver. The stability track runs as a CI regression gate. Week-4 checkpoint against the kill criterion.
- Weeks 4-5: HTML viewer (semantic zoom, aggregated edge counts, evidence click-through, diff overlay); CLI commands render, check, diff, relayout, timelapse and query; verifier v1 (citations plus aliases, re-anchoring, stale/asserted/contradicted states); workspace and docker-compose extractors.
- Weeks 5-6 (through Nov 25): the glyphic-map skill and its directory listings. Run the LLM-based entrants (Archify, diagram-design, Excalidraw MCP, frontier-model direct SVG) on about $300 of API budget. Send results to tool authors for 7-day review. Render timelapses for 5 monorepos. Build the leaderboard site. Collect 10 human ratings to sanity-check the metrics.
- Week 7, launch Tuesday Dec 1, 2026: DiagramBench v0.1 report, Glyphic 2.0.0, timelapse videos, Show HN, X thread, Chinese and Japanese posts, skills.sh. During launch week, render timelapses on request.
- Weeks 7-9: GitHub Action, with a sticky PR comment, images hosted on an orphan branch, a drift summary when the map wasn't updated, and click instrumentation; list it on the Marketplace. Fidelity track over 10 gold repos (extractor ground truth plus a hand audit) and an injected-fake-edge test for the verifier. Open integration issues with Archify, drawio-skill and pr-lens. Onboard the first 30 opt-in OSS repos.
- Weeks 10-12: Glyphic Cloud beta (GitHub App; public repos free; Team plan at $39/month with a 30-day trial). Badge, drift alerts, weekly structural digest. Recruit 5 design-partner orgs from the waitlist. Publish the lockfile and model format spec v0.1.
- Day 90 (about Jan 13, 2027): decision review against the kill criteria (stars, real lockfile repos, PR comment click-through, verifier catch rate, trial conversions). Then choose: double down on Cloud and IaC extractors (Terraform, k8s, OpenAPI) for the compliance tier; pivot to an engine-and-format play; or wind down to benchmark maintenance only.

### success metrics

- Stability: one edit moves at most 5% of existing nodes by more than one node height at 50-200 nodes, and order Kendall tau is at least 0.95. Today's baseline is 81-100% moved [codebase §3].
- Quality: after a 20-edit script, crossing and edge-length inflation stays at or below 20% versus a fresh layout. Zero edges through unrelated boxes (keep the current result). At most 2 perimeter-detour edges at 100 nodes, down from 8 today.
- Performance and footprint: 100-node SVG plus HTML in under 2 s; thumbnail in under 3 s; peak memory under 500 MB (today 62.7 s and 1.87 GB). Install under 15 MB with no native dependencies (today 65 MB). Model schema at or under 1.5k tokens (today 7k-14k).
- Determinism: byte-identical SVG and PNG across machines, timezones and locales (today 0 of 5 gallery PNGs match).
- Verifier: catches at least 90% of injected fake edges and flags at most 10% of true edges as unverified on the fidelity track.
- Agent cost: an update costs at most 1 repair round and at least 10x fewer tokens than full regeneration on the cost track.
- Adoption: 1,000 combined stars 30 days after launch; 3,000 by month 6. Skill in the skills.sh top 200 by installs. At least 5 external benchmark submissions or corrections. At least 1 external tool embedding the engine or reading the lockfile format by month 6.
- Real use: 100 repos with a lockfile updated in at least 2 commits by about mid-March 2027. At least 30% of them still updating 30 days later. At least 25% click-through on the map in PR comments.
- Revenue: first paying org by month 4; $1k MRR by month 9; $300/month from sponsors by month 6.

### premises challenged

- The user's original premise, "AI can't draw diagrams, so sell a better engine": rejected. Drawing is eroding as a problem, because agents will just call elkjs, TALA or Graphviz [tech §2]. Layout as a business just failed: Terrastruct shut down and Structurizr's cloud closed [market §2.4]. What doesn't erode is perception limits, trust and time.
- The user's revised premise, "models are fine for small and medium diagrams": half true. They are fine for looks, not for truth. Invented edges are the main failure at any size [tech §0.4; demand §1.6]. Small diagrams are not solved; they are solved visually.
- "Large diagrams need a better single-canvas layout" (implicit in the repo and the hero image): rejected. Routing is already fine: 0 edges through boxes, detour ratio about 1.0. What fails is placement, cycles between groups and the information design itself [codebase §3, §6.1]. No engine makes a 150-node canvas readable [tech §1]. The answer is views plus a stable mental map.
- The lead's pivot, "architecture diff for PR review" as the product: rejected as a product, kept as a surface. At least 6-8 entrants shipped it in 2026 (pr-lens, CodeBoarding, Groma, ArchLens, Eraserbot, gh-aw) and CodeRabbit bundles diagrams for free [market §3; demand §3]. Diff is a feature of a stable, verified model.
- The lead's "policy checks as the paid feature": rejected as the lead feature. drawio-skill ships CI architecture rules free under MIT, and dependency-cruiser, ArchUnit and Nx exist [market §3; demand §4]. Policy is only worth paying for on verified edges, bundled with hosted history.
- The repo's "18 diagram types" as a strength: rejected. There are 4 render paths, and breadth doesn't separate winners (Archify has 10 types, diagram-design 44) [codebase §5.1; market §2.1]. Cut to one graph path.
- The repo's MCP server plus a PNG on the Desktop as the delivery: rejected. Skills won distribution, and AWS replaced its diagram MCP with a skill [demand §1.1]. PNGs above about 30 nodes are unreadable to the agent itself (downscaled to 2576 px) [codebase §3].
- The repo's FSL license as protection: rejected. There is no adoption to protect, and FSL blocks embedding by skills [market §2.4; tech §4].
- The repo's claims of "byte-identical", "validated before it draws" and "safe by construction": shown false by the audit [codebase §5]. A product sold on trust has to start with an honest README.
- The tech report's "deterministic extraction breadth" as the moat: partly rejected. Racing on extractor count is a grind that others already run (CodeBoarding, KubeDiagrams, inframap). The durable part is a language-agnostic verification protocol (alias-grounded citations) that checks any proposer's claims. Existing extractors become inputs.
- The tech report's suggestion of TALA as a backend: deprioritized. TALA's randomness rules it out for diffs, and it adds Go/WASM weight; it is at most an optional backend for static views.
- "Render, look, fix" with vision: rejected as the self-check. VLMs fail at line crossings (TraversalBench [tech §0.5]). Defects must be computed geometrically and handed to the model as text.
- "Stars equal success": rejected as the north star. Archify has about 84k stars and no revenue, and ChartDB has about 23k stars and $1K collected [market §2.5]. The north star is repos whose lockfile keeps getting updated. Stars are a leading indicator only.
- "Lab-native visuals kill this": rejected. Claude and ChatGPT visuals are stateless and per conversation. They commoditize exactly the part this strategy abandons, and push value toward state and verification.

## Judge: oss-veteran

**Winner:** Proposal 3 (contrarian, Truemap), narrowed and re-pointed. It is not a diagram linter for doc hygiene. It is a set of architecture guardrails for agent-written code, and it scores only the claims it can actually check. It wins because it is the only plan that (a) one person can ship in about 6 weeks with no unsolved research, (b) sits on a constraint models can't remove (a generator can't certify itself, so a deterministic independent check is needed), (c) complements the 84k-star leader instead of fighting it, and (d) points at the strongest measured pain, review of AI-written PRs. Its weaknesses are the weakest monetization and almost no reuse of the existing Glyphic engine, so the synthesis below grafts in services revenue and a later path back to the engine.

### Proposal 1, distribution: Glyphic Maps, a zoomable repo map from a /map skill, with README badge, share links, Atlas and DiagramBench: total 25

Demand 4 · durability 3 · solo feasibility 2 · OSS growth 6 · monetization 3 · asset leverage 7

**Fatal flaw:** This is a head-on 'better Archify' launched against an 84k-star leader that ships fast and already has the features this plan counts on as the gap. GitHub code search of tt-a1i/archify shows README/ROADMAP/CHANGELOG entries for 'Architecture Delta' (Before/Delta/After PR-review snapshots), focus/trace and 'Semantic Lens/Flow' views. Its blind test (experiments/v3-mermaid-validation/RESULT.md) found engine auto-layout plus CSS 'not meaningfully better' than stock Mermaid. So the wedge, auto-layout plus zoom for big systems, serves a low-intensity need (30-50 thumbs-up on Mermaid's layout issues) that the leader tested and dropped. On top of that, the 6-week scope is about six products for one person.

**Best idea to keep:** The distribution machinery: skill-first one-line install, zh/ja READMEs and posts, a README badge whose adoption can be counted with GitHub code search (no telemetry), a beta with 20 maintainers before launch, and the footer link on every artifact.

**Unsupported claims:**
- 'The job Archify explicitly skips': Archify already ships interactive focus/trace, Semantic Lens/Flow views and Architecture Delta (checked via GitHub code search). Its own experiment rejected engine auto-layout on looks.
- 'Every arrow is checked against the code': the verifier only confirms that a cited string appears in a cited line range. That checks citations; it is not independent verification, and Archify already has git-verified file:line evidence.
- 'One agent call instead of 25 repair rounds', '≤2 fix rounds at p90', 'repair tokens ≤1/3 of Archify's': none of these were measured.
- '<15 MB install' and '≤300 KB HTML at 100 nodes': targets only, with no prototype behind them.
- A 30-repo Atlas (kubernetes, vscode, next.js...) mapped accurately and checked by maintainers inside a week. The token cost and accuracy of mapping repos that size are not addressed.
- '200+ stars in 24h reaches daily Trending' is background knowledge. '1,000 stars in 14 days, 3-5k by day 90' has no basis given Glyphic's past launches.
- Share links where 'we store nothing, cost roughly zero', next to a glyphic.dev/owner/repo auto-generation service and a hosted Cloud with private state.
- That Archify would embed or credit Glyphic's engine. No evidence.
- glyphic.dev availability is unverified.

### Proposal 2, revenue: Glyphic Layout, an open-core layout engine for React Flow with a $49/mo Pro license (stable mode, collapse, big-graph mode): total 28

Demand 3 · durability 5 · solo feasibility 5 · OSS growth 3 · monetization 5 · asset leverage 7

**Fatal flaw:** There is no evidence anyone will adopt a third-party layout library for this, let alone pay for one. Coding agents wire elkjs or dagre into React Flow in an afternoon, and the only Pro feature worth paying for (stable incremental compound layout) is unsolved research: Proposal 4's spike found ELK's interactive modes still move 15-100% of nodes. The proposal also gives up the user's main goal, a successful OSS project. React Flow auto-layout libraries on GitHub top out around 13 stars (Jalez/react-flow-automated-layout), which shows little pull for the library itself.

**Best idea to keep:** Validate before building anything paid: contact 30 teams, run 10 calls, require pre-payment by week 3. Sell to people who already pay for dev tooling, and fund the early months with fixed-fee integration or setup work instead of betting on SaaS seats. Also worth keeping: the observation that React Flow measures node sizes in the DOM, which removes the text-metrics problem.

**Unsupported claims:**
- The paying persona's layout and stability pain was never measured (the proposal admits this). Payment precedent from yFiles, React Flow Pro and GoJS is about different products with existing distribution.
- React Flow at ~11.2M weekly downloads (an unverified npm snippet), used as the size of the pool.
- That product teams' AI features 'generate or rewrite 10-50 nodes at a time' [BK].
- That xyflow would accept a docs PR or co-market a third-party layout engine.
- 2-3% company-level conversion and a base case of 40 Pro + 5 Business customers: invented.
- That the stability gate (≤10% of nodes move on an n50 insert) is reachable in a few weeks. Evidence elsewhere points to months.
- Sidekiq, AG Grid and MUI X used as analogues were not verified this session, and those products had large free user bases before charging.
- 'Edges never cut through boxes' for arbitrary DOM-sized custom nodes with handles: this was measured only on Glyphic's synthetic graphs.

### Proposal 3, contrarian: Truemap, CI for your architecture diagram. Reflexion-model checks of the repo's own Mermaid against code, run as a PR Action and an agent guardrail: total 29

Demand 5 · durability 6 · solo feasibility 7 · OSS growth 5 · monetization 3 · asset leverage 3

**Fatal flaw:** Static analysis cannot see most of the edges architecture diagrams assert (HTTP, queues, runtime calls), and many README diagrams are conceptual ('User → API → DB'). Output could therefore be mostly 'unverified' noise on a problem that is a vitamin, not a painkiller. The idea also already exists in at least three repos with 0 stars (whaojie797-design/diagram-drift, ijowett17/diagram-drift-check, lnm8910/living-c4-architecture), which signals weak pull for the concept on its own.

**Best idea to keep:** Use the diagram a team already has as a checkable spec. Reflexion verdicts (verified, undrawn, broken, phantom) come with file:line evidence, the overlay is drawn on GitHub-native Mermaid so no layout engine is needed, the CLI makes no LLM calls, 'mode: spec' turns the diagram into a guardrail coding agents must pass, and a data-driven 'Diagram Truth Report' serves as the launch.

**Unsupported claims:**
- 'No direct competitors' was never searched for. GitHub search finds whaojie797-design/diagram-drift (2026-07-30, an agent skill that parses Mermaid and flags missing-in-code, stale-edge and missing-in-diagram), ijowett17/diagram-drift-check (2026-08-17) and lnm8910/living-c4-architecture (2026-02), plus ArchDoc PR #22 and Archify's Architecture Delta.
- The population of 'mappable' diagrams is not measured. Raw code search shows about 125k ARCHITECTURE.md files containing 'flowchart' and 'mermaid', so raw volume looks fine, but mappability is unknown.
- Precision of ≥85-90% on BROKEN/UNDRAWN for diagrams dominated by runtime edges. Unknown.
- 'Stability comes for free because the human's text is the layout': overlays use index-based linkStyle, which is fragile, and new or undrawn nodes trigger a Mermaid re-layout. GitHub's Mermaid version and overlay support were not tested.
- Agents read architecture docs through AGENTS.md and are misled by stale diagrams [BK]. Plausible, but unmeasured.
- Billing through GitHub Marketplace and SARIF on private repos needing GHAS [BK].
- The Truth Report reaching the HN front page, and $800-2,500 MRR at month 12: hopes.
- Reflexion models (Murphy, Notkin and Sullivan, 1995) are a real reference but flagged [BK].

### Proposal 4, moat: Glyphic 2, the architecture lockfile. A stable anchored layout plus an alias-grounded verifier, diff/timelapse views and DiagramBench: total 27

Demand 4 · durability 7 · solo feasibility 2 · OSS growth 5 · monetization 3 · asset leverage 6

**Fatal flaw:** All the value rests on new stable-incremental compound-layout research that the author's own spike (scratchpad stab/spike2.mjs) shows ELK cannot provide. It is budgeted at about 3 weeks inside a 6-week plan that also builds a verifier, an HTML viewer, six CLI commands, a skill, a lockfile merge driver and a 12-entrant benchmark. The visible payoff, stable diffs, is already approximated by Archify's Architecture Delta, pr-lens's seating rule and drawio-skill's coordinate-preserving sync.

**Best idea to keep:** Two-tier evidence labels ('extractor-proven' vs 'cited/asserted'), never a bare 'verified'. A text 'query deps' answer for agents. Pre-publication review of benchmark results with each entrant's maintainers. Architecture timelapses as a visible, shareable demo of stability, saved for later once there is an installed base.

**Unsupported claims:**
- A stability engine (freeze-and-insert, VPSC propagation up the hierarchy, incremental libavoid routing, layout-debt metric, git merge driver) in weeks 2-4. The tech report rates this at 3-5 months, and the spike found no off-the-shelf path.
- That WebCola's VPSC (last release 2019) handles nested hierarchical propagation acceptably. Untested.
- That libavoid-js (0.5.0-beta.5) is production-ready for incremental routing.
- Alias-grounded 'verified' edges: this is string matching, and the proposal itself admits the false-confidence risk.
- 'Motion sells stability, where only Glyphic wins': Archify Delta reports 'moved' facts, pr-lens has a stability rule, drawio-skill keeps hand-tuned coordinates.
- A 12-entrant benchmark, including LLM tools, for about $300, finished alongside the engine.
- 1,000 combined stars in 30 days, 25% click-through on PR comments, 30% of repos still updating at 30 days.

### Recommended synthesis

THE BET (months 0-12): 'Architecture tests for agent-written code.' An MIT CLI, GitHub Action and agent skill. It treats the architecture diagram a repo already has as a checkable spec: Mermaid flowchart or C4 in README/ARCHITECTURE.md/docs, Archify JSON, and LikeC4/Structurizr DSL in month 2. Deterministic extraction produces reflexion verdicts with file:line evidence:
- VERIFIED: a drawn edge the code confirms.
- UNDRAWN: a code dependency between mapped components that the diagram doesn't show.
- BROKEN: an edge whose evidence existed at the last green commit and is gone.
- PHANTOM: a node that maps to nothing.
- DECLARED: a runtime edge the team has acknowledged.

The output is a sticky PR comment that re-emits the team's own Mermaid with colour overlays, plus a terse text patch the agent can apply. The CLI makes no LLM calls and v1 has no layout engine. 'mode: spec' fails CI when an agent adds an undrawn dependency.

FIXES FOR THE FATAL FLAWS:
1. Score only checkable claims. Use Proposal 4's two tiers: 'extractor-proven' vs 'declared'. Runtime arrows (HTTP, queues) are declared with '%% truemap: runtime' and kept out of the score until evidence exists. The badge reads like '12/12 checkable arrows verified · 3 declared', never a shaming '4/15'. In month 3, add OpenTelemetry/Jaeger service-graph import plus compose/k8s/env-URL heuristics so runtime edges become provable.
2. Lead with the guardrail, not stale docs. The skill makes Claude Code, Codex or Cursor read the diagram as constraints before coding and run 'check' afterwards. Target agent-heavy teams, the B-grade pain: review time is up 49-91%.
3. Don't write extractors; wrap mature ones. dependency-cruiser for JS/TS, grimp from import-linter for Python, 'go list -deps', 'docker compose config', 'helm template', and terraform plan JSON. The new value is the mapping (auto-drafted, reusing validation.ts's Levenshtein did-you-mean, then refined by the user's own agent), the verdicts, and the PR experience. That cuts v1 to about 4 build weeks.
4. Widen the population with 'init'. For repos without a diagram, draft a Mermaid diagram from verified facts, with the agent only naming the groups. This is the one generator move, and it is differentiated because the diagram is verified by construction. Mermaid 12's ELK default and GitHub render it, so no engine is needed.
5. Be the checker for the leader: 'Archify draws it, Truemap checks it.' Ingest Archify JSON and verify its evidence independently. Archify's own issue #614 (unreachable modules drawn as live) is the case study.
6. Prior art (three 0-star drift tools) means distribution and precision decide the outcome. Talk to those authors in week 1, and out-ship them on precision, UX and launch.

DISTRIBUTION (Proposal 1's machinery plus Proposal 3's data launch):
- Pre-launch: Wizard-of-Oz truth reports and about 30 helpful fix PRs/discussions; a 20-maintainer beta; zh/ja READMEs.
- Launch on Tue Dec 8 2026, or Tue Jan 12 2027 if gates slip; avoid the holiday lull. The 'Diagram Truth Report' scans 500-1,000 repos with ≥500★ and Mermaid architecture diagrams, plus an AI-generated-docs track (DeepWiki/Archify/Code Wiki on about 25 repos). Use Proposal 4's pre-publication review with the tool authors, an opt-out, and kind framing.
- Channels: Show HN for the report, an X thread of overlay screenshots, Juejin/V2EX/Zhihu and Zenn/Qiita, skills.sh and the plugin directories, GitHub Marketplace.
- Loops: the badge, the sticky comment seen by every contributor, and agent-written PR descriptions that mention the check.
- Reputation: upstream Glyphic's ELK post-passes to Mermaid 12 and beautiful-mermaid. That is the highest-leverage use of the old engine.

GLYPHIC 1.x: relicense MIT, publish an honest post-mortem that retracts the overstated claims (good launch content), deprecate the npm packages with a pointer, archive the repo. First check who the ~79 weekly downloads and the glyphic.web.app users are, and email them.

MONEY (honest side income):
- Everything that runs locally or in CI is free and MIT.
- From month 1, fixed-fee services (graft from Proposal 2): 'Architecture guardrails setup', $1,500-3,000, at most one a month. Map the team's diagram, wire mode: spec, add an extractor for their stack. This is the most likely real money in year 1, and it teaches the requirements.
- Month 3-4, a hosted GitHub App for private repos at $39/org/mo: no YAML, an org truth dashboard, drift alerts, 'broken since <sha>' history. Build it only after ≥3 pre-pays.
- Sponsors: dev-tool companies only. No LLM-reseller slots, which would hurt a truth brand.
- SOC 2 audit-evidence export at $490/yr, only if 3 design partners confirm their auditor wants it.
- Expect $300-1,500/mo by month 6 including services, and $1-3k/mo by month 12. Not a salary.

PHASE 3 (months 6-12), only if ≥100 repos run the Action for ≥14 days: bring the Glyphic engine back as the view layer over verified facts. That means stable pinned layout of the verified model, PR diffs in whole-system context, and Proposal 4's architecture timelapses. The moat path then gets built on real users and data instead of speculation.

GATES:
- Week 2: population and precision probe.
- Week 4: ≥85% precision on BROKEN/UNDRAWN over 50 hand-labelled diagrams.
- Pre-launch: ≥8 of 30 fix PRs engaged or merged.
- Launch + 14 days: ≥300 stars or ≥20 repos with the Action.
- Day 90: ≥50 repos active ≥14 days, <50% removed within 30 days, ≥3 pre-pays.
- If gates fail: maintenance mode, keep the upstream Mermaid contributions.

CAPACITY: the plan assumes about 25-30 h/week. At about 10 h/week, double the timelines and drop Python and Archify ingest from v1.

NOTE: web search was exhausted during this evaluation. New facts here (Archify's Delta and views, its layout experiment, the drift-tool clones, the ARCHITECTURE.md counts) come from GitHub code and repo search on 2026-10-15.

### What everyone missed

- Archify already ships the PR-diff and 'views' features that Proposals 1 and 4 treat as open ground. Its README and CHANGELOG describe 'Architecture Delta': validated Before/Delta/After snapshots with a machine receipt for design or PR review, including 'moved' facts. Its ROADMAP describes Semantic Lens/Flow views and JSON IR with 'stable layout inputs' for targeted edits. The 84k-star leader is moving into exactly these wedges and shipping fast (v2.16 by Aug 30).
- Archify ran a blind visual-quality experiment (experiments/v3-mermaid-validation/RESULT.md). Mermaid dagre auto-layout plus Archify CSS was 'not meaningfully better' than stock Mermaid, while Claude-placed layout won. The leader tested engine layout on real small diagrams and dropped it on looks. Any pitch that leads with the engine has to win on scale or stability, proven by human ratings, not by geometry metrics.
- The 'verify the diagram against code' idea already exists in at least three repos with 0 stars: whaojie797-design/diagram-drift (a Mermaid-vs-code drift skill, 2026-07-30), ijowett17/diagram-drift-check (a GitHub Action, 2026-08-17) and lnm8910/living-c4-architecture (Structurizr vs docker-compose, 2026-02). The concept is obvious and has not drawn pull on its own. Precision, framing and distribution decide it.
- Extraction is largely a solved commodity: dependency-cruiser, madge, grimp/import-linter, go list, docker compose config, helm template, terraform graph/plan JSON. Every proposal budgets weeks to write extractors instead of wrapping these and spending the effort on mapping, verdicts and PR UX.
- Agents are mass-producing in-repo architecture diagrams. GitHub code search returns about 125k files named ARCHITECTURE.md containing 'flowchart' and 'mermaid' (raw count, including forks and duplicates). That is both the population for a checker and the source of drift, and no proposal measured it.
- The main reader of architecture docs is increasingly the coding agent, and LLMs gain little from better layouts (CGF 2026). A verified, machine-readable architecture spec in agent context may matter more than any picture. Nobody proposed a benchmark of the effect: do agents given the spec introduce fewer forbidden dependencies on real tasks? That benchmark would be both proof and launch content.
- Fixed-fee services (setup or audit) are the fastest honest money for a solo maintainer of a niche dev tool. Only Proposal 2 mentioned it, briefly. The others rely on SaaS tiers in a category where willingness to pay is rated about 2/5.
- Founder capacity and motivation: the repo has had no push since July, yet every plan assumes about 6 full-time weeks, multilingual launches and Discord upkeep. Nobody asked the user's hours per week, or whether they would enjoy building a verifier rather than a renderer.
- Existing users: about 79 weekly npm downloads and a hosted MCP on glyphic.web.app. Nobody proposed checking npm dependents or hosting logs, or contacting those users before deprecating everything.
- Mermaid 12 now uses ELK by default, so upstreaming Glyphic's post-passes (edge separation, jog collapse, label-aware sizing) could improve millions of renders and make the user's name known in the exact community they need. Only Proposal 3 mentioned it, as an aside.
- GitHub-native Mermaid overlays (index-based linkStyle, classDef) are fragile under edits, and GitHub's Mermaid version lags upstream. The PR-comment UX that Proposal 3 relies on, and the README-SVG plans in the others, were never tested in a real PR comment.

### First two weeks

- Day 1: Agree with the user on hours per week, the success definition (adoption vs MRR) and whether a verifier excites them. Relicense core from FSL to MIT. Draft the honest post-mortem. Before deprecating anything, check npm dependents of @glyphicjs/* and the glyphic.web.app MCP logs, and email any real users.
- Days 1-3, population probe: using GitHub code search, sample 200 Mermaid architecture diagrams from repos with ≥500★ (README, ARCHITECTURE.md, docs/). Hand-classify each diagram as conceptual or mappable, and each arrow as statically checkable (import, workspace, compose, k8s) or runtime. Gate: ≥30% of diagrams mappable, and ≥50% of their arrows statically checkable.
- Days 2-4, competitor teardown: run whaojie797-design/diagram-drift, ijowett17/diagram-drift-check, living-c4-architecture, Archify's Architecture Delta, drawio-skill's CI rules, the CodeBoarding Action and dependency-cruiser on 3 sample repos. Write a one-page gap table. Message the three drift-tool authors to learn why they got no pull and whether to collaborate.
- Days 3-7, Wizard-of-Oz demand test: by hand (agent plus dependency-cruiser/grimp), produce truth reports for 20 popular repos' diagrams. Open discussions or fix PRs on 10 of them, offering the corrected diagram. Gate: ≥4 of 10 positive engagements (reply, merge, or 'we'd use this').
- Days 4-10, 10 interviews with tech leads of agent-heavy teams (from Claude Code/Codex/Cursor communities on X and Discord). Show a mocked sticky PR comment and a 'mode: spec' failure. Ask: would you turn on blocking? Pay $39/mo for private repos? Pay $1.5k for setup? Gate: ≥3 would enable blocking and ≥2 commit as design partners or pre-pay.
- Days 6-12, technical spike:
- Parse Mermaid flowcharts (try mermaid's own parser headless first, then a tolerant subset).
- Wrap dependency-cruiser, grimp and 'docker compose config'.
- Auto-map labels to code units, reusing validation.ts's Levenshtein did-you-mean.
- Compute verdicts on 50 hand-labelled diagrams.
- Post a real PR comment with linkStyle/classDef overlays to confirm GitHub renders them.
Gate: ≥85% precision on BROKEN/UNDRAWN, ≥60% of nodes auto-mapped.
- Days 10-14: check the name (Truemap is a placeholder) against npm, GitHub org, domain and trademark. Open a Mermaid discussion offering the ELK post-passes upstream. Write a day-14 go/no-go memo against the gates. If population or precision fails, fall back to verifying AI-generated docs only (Archify JSON, DeepWiki), or stop. If demand gates fail but precision passes, ship it as a small MIT tool without paid plans.

## Judge: staff-engineer

**Winner:** Proposal 4 (moat: the architecture lockfile) wins on thesis, but only re-scoped. Its technical bets (stable placement, verified edges, state in git) are the only ones that hold up as next-generation models arrive. Its scope and its choice of moat are both wrong. Fix it with Proposal 3's reflexion verifier and text-first PR comment, Proposal 1's skill and README distribution, and Proposal 2's validation gates and zero-inference economics.

### distribution: Glyphic Maps, a /map skill that writes a zoomable, code-checked HTML repo map with a README badge, share links, an Atlas of famous repos and a benchmark: total 29

Demand 6 · durability 4 · solo feasibility 3 · OSS growth 7 · monetization 3 · asset leverage 6

**Fatal flaw:** It launches as another repo-map skill into Archify's exact audience (84.0k stars; I fetched the README today) and DeepWiki/Code Wiki's. Its only edge is auto-layout plus zoom, which any skill can add with ELK in weeks. Archify's README says leaving out auto-layout is a deliberate choice, not a gap it is asking someone to fill. The 'verified' claim is a citation check (the cited line contains a match string), not proof that the edge exists. The skill re-explores the repo on every run, so node ids drift and maps can't be compared or kept current. Meanwhile, 6 weeks of solo time goes into hierarchical layout, a semantic-zoom viewer, a verifier, share links, an OG-card worker, Mermaid import, a 30-repo Atlas, a 6-contender benchmark and READMEs in 3 languages.

**Best idea to keep:** Packaging and loops: one-command skill install; a self-contained HTML map; a ≤40-node README SVG; a badge such as '41 edges · 37 verified', where the verified count itself is the marketing; computed defects returned as text instead of PNG self-checks; launch through X and Chinese/Japanese developer channels instead of HN-first.

**Unsupported claims:**
- '≤2 fix rounds at p90' and 'repair tokens ≤1/3 of Archify's': nothing was measured
- 'A local-first tool that runs inside your own agent on private code has no free incumbent': false. Archify runs locally in the user's agent on private code, for free.
- Archify might embed the Glyphic engine or welcome an import path: its README calls 'layout judgment over generic auto-layout' a deliberate choice
- '200+ stars in 24 hours reaches daily GitHub Trending' (background knowledge, unverified)
- 30 Atlas maps checked by their maintainers in the 5 days between day 35 and launch
- 'US Thanksgiving week barely affects these channels'
- The evidence verifier (file exists, line range valid, match string present) is called verification. It only proves a citation exists, not that the dependency does.
- Semantic zoom where 'nothing seen at one level disappears at the next', plus ≤300 KB at 100 nodes, all within a 2-week viewer slot

### revenue: open-core auto-layout for React Flow (MIT engine plus a $49/mo Pro license for stable incremental layout, collapse and big-graph mode): total 27

Demand 3 · durability 4 · solo feasibility 5 · OSS growth 3 · monetization 5 · asset leverage 7

**Fatal flaw:** It sells something the user doesn't have to a buyer nobody has found. The free tier, one-shot ELK layout for React Flow, is what a coding agent produces in an afternoon from React Flow's own elkjs example. Stable placement, the paid feature, turns out to be cheap: my 1-hour freeze-insert-push spike (~120 lines) held average movement to 0-2% with 100% order preserved. So it is neither the moat nor the multi-month R&D the plan budgets for. The genuinely hard part for an interactive editor is live, crossing-aware re-routing while the user drags. libavoid-js took 28 s for 100 nodes with crossing penalties on, and still produced 113 crossings. Add xyflow's own Pro layout examples (platform risk) and the fact that layout libraries don't collect stars, and the plan has neither distribution nor a defensible product.

**Best idea to keep:** Revenue discipline: a week-3 validation gate with pre-pay before writing any paid code; no hosted inference and no customer data on the user's servers; perpetual-fallback licensing; fixed-fee 'integration sprints' as the earliest realistic cash and a source of requirements; counting production dependents instead of stars.

**Unsupported claims:**
- React Flow product teams have recurring layout or stability pain they would pay for (no research measured this; the proposal admits it)
- ~11.2M weekly @xyflow/react downloads (unverified; the npm downloads API is blocked here)
- 'An agent will not deliver add-one-node-nothing-else-moves': my spike3 did it in about 120 lines
- 'Stable mode is 4-8 weeks of uncertain R&D': placement is cheap; live crossing-aware routing is the expensive part
- 2-3% conversion at company level and '$49 sits under card-expense thresholds' (background knowledge)
- The xyflow docs will accept a Glyphic PR, or xyflow will co-market, while it sells auto-layout and expand/collapse Pro examples
- GoJS releases, Sidekiq, AG Grid analogies used as evidence of demand for this product
- libavoid can be 'loaded as a separately replaceable WASM module' as a licensing answer: workable, but the MPL alternative @joint/router-avoid is itself a wrapper around LGPL libavoid-js 0.4.5 plus @joint/core (checked with npm view)

### contrarian: Truemap, CI that checks the repo's existing Mermaid architecture diagram against the code (reflexion models: verified, unverified, broken, undrawn, phantom) and comments on PRs: total 30

Demand 5 · durability 7 · solo feasibility 7 · OSS growth 5 · monetization 3 · asset leverage 3

**Fatal flaw:** The arrows that matter are invisible to the evidence it collects. Architecture diagrams mostly draw runtime edges (HTTP, gRPC, queues, managed services). Import and workspace analysis can't see those, so on real service diagrams it either flags most arrows UNVERIFIED (noise that gets the Action uninstalled) or verifies only trivial package-import arrows (no value). It also depends on a population nobody has measured: existing README Mermaid diagrams whose boxes map to code units, when many are conceptual. It is a vitamin by its own admission: nobody asked for it. It also throws away the user's engine and brand, which makes it the plan they are least likely to stay motivated on.

**Best idea to keep:** Use the reflexion-model computation (Murphy/Notkin/Sullivan 1995) as the verifier. Keep a high-level intended model and a mapping to code, compute convergence/divergence/absence deterministically, and let the LLM draft only the mapping. Also keep: the text-first PR comment ('this PR adds billing→auth-db at billing/src/x.ts:42, which your diagram doesn't show'); the opt-in `mode: spec` guardrail that fails CI on undrawn dependencies; a truth benchmark instead of a layout leaderboard; upstreaming the ELK post-passes to Mermaid.

**Unsupported claims:**
- 'Stability comes for free because the human's text is the layout': Mermaid re-runs layout on every render, and drawing UNDRAWN edges into the overlay changes that layout
- The population of mappable diagrams (≥2,000 repos, ≥60% of nodes auto-map): unmeasured. I could not check either: GitHub code search is blocked in this session.
- ≥85-90% precision from fuzzy label-to-package auto-mapping
- No direct drift-checker competitors (no search was run; mine was also blocked because the shared search budget was exhausted)
- Auditors want evidence-backed diagrams, so a $490/yr audit add-on
- Teams will pay $39/org/mo for a dashboard of truth scores
- GitHub renders linkStyle/classDef overlays in PR-comment Mermaid as described (background knowledge; probably true, but not tested)

### moat: Glyphic 2, the architecture lockfile (a stable, evidence-verified system map in git, anchored layout, diff and timelapse, with DiagramBench as the launch asset): total 33

Demand 5 · durability 7 · solo feasibility 4 · OSS growth 6 · monetization 4 · asset leverage 7

**Fatal flaw:** It builds three research-grade systems before it has one user: an anchored compound-layout solver with VPSC, incremental libavoid routing and a lockfile merge driver; a verifier; and a semantic-zoom diff viewer, plus timelapses and a 12-entrant benchmark, in 6 weeks. And it puts the moat in the wrong place. My spike3 shows freeze-insert-push placement is about 120 lines: 0-2% average movement, 100% order preserved, small quality drift after 20 edits. So stability is a feature anyone can copy, not a moat. The real costs are (a) routing around frozen boxes, which gives up the measured asset: Glyphic's 0-edges-through-boxes comes from ELK INCLUDE_CHILDREN, the least stable mode; (b) keeping node ids stable from extraction; (c) runtime edges the 'alias-grounded' string-match verifier can't really prove. The plan also has an engineering bug: GitHub does not run custom git merge drivers when merging PRs (background knowledge), so the .gitattributes lockfile merge driver doesn't help on the merge button.

**Best idea to keep:** The thesis: build on constraints that don't erode as models improve (human perception, trust independent of the generator, state across commits). A model plus lockfile committed in git that the agent updates and never regenerates. Text output for agents (`glyphic query deps X --json`, defects.json). Charge only for hosted state, never for rendering. 'Show motion, not stills' to sell stability. The kill criterion on PR-comment click-through.

**Unsupported claims:**
- 'A funded team could copy [stability] in about 6 months. A prompt cannot.': my 1-hour spike reached the proposal's own ≤5% average-movement gate on placement
- Ship gate '≤5% moved per edit' presented as hard: the average is easy, but per-edit maximums hit 7-30% when a push shifts a region, and nobody measured routing quality under frozen boxes
- A ~$300 API budget covers Archify and other LLM entrants at 50-200 nodes, when Archify #22 reports 'tens of millions of tokens'
- An alias-grounded verifier (the cited line contains an alias) presented as trust: it is string-level, which the proposal half-admits
- @joint/router-avoid as an MPL-2.0 alternative to LGPL libavoid: it depends on libavoid-js 0.4.5 (LGPL) and @joint/core
- A .gitattributes merge driver resolves lockfile conflicts: drivers need local git config and are not run by GitHub's server-side merge (background knowledge)
- Timelapses of Vite/Nx/Turborepo/Babel/Astro workspace graphs will go viral: those are mostly flat package graphs, and Nx's own `nx graph` already shows them interactively
- The ELK INTERACTIVE numbers ('15-100% moved') are accurate: I re-ran spike2 and got 15% at N=50 and 90-98% at N=100-200

### Recommended synthesis

## The bet: Glyphic 2, a verified architecture lockfile for codebases that agents write

**Pitch:** "Your coding agent keeps a small architecture model in the repo. Glyphic checks every arrow against the code, keeps the picture in place across commits, and tells reviewers in plain text what each PR changed structurally, with file:line evidence."

This is Proposal 4's thesis, rebuilt on cheaper foundations. I tested the foundations today. Spike scripts are in the scratchpad (`stab/spike2.mjs` re-run, `stab/spike3.mjs`, `avoid/route.mjs`, `avoid/route_nocross.mjs`, all under `/tmp/claude-0/-home-user-Glyphic/b81316dc-70f2-5510-bd50-0c3bd46253e5/scratchpad/`).

**1. Placement stability is cheap, so it is a feature, not the moat.**
- The test was 20 random edits on synthetic 50/100/200-node graphs.
- Fresh hierarchical ELK layout every time moves an average of 25/26/57% of boxes by more than one node height per edit, after removing global translation.
- "Freeze + insert-next-to-neighbour + push-down" moves an average of 2/0/1% (worst single edit 30/7/13%) and keeps 100% of pairwise order.
- After 20 edits, quality cost against a fresh layout is small: edge length -13% to +4%, canvas area -13% to +17%, upward edges +1.5 percentage points. These are proxy metrics, measured without routing.

**2. The real cost of stability is routing.**
- libavoid-js 0.5.0-beta.5 routed all 132 edges of the frozen 100-node layout with 0 edges through unrelated boxes. Without a crossing penalty it took 448 ms and produced 206 crossings. With one it took 28.4 s and produced 113 crossings.
- For comparison, ELK INCLUDE_CHILDREN produced 64 crossings at n100 in the codebase audit, on a similar graph.
- So stable maps cost roughly 2-3x the crossings unless you pay seconds of compute. Glyphic's "0 edges through boxes" asset comes from the least stable ELK mode: adding one cross-group edge moves 94-100% of boxes; I confirmed this by re-running spike2.

**3. Therefore the moat is not the solver.** It is:
- (a) a verifier and fact-extractor corpus independent of the generator;
- (b) per-repo state and history in git;
- (c) a format that other tools emit or read;
- (d) distribution.

### What v0.1 is (about 6 weeks at 20 h/week; cut everything else)

1. **Model.** `.glyphic/model.yaml`, with a schema of 1.5k tokens or less that lives inside SKILL.md.
   - Contents: nested nodes; `maps:` (globs, workspace packages, compose services, hostnames, env vars); edges with `kind` (import/http/queue/db).
   - Ids derive from the mapping wherever possible, so a regenerated model keeps its ids.
   - The skill's rules: update the model, never regenerate it; keep ids; read the text report, not the PNG; run `glyphic check` before committing.
   - Mermaid flowchart import/export is a secondary input, not the core.
2. **Facts (deterministic, no LLM).**
   - Wrap existing MIT tools instead of writing parsers: dependency-cruiser 18.6.0 (JS/TS module resolution, already solved), pnpm/npm/yarn workspace graphs, and docker-compose (`depends_on`, URL hostnames in env vars).
   - Add a small SDK catalog (pg, ioredis, kafkajs, @aws-sdk/client-s3, stripe, openai) for edges to external systems.
   - Python (grimp or import-linter's engine), Go (`go list`), k8s/Helm and OpenAPI come in months 2-4.
3. **Verdicts (Proposal 3's reflexion engine).**
   - Evidence tiers: `verified:extractor`, `verified:config`, `cited` (file:line pinned, re-anchored, never called "verified"), `unproven` (runtime edge with no static evidence; shown dashed, never "wrong"), `undrawn` (a code dependency between mapped nodes that is missing from the model), `stale` (evidence existed at the last green commit and is gone).
   - Report a truth percentage and a coverage percentage.
   - Being honest about tiers is what keeps the runtime-edge problem from producing noise.
4. **Layout.**
   - Epoch layout uses Glyphic's ported ELK knowledge, run per group: label sizing, group-cycle-aware ordering (the actual cause of the hero image's around-the-world edges), and the 13 regression tests as fixtures.
   - Between epochs, freeze, insert and push (spike3).
   - Routing uses libavoid-js loaded as a separate LGPL WASM file, with no crossing penalty by default. Recompute crossing and edge-length debt each run, and suggest `glyphic relayout` as its own reviewable commit when debt exceeds about 25%.
   - The lockfile is one sorted line per node. On a merge conflict, `glyphic lock --repair` re-inserts the conflicted nodes. Don't use a merge driver; GitHub won't run it.
   - Bundle Inter with real font metrics, use resvg-wasm with `loadSystemFonts:false`, and turn shadows off.
5. **Outputs.**
   - Text and JSON reports with exit codes, for agents.
   - A PR comment that leads with sentences plus file:line, with an SVG/PNG crop of the changed region on the stable layout underneath.
   - A self-contained HTML map: pan, collapse/expand groups with aggregated edge counts, an evidence panel, and a verified/unproven legend. Leave fancy semantic zoom for later; elkjs 0.12 ships top-down layout options I haven't tested, and the repo is still on 0.9.3.
   - A README overview SVG of 40 nodes or fewer.
   - `glyphic query deps <id> --json`, plus a generated ARCHITECTURE.md section for agent context.
6. **Surfaces.**
   - The skill: `npx skills add MS-Teja/glyphic`.
   - The CLI.
   - A GitHub Action: warn-only by default, with opt-in `mode: spec`, which fails CI when an agent adds an undrawn dependency across a declared boundary.
   - No hosted service, no MCP, no PNG saved to the Desktop.

**Explicitly out of v0.1:** Atlas, share links, timelapse, the full DiagramBench leaderboard, Cloud, semantic zoom, IaC, Python, Go.

### Distribution (what each proposal contributes)

- **Launch headline (Proposal 3's idea, made cheaper):** "How often do AI architecture diagrams invent edges?"
  - Run DeepWiki, gitdiagram, Code Wiki and (selectively, with token cost logged) Archify output on about 15-20 repos, and compare against deterministic facts. The verifier is the harness, so this costs little.
  - Send results to each tool's authors 7 days before publishing.
- **Upstream reputation:** port one or two post-passes (overlapping-edge separation, subgraph overlap) to Mermaid 12's ELK layout. ELK is now Mermaid's default, and its top layout issues (#5420, #4990) are the ones these passes address.
- **Proposal 1's loops:** listings on skills.sh and the plugin directories; a badge ("architecture: 37/41 arrows verified"); an X GIF of a PR comment catching an agent-added billing→auth-db dependency; posts on Juejin, V2EX, Zenn and Qiita.
- **Complement, don't compete:** offer a "verify your Archify JSON" adapter and LikeC4/Structurizr import/export in months 2-4.

### Money (Proposal 2's discipline; honest numbers)

- **Free forever, MIT:** engine, CLI, skill, Action, format. Relicense core from FSL now; the git log shows the user wrote all 50 commits.
- **Sponsorship:** GitHub Sponsors now. One disclosed dev-tool sponsor slot once the repo passes about 2k stars. No LLM-reseller slots, which would undercut a truth brand.
- **Hosted GitHub App for private repos** (history, drift alerts, cross-repo org map, Slack), $29-39 per org per month.
  - It ingests only the model, facts and evidence hashes, never source code.
  - Build it only after gate G4 below passes.
  - A SOC 2 data-flow export comes later, and only if 3 design partners ask for it.
- **Fixed-fee "architecture map setup" engagements:** $1.5-3k each, at most one a month. This is Proposal 2's integration sprint, and it is the earliest realistic cash.
- **Expectations:** about $0-200/mo by month 3, $300-1k MRR by month 9, and $1-2k MRR at month 12 in the good case. The bear case is about $0. The user should keep their day job.

### Gates (with kill criteria)

| Gate | When | Pass condition | If it fails |
|---|---|---|---|
| G0 | Day 14 | Routing on real repo graphs is acceptable; reflexion on 5 real repos finds at least one real, non-obvious divergence in 3 or more of them; at least 5 of 15 people contacted say they'd run it in CI | Stop and re-plan |
| G1 | Pre-launch | At least 90% precision on verified and undrawn verdicts across 10 hand-labelled repos; `check` under 10 s on 100k LOC | Fix, then re-test |
| G2 | Launch + 30 days | At least 25 external repos with a model committed and updated in 2 or more commits, and at least 500 stars | Freeze features; keep the upstream work and the report |
| G3 | Month 4 | At least 10 repos on `mode: spec`, or at least 15% engagement with PR comments | Reposition the model as agent context only (`query` plus the ARCHITECTURE.md section) |
| G4 | Month 6 | At least 3 orgs pre-pay | Build no Cloud |

### Months 3-12

- Python and Go facts; k8s, Helm and OpenAPI.
- Timelapse as a second launch.
- Semantic zoom with top-down layout.
- Format spec v0.1.
- The Archify, LikeC4 and Structurizr adapters.
- Then the hosted app, only if gates pass.

### What everyone missed

- Placement stability is cheap. That kills two claims at once: Proposal 4's 'stability is the moat' and Proposals 2 and 4's 'months of R&D'. My spike3 (scratchpad `stab/spike3.mjs`) froze positions, inserted new nodes next to a neighbour and pushed down. Over 20 random edits it averaged 0-2% of boxes moved by more than one node height (worst edit 7-30%), kept 100% order, and drifted modestly in quality. A fresh hierarchical ELK layout moved 25-57% on average.
- Glyphic's measured asset and the proposed moat pull against each other. '0 edges through boxes' comes from ELK INCLUDE_CHILDREN global layout. That is the least stable mode: I re-ran spike2, and one cross-group edge moves 94-100% of boxes at 50-200 nodes. Stable maps require routing around frozen boxes, which means libavoid-js and re-porting the post-passes. My test (`avoid/route.mjs`): 0 edges through boxes, but 206 crossings in 448 ms, or 113 crossings in 28.4 s with a crossing penalty. ELK's integrated layout produced about 64 crossings on a similar graph.
- Stable ids come before stable layout. If the agent re-explores the repo and regenerates the model, ids drift, and no engine can keep the map stable or diff it. Proposal 1 ignores this, and Proposal 4 leaves it to a line in the skill prompt. Derive ids from the code mapping (paths, packages, services), and make the skill update the model instead of regenerating it.
- The stability metric everyone uses is wrong for mental maps: percentage of boxes moved more than 20 px, or more than one node height, after removing the median translation. A whole group pushed down rigidly counts as 'moved', but readers see it as stable. Measure orthogonal-order preservation and displacement within a group instead.
- The arrows architecture diagrams are mostly about (HTTP, gRPC, queues, managed services) can't be seen by import analysis. Unless 'verified' is split into honest tiers (extractor, config such as compose env vars or k8s service DNS, cited, unproven) and OpenTelemetry service graphs are imported later, any verifier either drowns users in UNVERIFIED or verifies only trivial arrows.
- Don't build extractors; wrap them. Every proposal lists dependency-cruiser as a competitor, but it is MIT, actively maintained (18.6.0, released 2026-10-11), and has already solved JS/TS module resolution: tsconfig paths, barrel files, package exports. The same goes for grimp and import-linter for Python and `go list` for Go. That removes months of grind.
- Free deterministic graph tools already cover monorepos: `nx graph` and `nx affected --graph`, Turborepo's `--graph`, dependency-cruiser, madge. Proposal 4's workspace-graph timelapse is reproducible with any of them. To stand apart, offer higher-level grouping, runtime edges and verification semantics, not package graphs.
- The licensing escape hatch doesn't exist. @joint/router-avoid (MPL-2.0) depends on libavoid-js 0.4.5 (LGPL-2.1) and @joint/core (checked with `npm view`). Any libavoid route means loading LGPL WASM as a separate file. Custom git merge drivers are not run by GitHub's server-side merge (background knowledge), so lockfile conflicts must be repairable by a command, not a driver.
- The user's time and motivation. The repo has been idle since 2026-07-19, and every plan assumes a full-time 6-week sprint. Size the plan to the user's actual hours per week, and ship something real (an upstream Mermaid PR, the truth pilot) within 2 weeks to rebuild momentum.
- Upstream-first reputation is the cheapest distribution available. Mermaid 12 made ELK the default, and its most-voted layout issues (#5420 ELK positioning, 49 votes; #4990 subgraph overlap, 34) are exactly what Glyphic's post-passes fix. Only Proposal 3 mentions this, and only in passing.
- A hosted tier for private repos from an unknown solo maintainer only sells if it never sees source code. Design Cloud to ingest just the model, the extracted facts and evidence hashes, with extraction run in the customer's CI.
- The cost and credibility of benchmarking LLM tools at 50-200 nodes is underestimated. Archify #22 reports tens of millions of tokens. A truth benchmark, which measures invented edges against deterministic facts, is far cheaper than a layout leaderboard, because the verifier doubles as the harness. It also doesn't make the user judge and contestant in a commodity race.
- Facts verified today that the proposals relied on or got wrong:
- Archify's README still says general-purpose auto-layout is 'intentionally outside the current scope' (v3.1.0, 84.0k stars, has zoom keys and upstream/downstream trace, no drilldown).
- elkjs in the repo is 0.9.3, while 0.12.0 ships top-down layout options I haven't tested.
- The npm name 'truemap' is free.
- My web search budget was exhausted, so I could not check for competing diagram-drift checkers.

### First two weeks

- Day 1: Ask the user how many hours a week they can commit, and size the plan to that. Relicense @glyphicjs/core from FSL-1.1-ALv2 to MIT; they are the sole author of all 50 commits, so no one else needs to agree. Do an honesty pass on the README: remove the '18 types', 'byte-identical', 'safe by construction', 'any Google Font' and 'Mermaid: no MCP' claims. Freeze feature work on 1.x, and draft npm deprecation notices to publish when v0.1 ships.
- Days 1-3: Re-run the stability and routing spikes on real graphs instead of synthetic ones. Use dependency-cruiser output, aggregated to directories, from 3 real TypeScript monorepos with docker-compose (for example n8n, twenty, immich). Feed it through `scratchpad/stab/spike3.mjs` (freeze-insert-push) and `scratchpad/avoid/route_nocross.mjs` (libavoid). Compare crossings and edge length against ELK INCLUDE_CHILDREN. Then choose: libavoid without a crossing penalty, or per-group ELK with hierarchical ports and accepted crossings between groups.
- Days 2-3: On a branch, upgrade elkjs from 0.9.3 to 0.12.0. Run the 13 elk-adapter regression tests and record which layouts change. Try `topdownLayout` on the 44-node hero example to see whether it is usable for collapse and zoom views.
- Days 3-6: Reflexion prototype. Have Claude Code draft `.glyphic/model.yaml` for 5 real repos from a draft SKILL.md, using the schema of 1.5k tokens or less. Run facts from dependency-cruiser, workspace and compose against the model, and print verified/cited/unproven/undrawn verdicts with file:line. Record what share of drawn arrows are runtime-only, i.e. unprovable from static analysis. That share is the noise risk that decides whether the verifier is a painkiller or a nuisance.
- Days 5-8: Truth pilot. For the same 5 repos, transcribe the edges from DeepWiki and gitdiagram diagrams, run Archify on one small repo with its token count logged, and compute the invented-edge rate against deterministic facts. At 15-20% or more, that is the launch headline. Near 0%, drop the 'AI diagrams lie' story and lead with drift and guardrails.
- Days 6-10: Hold 15 conversations, asking in GitHub Discussions first and never opening unsolicited PRs.
- 10 maintainers of agent-heavy repos that have an ARCHITECTURE.md or a README diagram.
- 5 authors of Archify issues #280, #401 and #614.
Show each person the reflexion output for their own repo and ask: 'Would you run this in CI? What would make you remove it?' Also install pr-lens and the CodeBoarding Action on a test repo, to get a side-by-side comparison of what already exists.
- Days 8-12: Open one upstream contribution to Mermaid's ELK layout, porting overlapping-edge separation or the subgraph-overlap fix from `packages/core/src/layout/elk-adapter.ts`, with before/after measurements. Track how maintainers respond; it serves both as a reputation test and as a channel test.
- Days 10-12: Measure the population of README diagrams. GitHub code search is blocked in this session, so the user runs it locally (for example `gh search code 'flowchart' --filename ARCHITECTURE.md`, plus README Mermaid blocks). Sample 50 results and count how many have boxes that map to code units. That number sets how much effort Mermaid import gets compared with the agent-written model.
- Days 12-14: Write the v0.1 spec:
- the model schema;
- the lockfile format (one sorted line per node, a `lock --repair` command, no merge driver);
- the verdict tiers;
- the PR comment format (sentences plus file:line first, an image crop second).
Then make the go/no-go call against gate G0 (routing acceptable on real graphs; at least 3 of 5 repos show a real, non-obvious divergence; at least 5 of 15 people would run it in CI), and publish a short public post-mortem on 'what I got wrong about AI diagrams' as the first piece of content.
