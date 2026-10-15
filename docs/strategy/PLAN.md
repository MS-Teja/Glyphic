# Glyphic: the plan (October 2026)

> **Status:** proposal for the maintainer to decide on. It is not a commitment.
> **Inputs:** four research tracks (market, demand, a measured codebase audit, the technical frontier), four competing strategies, and two adversarial judges. All of it is in [`research/`](research/README.md). The numbers here are either measured in this repo ([`spikes/`](spikes/README.md)) or carry a source.

---

## 1. The decision, in one paragraph

**Stop building a diagram renderer. Build architecture tests for code that coding agents write.**

- **The model.** A small architecture model lives in the repo. It can be the Mermaid diagram the repo already has.
- **The checker.** On every PR, a deterministic checker verifies each arrow against the code and points to the file and line that proves it. It says honestly which arrows it can prove and which it can't.
- **The agent skill.** An agent skill makes Claude Code, Codex and Cursor read that model before they code, run the check after, and fix the model when the code really changes.
- **Pictures.** Diagrams become something the verified model produces, not the product. Glyphic's layout engine comes back in v0.2 as the view layer, once real users exist.
- **Licensing and money.** Everything is MIT. Early money comes from fixed-fee setup work. A hosted service for private-repo history comes later, and only after pre-payment.

---

## 2. Why: the premises we are dropping

| Premise | What the evidence says | Verdict |
|---|---|---|
| "AI can't draw diagrams" (the original thesis) | Small and medium diagrams are drawn well. Claude has had inline visuals since Mar 2026 and ChatGPT got "Intelligent UI" on Oct 7 2026. The two biggest diagram projects of 2026 are skills where the **model draws**: Archify ≈84k★ and diagram-design ≈56k★, both created in April 2026. | **Dead** |
| "…but large diagrams need a better engine" | Glyphic's routing is already good: 0 edges through unrelated boxes from 20 to 200 nodes, and a median detour ratio of about 1.0. Large diagrams still fail. At 44 nodes labels are 10.9 px when fitted to 1920 px. At 200 nodes they are 2 px on a 26k-px PNG that takes 129 s and 5.6 GB to render. The problem is placement and information design. No engine, model or human makes a 150-node canvas readable. | **Wrong frame**: the answer is *views*, not a bigger canvas |
| "The layout engine is the asset or the business" | Mermaid 12 made ELK its default (Sep 10 2026). Terrastruct shut down and open-sourced TALA under MPL-2.0 (Sep 2026). beautiful-mermaid (11k★) is browser-free ELK under MIT. Selling layout just failed in public. | **Layout is a commons** |
| "MCP is the channel" | Skills won distribution by an order of magnitude. AWS replaced its diagram MCP server with a skill. Excalidraw, draw.io and Lucid now have official MCPs or connectors that own that slot. | **Wrong channel** |
| "18 diagram types is a strength" | There are 4 render paths. Breadth doesn't separate the winners (Archify has 10 types, diagram-design 44). | **Irrelevant** |
| "FSL protects the business" | With about 10 stars there is nothing to protect, and FSL stops skills from embedding the code. Every comparable project is MIT, Apache or MPL. | **Remove it** |
| My own earlier pick: "architecture diff on PRs" | At least 8 tools already ship it, mostly free: pr-lens (≈2k★ in 8 weeks), CodeBoarding Action, Groma, ArchLens, Eraserbot, the CodeRabbit and Greptile diagrams, drawio-skill (whose CI policy checks, my proposed paid feature, are free under MIT), and Archify's own "Architecture Delta". CodeSee's review maps product shut down in 2024. Practitioners managing review load don't ask for diagrams. | **Wrong as a product.** Kept as one *surface* of the verified model |
| My own earlier "~19k stars for Archify" | It is ≈84k★, which makes a head-on "better Archify" unwinnable | **Corrected** |

The README also makes claims that don't hold up. Details are in [`research/03-codebase-audit.md`](research/03-codebase-audit.md) §5.

- **"Byte-identical"** isn't true for PNGs, which depend on the host's fonts, or for Gantt charts, which depend on timezone and locale.
- **"Validated before it draws"** isn't true: duplicate ids raise a raw Java exception, and group cycles make nodes silently vanish.
- **"Any Google Font"** isn't true: resvg never fetches the font.
- **"Safe by construction"** isn't true. The SVG sanitizer lets an unquoted `href=javascript:` through, which is XSS when the SVG is inlined in HTML. This is confirmed in `packages/core/src/render/sanitize.ts`: the href rule only matches quoted values.
- **The self-hosted HTTP API** isn't in the repo.

---

## 3. The gap that survives

Three constraints remain no matter how good models get:

1. **Trust.** A generator can't certify its own output. Benchmarks show models identify components well; **invented edges are the main structural failure** (R2ABench, Apr 2026). Users' top complaint about AI diagrams (DeepWiki, gitdiagram, Archify) is that they are *wrong*, not that they are ugly. One LinkedIn post on Archify put it this way: "A confidently wrong architecture diagram is worse than no diagram at all."
2. **Time.** Architecture drifts faster as agents write more of the code. On teams that use AI heavily, PR size is up 154% and review time up 49–91% (Faros; Harvard/Jellyfish, Oct 2026). Reviewing AI code is the #1 delivery constraint (Qodo 2026). The coding agent now *reads* the architecture docs too, so a stale diagram misleads the author of the next PR.
3. **Perception.** Humans read views of about 40 nodes or fewer, and need positions that stay put across changes.

Nobody ships the combination of (1) and (2):

- **Archify:** the model draws the diagram, and evidence links are optional.
- **pr-lens:** an LLM reads the diff, so the edges are asserted by the model.
- **drawio-skill:** applies rules to whatever graph its extractor produced, with no tiers of evidence.
- **dependency-cruiser, import-linter, Nx boundaries:** module-level rules written in config, not a system diagram, and no loop with the agent.
- **Three drift checkers with 0 stars** (diagram-drift, diagram-drift-check, living-c4-architecture): the concept is obvious. Precision, framing and distribution will decide who wins, not the idea.

**Honest assessment:** this is a bet, not a sure thing. The four biggest risks are listed in §11, and §9 has gates that kill the plan early if they come true.

---

## 4. Who it's for and what they get

**Primary user.** The tech lead or staff engineer of a 5–50-engineer team, or the maintainer of an open-source repo with 1k–50k stars.
- Coding agents write a large share of the PRs.
- The stack is a TypeScript or Python monorepo, often with docker-compose.
- They have an architecture diagram they know is partly wrong, or they wish they had one they could trust.

**What they get:**
- **A PR comment that catches structural mistakes.** For example: *"This PR adds `billing → auth-db` (billing/src/charge.ts:42). Your architecture doesn't show or allow that."* The comment includes the team's own diagram, recoloured. With `mode: spec` on, CI blocks the merge.
- **A diagram they can trust.** A badge such as `architecture: 37/41 arrows verified · 4 runtime (declared)`, which updates on every push.
- **Agents that respect the architecture.** The skill puts the model into the agent's context. `glyphic query deps billing --json` answers "what touches this?" with evidence.
- **AI diagrams they can check.** "Archify draws it, Glyphic checks it": an adapter verifies Archify JSON, DeepWiki output and similar against the code.

**Secondary users:**
- **LikeC4 and Structurizr users.** Structurizr's cloud service shut down on 2026-09-30. These users want their model checked against code, not just rendered.
- **Later, paid, and only if confirmed:** whoever owns SOC 2 needs a dated network or data-flow diagram backed by evidence. Auditors require one that "accurately depicts the system".

**Not targeted:** agent builders who want a diagram API, educators, non-technical users, or anyone who mainly wants prettier pictures. The demand research graded all of these D or F.

---

## 5. The product: v0.1 scope

Working name: **Glyphic 2**. The name is decided on day 12; see §12.

1. **Model.**
   - Input is either an existing Mermaid flowchart in `*.md` plus `.glyphic/map.yaml`, or a native `.glyphic/model.yaml`.
   - Nodes can nest.
   - `maps:` ties each node to globs, workspace packages, compose services, hostnames or env vars, or an external SDK.
   - Each edge has a `kind`: `import`, `http`, `queue`, `db` or `config`.
   - **Ids are stable and derived from the mapping**, so a regenerated model keeps them. Diffs, history and later the stable layout all depend on this.
   - The schema is ≤1.5k tokens and lives inside `SKILL.md`. There is no `get_schema` round-trip; today's MCP server spends 7k + 14k tokens on that.
2. **Facts.** Deterministic, with no LLM, built by **wrapping existing tools instead of writing extractors**:
   - dependency-cruiser for JS/TS (MIT, actively maintained);
   - npm/pnpm/yarn workspace graphs;
   - `docker compose config` (`depends_on`, plus service hostnames in env URLs);
   - an SDK catalog the community can extend: `pg` → Postgres, `ioredis` → Redis, `kafkajs`, `@aws-sdk/client-s3`, `stripe`, `openai`, and so on.
   - Months 2–3: Python (grimp / import-linter engine) and Go (`go list`).
   - Later: k8s/Helm, OpenAPI, Terraform plan JSON, and OpenTelemetry service graphs for runtime edges.
3. **Verdicts.** This is a reflexion model (Murphy, Notkin & Sullivan, 1995): compare an intended model plus a mapping against extracted facts. Every verdict carries file:line evidence. The tiers:
   - `verified:extractor`
   - `verified:config`
   - `cited`: pinned to a file and line by a person or agent; never shown as "verified"
   - `unproven`: a runtime edge with no static evidence. Drawn dashed, info level, **never "wrong"**. It can be declared with `%% glyphic: runtime`.
   - `undrawn`: a code dependency between mapped nodes that the model doesn't show
   - `stale`: evidence existed at the last green commit and is gone
   - `phantom`: a node that maps to nothing

   The report gives a **truth %** and a **coverage %**. Being honest about tiers is how we avoid drowning users in noise from edges static analysis can't see.
4. **Outputs.**
   - A text/JSON report with exit codes, for agents.
   - A sticky PR comment that **leads with sentences and file:line**, followed by the team's own Mermaid with colour overlays (GitHub renders Mermaid natively, so no hosting is needed).
   - `query`, for agents.
   - A generated `ARCHITECTURE.md` section.
   - A badge.
5. **Surfaces.**
   - Skill: `npx skills add MS-Teja/glyphic`
   - CLI: `npx glyphic init | check | query`
   - GitHub Action: warn-only by default; `mode: spec` is the opt-in that blocks.
   - **The CLI never calls an LLM.** `init` drafts the mapping by fuzzy matching, reusing the Levenshtein "did you mean" code from today's `validation.ts`. The user's own agent then refines it, so there is no API key and no inference cost for us.
6. **Out of v0.1:**
   - a custom layout engine
   - the HTML map
   - semantic zoom
   - anything hosted
   - MCP
   - PNG output
   - timelapse
   - the full benchmark

### v0.2 and later: the engine comes back as the view layer (only after gate G2)

| Piece | Why it now holds up |
|---|---|
| **Stable layout** | Measured and cheap. Freezing positions, inserting new boxes next to a neighbour and pushing down moved **0–2% of boxes per edit** (worst single edit 7–30%) and kept 100% of order, against 25–57% for a fresh layout (`spikes/stability/spike3.mjs`, re-run 2026-10-15). The real cost is routing around frozen boxes: libavoid produced 2–3× the crossings, or seconds of compute. It needs work, but it is tractable. |
| **Per-group ELK layout aware of cycles between groups** | Fixes the hero image's edges that route around the whole canvas. The cause is cycles *between groups* (Edge/CDN ↔ VPC), not between nodes. |
| **Collapse and expand with aggregated edge counts** | Gives views of ≤40 nodes, which is how large systems become readable |
| **"Change in context" PR crop** | Shows a PR's change inside the whole-system view, at stable positions. Per-PR redraws can't do this. |
| **Self-contained HTML map** | Pan, collapse, an evidence panel and a verified/unproven legend |
| **Rendering fixes** | Real font metrics from one bundled font, resvg-wasm, shadows off, no 2× PNG by default |

The old ELK know-how comes back here: the post-passes, label sizing and 13 regression tests. **We earn the right to build the engine** by first having users whose verified models need a view.

---

## 6. What happens to the current repo

| Keep and port | Drop |
|---|---|
| Unknown-id errors with "did you mean" (`layout/validation.ts`) and model-fixable Zod errors (`schema/format-error.ts`) | The 12 non-graph types (pie, quadrant, gantt, sankey, git, timeline, journey, kanban, treemap, mindmap, sequence for now) and `canvas` |
| ELK configuration, post-passes and the 13 regression tests from `layout/elk-adapter.ts`, ported in v0.2 | Explicit x/y coordinates that bypass ELK; today all other nodes then land at (0,0) |
| `math/geometry.ts` border clipping, scene graph and SVG renderer, themes and the sketch style | React Flow export (it throws away the routes and leaks internal nodes), `frame.ts` padding |
| | The MCP server as it stands, FontAwesome (25 MB of a 65 MB install), shadows on by default (7–23× slower PNGs), the always-on 2× PNG |

**Week-0 housekeeping:**
1. **Relicense `@glyphicjs/core` from FSL to MIT.** All 50 commits are by the maintainer, so nobody else needs to agree.
2. **Security.** Publish a 1.x patch for the sanitizer's unquoted-`href` XSS. At minimum, add an npm deprecation notice that mentions it.
3. **Find the existing users before deprecating anything.** Look at npm dependents of `@glyphicjs/*` (a directory listing claims ~79 weekly downloads) and the glyphic.web.app logs, and email whoever is there.
4. **Freeze 1.x.** Replace the README's hero claims with a short pivot notice. Deprecate the npm packages, with a pointer, when v0.1 ships.
5. **First content: a public post-mortem, "What I got wrong about AI diagrams".** It is honest, cheap, and it sets up the launch.

---

## 7. Distribution: how this gets to 1,000 stars and 100 real repos

**What worked in 2026, and what didn't:**
- **What worked:** one-command skills, output that screenshots well, X, and Chinese and Japanese developer communities (Juejin, V2EX, Zhihu, Zenn, Qiita) feeding GitHub Trending.
- **What didn't:** Hacker News and dev.to, where Glyphic has posted so far. Archify got 1 point on HN and still reached 84k★.

**The launch asset: a "Diagram Truth Report".** Its question: *how often do AI architecture diagrams invent edges?*
- Run DeepWiki, gitdiagram, Code Wiki and Archify output for 15–25 well-known repos against deterministic facts. The verifier is the test harness, so this costs little. Log tokens for anything that runs an LLM.
- Send results to each tool's authors 7 days before publishing. Frame it kindly. Include an opt-out.
- **If the invented-edge rate turns out low (under about 10%), drop this story** and lead with drift and guardrails instead.

**Second launch, around month 3: the "guardrail benchmark".** Do coding agents that are given the verified spec introduce fewer forbidden dependencies on real tasks? It serves as proof and as fresh content.

**Built-in growth loops:**
- The README badge. Its adoption can be counted with GitHub code search, with no telemetry.
- The sticky PR comment, which every contributor sees.
- PR descriptions written by agents that mention the check.

**Channels:**
- skills.sh and the Claude Code, Codex and Cursor plugin directories
- GitHub Marketplace, for the Action
- An X thread with a GIF of a PR comment catching an agent-added dependency
- Chinese and Japanese posts
- Show HN for the report only

**Before launch:**
- A beta with 20 maintainers.
- Truth reports run by hand on 20 repos, offered through GitHub Discussions rather than unsolicited PRs.

**Reputation as a side benefit: upstream Glyphic's ELK post-passes to Mermaid 12.**
- Mermaid now uses ELK by default, and its top layout issues are exactly the ones these passes fix: [#5420](https://github.com/mermaid-js/mermaid/issues/5420) on ELK positioning (49 👍) and [#4990](https://github.com/mermaid-js/mermaid/issues/4990) on subgraph overlap (34 👍).
- It's the cheapest way to build credibility in the right community, and it gives the old engine value now.

**Timing:** launch on Tue Dec 8 2026, or Tue Jan 12 2027 if the gates slip. Avoid the holiday lull.

---

## 8. Money: honest side income

| What | When | Price | Notes |
|---|---|---|---|
| **Everything local or in CI** (CLI, extractors, SDK catalog, skill, Action, format, self-hosting) | Always | Free, MIT | Never charge for checking, rendering or layout. Terrastruct died selling layout. |
| **GitHub Sponsors** | Now | — | Sponsors from developer-tool companies only, once past ~2k★. **No LLM-reseller slots.** They would undercut a brand built on truth. |
| **Fixed-fee "architecture guardrails setup"** | From month 1, at most one a month | $1.5–3k | Map the team's architecture, wire up `mode: spec`, add an extractor for their stack. This is the fastest honest money, and it teaches the real requirements. |
| **Hosted GitHub App for private repos** | Month 4–6, **only after ≥3 pre-pays** | $29–39/org/mo; $149 for cross-repo and Confluence | No YAML to write. Includes an org dashboard, drift alerts, "broken since <sha>" history and a cross-repo map. **It only ingests the model, facts and evidence hashes, never source code; extraction runs in the customer's CI.** |
| **SOC 2 evidence export** | Only if 3 design partners' auditors want it | ~$490/yr | A dated data-flow diagram with an evidence appendix |

**Expectations:**
- Month 3: $0–200/mo.
- Months 6–9: $300–1.5k/mo, including services.
- Month 12, good case: $1–3k/mo.
- Bear case: about $0.
- This is side income, not a salary. Keep the day job.

---

## 9. Gates and kill criteria

| Gate | When | Pass if | If it fails |
|---|---|---|---|
| **G0: is this real?** | Day 14 | (a) **Population:** of 200 Mermaid architecture diagrams sampled from repos with ≥500★, at least 30% map to code, and at least 50% of their arrows can be checked statically or through config. (b) **Signal:** the reflexion prototype finds a real, non-obvious divergence in at least 3 of 5 real repos. (c) **Pull:** at least 5 of 15 people say they'd run it in CI, and at least 2 commit as design partners. | Population fails → pivot to verifying only AI-generated docs (Archify JSON, DeepWiki), or stop. Pull fails → stop. |
| **G1: precision** | Before launch | At least 85–90% precision on `verified`, `undrawn` and `stale` across 50 hand-labelled diagrams; `check` under 10 s on 100k lines of code | Fix and re-test. Do not launch noisy. |
| **G2: adoption** | Launch + 30 days | At least 300–500 stars **and** at least 20 external repos running the Action for at least 14 days | Freeze features. Keep the upstream Mermaid work and the report. |
| **G3: does it change behaviour?** | Month 4 | At least 10 repos on `mode: spec`, **or** at least 15% engagement with PR comments, with fewer than 50% of installs removed within 30 days | Reposition as agent context only (`query` plus the `ARCHITECTURE.md` section) |
| **G4: will anyone pay?** | Month 6 | At least 3 orgs pre-pay | Build no hosted service. Stay MIT plus services. |

---

## 10. The first 14 days

> A plan based on assumptions should go after its riskiest assumption first. That assumption is demand and precision, not layout.

| Days | Do | Output |
|---|---|---|
| 1 | Decide hours per week and the success metric (§12). Relicense to MIT. Publish the security patch or deprecation note. Check the existing users. | Decisions written down |
| 1–3 | **Population probe:** sample 200 Mermaid architecture diagrams (README, ARCHITECTURE.md, docs/) from repos with ≥500★. Classify each diagram as conceptual or mappable, and each arrow as static, config or runtime. | G0(a) number |
| 2–4 | **Competitor teardown:** run the three drift checkers, Archify's Architecture Delta, drawio-skill's CI rules, the CodeBoarding Action, pr-lens and **dependency-cruiser rules** on the same 3 repos. Answer *"why not just dependency-cruiser?"* in one paragraph, or rethink. Message the drift-checker authors. | One-page gap table |
| 3–7 | **Reflexion prototype** on 5 real repos (for example n8n, twenty, immich). The agent drafts the model from a draft `SKILL.md`; dependency-cruiser, workspace and compose provide the facts; the prototype prints verdicts. Record **what share of drawn arrows are runtime-only**. | G0(b) data, noise estimate |
| 5–8 | **Truth pilot:** measure the invented-edge rate of DeepWiki, gitdiagram and Archify output on the same repos, logging token cost. | Whether the launch headline survives |
| 6–10 | **15 conversations:** 10 maintainers of agent-heavy repos that have an `ARCHITECTURE.md`, and 5 authors of Archify issues #280, #401 and #614. Show each person the output for *their* repo. Ask: would you run this in CI? turn on blocking? what would make you remove it? would you pay $1.5k for setup, or $39/mo? | G0(c) |
| 6–12 | **Tech spike:** parse Mermaid (try mermaid's own parser headless first). Post a real PR comment with `linkStyle`/`classDef` overlays to confirm GitHub renders them. | Mermaid input works or doesn't |
| 8–12 | **Upstream contribution:** open one PR to Mermaid's ELK layout, porting overlapping-edge separation or the subgraph-overlap fix, with before/after measurements. | A reputation and channel test |
| 12–14 | Check the name. Write the v0.1 spec: schema, verdict tiers, PR comment format, and the lockfile (one sorted line per node; conflicts fixed with `glyphic lock --repair`, because GitHub doesn't run custom merge drivers). Write the **go/no-go memo against G0**. Publish the post-mortem. | Go/no-go |

## 11. Roadmap and risks

**Roadmap (assuming 20–30 h/week; at about 10 h/week, double the timelines and drop Python and the Archify adapter from v0.1):**
- **Weeks 3–6, build v0.1:**
  - schema, `init`/mapping, and the wrappers (dependency-cruiser, workspaces, compose, SDK catalog)
  - the verdict engine and text report
  - the Action with a sticky comment, the skill and the badge
  - a precision suite over 50 hand-labelled diagrams
- **Weeks 6–8:** the 20-maintainer beta, plus the data run for the Truth Report and review by the tools' authors.
- **Weeks 8–10:** launch the report and the tool together.
- **Weeks 10–13:**
  - Python and Go facts
  - Archify JSON and LikeC4 adapters
  - hardening `mode: spec`
  - the first setup engagements
- **Months 4–12 (gated):**
  - v0.2 views (§5)
  - runtime evidence from OpenTelemetry, k8s/Helm, OpenAPI and Terraform
  - the guardrail benchmark
  - an architecture timelapse as a second launch
  - the hosted app, only if G4 passes

**Top risks, and what answers each:**
1. **It's a vitamin, not a painkiller.** Reviewers don't ask for diagrams, and teams turn off CodeRabbit's diagrams. → Lead with the *guardrail*, not the picture. G0(c) and G3 measure behaviour, not compliments.
2. **Runtime edges are invisible to static analysis**, which means noise. → Honest evidence tiers; `unproven` is never "wrong"; OpenTelemetry import comes later. G0 measures the runtime share before any building.
3. **Substitutes:** dependency-cruiser, import-linter, Nx boundaries, drawio-skill. → Answer "why not?" in week 1. The differences have to hold up: one artifact serves as both the diagram and the rules, it works at system level across languages and config, it runs in the agent loop, and the drafting is done by an LLM while the checking is deterministic.
4. **Archify or a platform adds verification.** Archify moves fast. → Complement it (the adapter), keep deterministic independence as the brand, and move quickly. If they absorb it, the upstream work and the report still pay off in reputation.
5. **Founder capacity.** The repo has been idle since July. → Size the plan to real hours, and ship something public within 14 days: the post-mortem plus the Mermaid PR.

## 12. Decisions only you can make

1. **Hours per week?** The plan assumes 20–30. At 10, the scope shrinks as described in §11.
2. **Which comes first, adoption or revenue?** The plan favours adoption and treats revenue as gated upside.
3. **Do you want to build a verifier?** The judges flagged motivation as a real risk: this plan puts the renderer aside until v0.2. If you'd rather stay visual, the best-scoring visual alternative was "Glyphic Maps", a zoomable repo-map skill (scores in [`research/05`](research/05-strategies-and-judging.md)). Both judges rated it a head-on fight with an 84k★ leader that is already shipping zoom, trace and deltas.
4. **The name.** Keep "Glyphic" (the repo and npm scope already exist) or rename for the pivot. Decide on day 12, after checking npm, GitHub, the domain and trademarks.
5. **OK to deprecate the 1.x npm packages** once v0.1 ships, after contacting the existing users?
