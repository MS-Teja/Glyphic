# Diagram tools for AI agents: market and open-source landscape, October 2026

## Method and caveats

- **Star counts** come from the GitHub search API, pulled on 2026-10-15 (stars / forks / creation date). They are exact as of today, but I can't check whether skill-repo stars are organic.
- **Business numbers** come from WebSearch snippets. I tag each one as official, vendor, aggregator or unverified.
- **Access limits:** WebFetch only reached github.com, and npm download stats were blocked, so I have no npm numbers.
- **The prior analysis is out of date in several places:**
  - Archify has 83,979 stars, not ~19k.
  - Terrastruct has shut down, and TALA is now open source.
  - The Structurizr cloud service shut down on 2026-09-30.
  - At least six tools already ship "architecture diff on a PR".

## 1. Landscape table

| Tool | Category | OSS / license | Traction (date) | How it makes money | Genuinely good at | Where it fails (large / sync / editing / hallucination) | Channel |
|---|---|---|---|---|---|---|---|
| **Archify** (tt-a1i/archify) | Agent skill: idea or repo → interactive HTML | MIT | **83,979★**, 5,683 forks; created 2026-04-15 (≈460★/day average). Earlier snapshots: 20k → 36k → 82k | No paid tier. README sponsor slots, mostly LLM-API resellers (Kimi Work, PackyCode, AICodeMirror, ZTURBO…) with referral codes; WeChat/Alipay donations | One-line install for Claude Code, Codex, Cursor, OpenCode and claude.ai. Typed JSON IR plus validators. 10 diagram types. Focus/trace interactions. Git-verified file:line evidence. Self-contained HTML | **The agent does the layout** (README: "no general-purpose auto-layout"). ~25 repair rounds for an 8-node map (#214). Token-cost complaints: "tens of millions of tokens" on MiniMax (#22), "slow and token-heavy" (#66). Text overlaps still pass validation (#61). Two opposite-direction edges collapse into one line (#248). 3 of 5 bundled examples failed containment checks; 6px text floor (#344). Unreachable modules drawn as live components (#614). No WYSIWYG, no hosted sharing. Evidence links only work for GitHub. 77 open issues / 102 open PRs (2026-09-16) | `npx skills add`, GitHub Trending, Chinese dev media, plugin directories |
| **diagram-design** (cathrynlavery) | Agent skill: "editorial" HTML+SVG | Repo public; license not confirmed | **55,780★**; created 2026-04-16; #1 on GitHub Trending Aug 2026 | Sponsor button; builds the author's audience (BestSelf etc.) | Taste: 44 types, brand theming, one accent colour | Agent hand-places SVG on a 4px grid. Its own README says "the same prompt can lay out differently twice". No text to diff, no canvas to edit. **README recommends Mermaid for diagrams that live in Git and change often** | Author's audience plus every agent marketplace (Claude Code, Codex, Copilot, Factory, Pi, Kiro) |
| **next-ai-draw-io** | Web app + MCP: chat → draw.io XML | Apache-2.0 (reported) | 36,263★; created 2025-03 | Infra sponsored by ByteDance/Doubao (Portuguese blog, unverified) | Output stays editable in draw.io | The model writes the XML coordinates; weak on large diagrams; no link to code | GitHub Trending, MCP |
| **Other 2026 skills**: fireworks-tech-graph 11,738★ (Apr 26); visual-explainer 10,452★ (Feb 26, has `/diff-review`); Cocoon architecture-diagram-generator 7,446★ (Dec 25); excalidraw-diagram-skill 5,019★; oh-my-mermaid 3,148★; effective-html 3,668★; svg-diagram (Bybit) 626★; SeeCode 480★ in 2 weeks | Agent skills | Mostly MIT | As listed | None | Good-looking one-shot output | All model-drawn; non-deterministic; no sync | skills.sh / Trending |
| **drawio-skill** (Agents365-ai) | Skill + CLI: code / IaC / specs → draw.io | MIT | 10,169★; created 2026-03 | None | **Layout by an engine** (Graphviz, plus optional draw.io ELK pass). **Incremental sync that keeps hand-tuned coordinates.** One IR, multiple views. `drawiodiff`/`prdiff`. **CI architecture rules** (Internet→DB, cycles, orphans, trust boundaries) enforced on every PR | Graphviz look; Python-heavy. Closest existing tool to the "living map + PR diff + policy" pitch, and it is free | Skills |
| **beautiful-mermaid** (lukilabs = Craft) | Mermaid renderer library | MIT | 11,194★; created 2026-01-28 | Supports Craft's product | **ELK.js, no DOM, pure TS**, 15 themes, ASCII output, 100+ diagrams in <500ms | 6 diagram types; Mermaid's limits | Built for Craft Agents; Trending |
| mermaid-rs-renderer 1,767★; drawio-ai-kit 657★ (declarative layout engine + validator + vision self-check); openflowkit 879★ ("every arrow cited to file:line"); qgraphflow 112★ | Renderers / layout kits | MIT | As listed | None | Browser-free, deterministic | Small reach | Trending, skills |
| **Mermaid** + Mermaid Chart (rebranded **mermaid.ai**, Feb 2026) | Text-to-diagram language + SaaS | MIT (library); SaaS closed | 90,679★ | VC: $7.5M seed (Mar 2024: Sequoia, M12, OCV). Revenue "<$5M" (ZoomInfo estimate, unverified). Pro ≈$80/user/yr (aggregator) | **In every model's training data.** Renders natively in GitHub, GitLab and most markdown tools | Little layout control at scale. LLM syntax errors (~70% valid without repair loops, per one study). The "Mermaid slop" meme | Embedded in platforms + model priors |
| **D2 + TALA** | Text-to-diagram language + architecture layout engine | MPL-2.0. **TALA open-sourced under MPL-2.0 in v0.9.0 (2026-09-07)**; D2 now ships Go ports of Dagre and ELK | 25,618★ (d2lang/d2) | **Failed.** Funded by the closed D2 Studio IDE plus proprietary TALA (~$20/user/mo bundle per CostBench, unverified). Company shutting down; D2 moved to Hack Club fiscal sponsorship; founder joined OpenAI | Best architecture-specific orthogonal layout. Single Go binary. Mixed pinned/auto positioning, which the blog pitches for agent use | Not for long DAGs; maintainer time now limited | CLI, docs, HN |
| **Excalidraw** + Excalidraw+ | Whiteboard + SaaS | MIT | 133,916★; official **excalidraw-mcp 5,525★** (Feb 2026) | Excalidraw+ $6/user/mo annual ($7 monthly). Bootstrapped (Brno, per Brex listing). Revenue undisclosed | Hand-drawn look. Official MCP App renders inline in Claude/ChatGPT/VS Code; listed in Claude's connector directory (added 2026-02-09) | Freeform: the model places coordinates. No semantic model, no code sync. MCP is a Plus "public beta" | Brand + connector directories |
| **tldraw** | Canvas SDK | **Source-available** (SDK 4.0, Sept 2025: production license key; ~$6k/yr reported) | 50,933★ | SDK licensing. $11.4M Series A (Apr 2025), $14.1M total (PitchBook) | Agent starter kit (MIT), Make Real, Fairies; spatial agent demos | Not a diagram generator; no architecture semantics | Viral demos, SDK customers |
| **draw.io** | Editor | Apache-2.0 code | drawio-desktop 63,522★; official **drawio-mcp 5,646★** (Feb 2026) | **Paid draw.io apps for Confluence/Jira** via Atlassian Marketplace (~62–68k installs; revenue private) | Hosted MCP (`create_diagram`, `search_shapes`), Claude Code plugin, editable XML | Model-placed XML; manual upkeep; large diagrams done by hand | Atlassian Marketplace + free web app |
| **Eraser / DiagramGPT** | Docs + diagram-as-code SaaS | Closed | $4M seed (2021) | Starter ~$15–20/member/mo; Business ~$45–60 (aggregators) | Prose → architecture/ERD/sequence; docs integration | Generated from a description, not from code; no truth source | SEO + product-led |
| **Napkin.ai** | Text → business visuals | Closed | ~2M users (early 2025); $10M seed (Accel, CRV) | Freemium SaaS | Storytelling visuals | Not built for technical accuracy | Content marketing |
| **Lucid / Whimsical** | Enterprise diagram SaaS | Closed | Lucid Claude connector (Apr 2026, MCP: search, summarize, generate) | Seats | Enterprise distribution | Generic; no code truth | Existing seats + connector directories |
| **Lucid Train** (lucidtrain.com; looks separate from Lucid Software, unverified) | Repo → ELK diagram → markdown spec for agents | Rust CLI "free/OSS" | Product Hunt + X promo | Desktop $3/mo (vendor; conflicting $199/$999 listings) | Same thesis as Glyphic, stored in-repo in `.lucid/` | Vendor claims only | Product Hunt / X |
| **IcePanel** | C4 modelling SaaS | Closed | — | Growth $40/editor/mo annual, $50 monthly; viewers free; $80 enterprise tier (vendor blog) | Model-based levels, flows, zoom | Manual modelling; weak code sync | SEO comparison pages |
| **LikeC4** | Architecture-as-code | MIT | 5,879★ | OpenCollective / GitHub Sponsors | One model, many views; diffable; MCP server; VS Code extension | Someone has to write the model | Docs, VS Code |
| **Structurizr** | C4 models-as-code | vNext Apache-2.0, open core (closed enterprise extensions) | structurizr/structurizr 466★ (new repo, Nov 2025); old repos archived | **Cloud service EOL 2026-09-30** "because usage steadily declined"; now Patreon + on-prem server | Enforces C4 rules; MCP server for DSL validation/inspection. Simon Brown says AI does better with models-as-code | Authoring burden; lost its hosted users | Simon Brown's audience |
| **Ilograph** | Interactive diagrams with "perspectives" | Closed | Small | Free: unlimited private diagrams, 3 viewers (aggregator); paid prices unknown | **The best existing answer to large diagrams: perspectives + levels of detail** | Hand-authored YAML | Word of mouth |
| **DeepWiki (Cognition) / Google Code Wiki** | Repo → wiki with diagrams | Closed. Clones: deepwiki-open 18,204★, OpenDeepWiki 3.6k, deepwiki-rs 3.1k, FSoft CodeWiki 1.8k | DeepWiki: 30k repos at launch (Apr 2025, $300k compute); "500k" (aggregator, unverified). Code Wiki preview 2025-11-13 | Free; drives Devin / Gemini | Code Wiki **regenerates architecture/class/sequence diagrams on every change** | Accuracy ("only partly right", The Register). Mermaid-grade diagrams. Private repos are waitlist-only | Big-company brand, free |
| **CodeRabbit / Greptile** | AI PR review | Closed | Large installed base | Seats | CodeRabbit: Mermaid sequence diagrams in every walkthrough (on by default). Greptile: a sequence diagram for every PR | Throwaway per-PR diagrams; sequence only; no persistent model or layout | Already installed on PRs |
| **PR Lens** (coldteadotai) | PR → animated architecture/data-flow diagram | MIT | 1,964★; created **2026-08-20** | GitHub App free for OSS; private-repo pricing unpublished | Hosted app or own-key Action/GitLab/Bitbucket/CLI/skill. Green/amber/red diff, payload panel, deterministic renderer | **LLM reads the diff** (no static analysis), so hallucination risk; Actions keep no state | GitHub App + skill |
| **CodeBoarding** | Static analysis (LSP) + LLM → architecture | MIT | 2,580★; created 2025-04 | Metered hosted model (weekly limit), bring-your-own key, or paid `CODEBOARDING_LICENSE` | **GitHub Action compares PR vs base-branch baseline and comments a Mermaid diagram of added/modified/deleted components.** 9 languages, nested components, VS Code | Mermaid re-layout each time (no stable layout); heavy language-server setup; code excerpts sent to the LLM | Action, VS Code, Hacktoberfest |
| **Kroki** | Render gateway for 20+ diagram languages | MIT | 4,368★ | Free hosted service on servers donated by Exoscale; looking for sponsors | Universal renderer; built into GitLab | Rendering only | GitLab / Asciidoctor integrations |
| **mingrammer/diagrams** | Python diagrams-as-code for cloud | MIT | 42,726★ | None | Cloud icons, quick prototypes | Graphviz clutter at scale; written by hand | Python ecosystem |
| **Cloudcraft (Datadog) / Hava / Brainboard**; OSS terravision 1,656★, scanopy 5,872★; Pluralith (Terraform PR diagrams, status unclear) | Diagrams from live cloud/IaC state | Closed (OSS alternatives exist) | — | Cloudcraft from ~$49 (Capterra); Hava paid-only; Brainboard no data | **Truth comes from live state**, so it stays in sync | Infrastructure only; clutter at scale | Bundled with Datadog; Terraform ecosystem |
| **yFiles** (yWorks) | Commercial graph/layout SDK | Closed | Enterprise | **One-time per-developer/project licenses**, quote-based (numbers not public), optional maintenance | Best large-graph layout and performance | Price; not for AI end users | Enterprise sales |
| **React Flow / xyflow** | Node-UI library | MIT | 38,677★; npm ~11.2M/week (npm-page snippet, unverified) | **"Thin-crust open core": Pro subscription** (reactflow.dev/pro lists $169 and $289 per month; OpenCollective €129/€249). Pro examples, prioritized issues. "Ramen profitable within a few months"; now "financially stable" | Infrastructure for anyone building node UIs | Not a layout or diagram generator | Developers building products |
| ChartDB 22,996★ / drawDB 40,031★ | DB diagram editors | AGPL / MIT | As listed | ChartDB Cloud: **"surpassed $1K collected revenue"** (about page) | ERDs from SQL | — | Trending |
| **CodeSee** (precedent) | Codebase maps + **PR Review Maps** | Closed | Raised VC | **Shut down commercial operations Feb 2024; assets bought by GitKraken (May 2024)** | — | — | — |

## 2. Numbered insights

1. **The 2026 breakout was agent skills. MCP servers and libraries did not break out.**
   - Every new diagram repo above 10k stars since 2025 is a skill or an AI app: Archify 84k, diagram-design 56k, next-ai-draw-io 36k, fireworks 11.7k, beautiful-mermaid 11.2k, visual-explainer 10.5k, drawio-skill 10.2k.
   - **Timing:** Claude Skills (Oct 2025) → Agent Skills open standard (2025-12-18) → Vercel `npx skills add` and the skills.sh install leaderboard (2026-01-20) → all of the winners launched Jan–Apr 2026.
   - **What the winners share:**
     - one command installs into every agent;
     - output is a single self-contained HTML file that looks great in a screenshot;
     - Chinese-language and X amplification;
     - GitHub Trending feeding on itself.
   - Glyphic shipped in June 2026 as a stdio MCP server plus npm packages, saving PNGs to the Desktop. That was the wrong packaging, a quarter late. Breadth of diagram types is not what separates winners (Archify has 10, diagram-design 44).

2. **Looks win stars; correctness is the unsolved pain.**
   - The two biggest winners let the model place coordinates.
   - diagram-design admits it is non-deterministic and can't be diffed.
   - Archify's issue tracker is a record of layout-correctness and cost failures: repair loops, token burn, overlaps that still pass validation, unreadable bundled examples.
   - That is exactly what Glyphic's ELK post-passes solve. But it is invisible infrastructure, and nobody stars an engine they can't see.

3. **"Model draws, validator complains, model repairs" is the dominant design, and it is expensive.** That makes a deterministic "hands" engine for skills valuable, but free substitutes now exist:
   - D2 with TALA, ELK-go and Dagre-go (MPL-2.0, single Go binary);
   - beautiful-mermaid (ELK.js, no DOM, MIT);
   - drawio-skill (Graphviz/ELK);
   - drawio-ai-kit.

   Glyphic's "browser-free ELK → SVG → PNG" stack is no longer unique. Its edge, if any, is the post-passes and the quality of large layouts. That needs proof through a public benchmark.

4. **Selling a better layout engine has not sustained a company.**
   - Terrastruct (paid TALA plus a closed IDE) shut down in 2026.
   - Structurizr closed its cloud service on 2026-09-30 for lack of use.
   - yFiles survives on enterprise one-time licenses.
   - Glyphic's FSL-1.1 license on core adds friction with no adoption to protect. Every comparable tool is MIT, Apache or MPL.

5. **OSS diagram projects that make real money do it one of five ways:**
   - **Collaboration SaaS on top of a free editor:** Excalidraw+ (bootstrapped), mermaid.ai (VC), draw.io through the Atlassian Marketplace (~65k installs). Selling into a marketplace where companies already pay is the most proven route.
   - **SDK licensing:** tldraw (source-available, ~$6k/yr, VC-backed), yFiles.
   - **Thin open core:** xyflow Pro at roughly $169–289/mo per organization; became ramen-profitable within months. This is the best fit for a solo maintainer.
   - **Metered hosted inference for PR bots:** CodeBoarding licenses, PR Lens hosted app.
   - **Sponsorship and ads:** Archify's README sponsor slots sold to LLM-API resellers. For a viral skill this is the realistic "bit of money on the side".

   **Counter-evidence that stars don't become money:** ChartDB has ~23k stars and reported "$1K collected revenue". Kroki runs on donated servers. CodeSee shut down.

6. **Plain "render a diagram over MCP" is commoditized by the incumbents' own servers.**
   - Excalidraw: official MCP App, Anthropic-verified, in the Claude directory.
   - draw.io: official hosted MCP plus a skill.
   - Lucid: Claude connector.
   - Structurizr and LikeC4: MCP servers.
   - Mermaid: reportedly an official MCP server (directory listing, unverified).

   Glyphic's MCP server as it stands has no slot.

7. **Repo → diagram/wiki is crowded and free; "evidence-linked" is now table stakes.**
   - Big-company free tools: DeepWiki, Google Code Wiki (regenerates diagrams on every change).
   - Open source: deepwiki-open 18k, CodeBoarding, codeflow 5.4k, repowise 7.8k, oh-my-mermaid, Archify (Git-verified file:line), openflowkit (every arrow cited), qgraphflow, Lucid Train.
   - Archify-style evidence links don't separate anyone any more.

8. **The bottleneck is truth, not drawing.** Image models (Nano Banana Pro) now make readable infographics, but reviewers report "wiring mistakes… logically impossible connections". Hallucinated components show up in Archify (#614) and in Code Wiki's chat. This supports the user's revised premise: small diagrams are solved for looks, not for accuracy.

9. **Nobody solves large diagrams as one picture; tools that cope do it with navigation.**
   - Ilograph: perspectives and levels of detail.
   - IcePanel: model levels.
   - LikeC4 and Structurizr: views.
   - CodeBoarding: nested components.
   - Archify: focus and trace.

   Glyphic's own 44-node render confirms the lesson. Scale has to be handled with views, semantic zoom and stable positions, not a bigger canvas.

10. **The domain authority points AI at models-as-code, but users won't hand-write the model.** Simon Brown recommends Structurizr or LikeC4 for AI-generated C4. Yet the hosted Structurizr product died. The opening is a model that is **generated and verified** from code, with views derived from it. Hand-authored DSL is not that.

## 3. Does the evidence support the "architecture diff for PR review" idea?

**Mostly it undermines it as greenfield.** At least eight products already occupy the space, most launched in the last 12 months and most free:

- **CodeBoarding Action:** static analysis, base-vs-PR baseline, Mermaid comment showing added/modified/deleted components.
- **PR Lens:** GitHub App, free for OSS; colour-coded diff; animated; also a skill.
- **drawio-skill:** `prdiff` plus **CI architecture policy tests** on every PR. This is the lead's proposed paid feature, already free under MIT.
- **visual-explainer:** `/diff-review` command.
- **ArchDoc:** PR #22 adds drift checks and an impact comment.
- **CodeRabbit and Greptile:** a sequence diagram on every PR, bundled free into installed review bots.
- **Infrastructure-level:** Pluralith (Terraform PR diagrams) and CDK diff actions.
- **Precedent:** CodeSee Review Maps → shut down in 2024.

Demand is real but modest: PR Lens got ~2k stars in 8 weeks, CodeBoarding has 2.6k.

**What none of them does well, and where a narrower angle may survive:**

- **(a) Stable layout across revisions.** CodeBoarding re-lays out Mermaid from scratch every run. PR Lens rebuilds the graph with an LLM each time. A visual before/after only means something when positions are anchored.
- **(b) Extraction that is deterministic or verified.** PR Lens is LLM-from-diff.
- **(c) Showing the change inside the whole-system context** at the right zoom level, instead of an isolated subgraph.
- **(d) Policy over a verified model.** drawio-skill's rules run on whatever graph the extractor produced.

**On monetization:** this is a bundled feature of review bots, not a product. A standalone seat price would have to beat CodeRabbit giving diagrams away.

## 4. Whitespace: needs nobody serves well

1. **Stable, incremental layout ("same system, same picture tomorrow").** Only drawio-skill advertises keeping hand-tuned coordinates on sync. This is a precondition for any meaningful diff, a living map, or human edits surviving regeneration.
2. **A deterministic layout "hands" library for skill authors.** Something MIT and tiny that Archify/diagram-design-style skills can call to cut repair rounds and tokens, sold on measurable numbers (e.g. "1 call vs ~25 rounds"). beautiful-mermaid shows a renderer embedded in someone else's agent can reach 11k stars.
3. **A public benchmark for agent diagram quality.** Measure overlaps, crossings, minimum text size, determinism, token cost and truthfulness against code. Nobody owns one, and owning the benchmark gives distribution.
4. **Large-system navigation generated automatically from code.** C4-like levels plus semantic zoom with stable positions. Today only hand-authored tools (Ilograph, IcePanel, LikeC4) do levels.
5. **Verified edges.** Every edge comes from static analysis or runtime traces with a confidence level, and the model's claims are audited before drawing. This addresses the accuracy complaints against Code Wiki, Archify and image models.
6. **Round-trip editing.** Generate → human edits → regenerate without losing the edits. diagram-design explicitly can't do this; drawio-skill only partly can.
7. **Mermaid as the input language** with a better engine for big graphs. Models already know Mermaid; the new-schema route requires a get_schema step and has no network effect.
8. **Private, self-hosted and GitLab/Bitbucket living maps.** Code Wiki private access is a waitlist, DeepWiki is public-repo only, and Archify's evidence links are GitHub-only.
9. **A paid channel inside existing marketplaces:** Confluence/Jira, Backstage, Notion. draw.io's Atlassian business is the proven OSS-diagram revenue model, ahead of SaaS seats.

## Sources

- **GitHub repos** (stars via GitHub search API, 2026-10-15):
  - Agent skills and AI apps: [archify](https://github.com/tt-a1i/archify), [diagram-design](https://github.com/cathrynlavery/diagram-design), [next-ai-draw-io](https://github.com/DayuanJiang/next-ai-draw-io), [fireworks-tech-graph](https://github.com/yizhiyanhua-ai/fireworks-tech-graph), [visual-explainer](https://github.com/nicobailon/visual-explainer), [drawio-skill](https://github.com/Agents365-ai/drawio-skill), [architecture-diagram-generator](https://github.com/Cocoon-AI/architecture-diagram-generator), [excalidraw-diagram-skill](https://github.com/coleam00/excalidraw-diagram-skill), [oh-my-mermaid](https://github.com/oh-my-mermaid/oh-my-mermaid), [SeeCode](https://github.com/Aryanutkarsh/SeeCode)
  - Renderers and layout kits: [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid), [mermaid-rs-renderer](https://github.com/1jehuang/mermaid-rs-renderer), [drawio-ai-kit](https://github.com/sparklabx/drawio-ai-kit), [openflowkit](https://github.com/openflowkit/openflowkit)
  - Code → architecture and PR tools: [CodeBoarding](https://github.com/CodeBoarding/CodeBoarding), [pr-lens](https://github.com/coldteadotai/pr-lens), [codeflow](https://github.com/braedonsaunders/codeflow), [repowise](https://github.com/repowise-dev/repowise), [fallow](https://github.com/fallow-rs/fallow), [deepwiki-open](https://github.com/AsyncFuncAI/deepwiki-open)
  - Established tools: [mermaid](https://github.com/mermaid-js/mermaid), [d2](https://github.com/d2lang/d2), [excalidraw](https://github.com/excalidraw/excalidraw), [excalidraw-mcp](https://github.com/excalidraw/excalidraw-mcp), [tldraw](https://github.com/tldraw/tldraw), [drawio-desktop](https://github.com/jgraph/drawio-desktop), [drawio-mcp](https://github.com/jgraph/drawio-mcp), [xyflow](https://github.com/xyflow/xyflow), [likec4](https://github.com/likec4/likec4), [structurizr](https://github.com/structurizr/structurizr), [kroki](https://github.com/yuzutech/kroki), [mingrammer/diagrams](https://github.com/mingrammer/diagrams), [chartdb](https://github.com/chartdb/chartdb), [terravision](https://github.com/patrickchugh/terravision), [scanopy](https://github.com/scanopy/scanopy)
- **Archify issues:** [#22](https://github.com/tt-a1i/archify/issues/22), [#66](https://github.com/tt-a1i/archify/issues/66), [#214](https://github.com/tt-a1i/archify/issues/214), [#344](https://github.com/tt-a1i/archify/issues/344), [#614](https://github.com/tt-a1i/archify/issues/614), [#61](https://github.com/tt-a1i/archify/issues/61), [#248](https://github.com/tt-a1i/archify/issues/248), [#782](https://github.com/tt-a1i/archify/issues/782). diagram-design trending: [ax-trend #3142](https://github.com/roomedia/ax-trend/issues/3142)
- **D2 / Terrastruct:** [TALA is open-source](https://d2lang.com/blog/tala-is-open-source/), [HN "D2 Is Non-Profit"](https://news.ycombinator.com/item?id=49589768), [runtimewire](https://runtimewire.com/article/terrastruct-open-sources-tala-alexander-wang-winds-down-business), [d2 discussion #2720](https://github.com/terrastruct/d2/discussions/2720), [CostBench (aggregator)](https://costbench.com/software/diagramming/terrastruct/)
- **Mermaid:** [OCV seed post](https://www.opencoreventures.com/blog/mermaid-chart-from-open-source-project-to-raising-a-7-5m-seed-round), [ZoomInfo](https://www.zoominfo.com/c/mermaid-chart-inc/1317101853), [mermaid.ai move](https://test-docs.mermaidchart.com/blog/posts/mermaid-has-a-new-home-heres-what-that-means-for-the-open-source-project), [Capterra](https://www.capterra.com/p/10019399/Mermaid-Chart/)
- **Excalidraw:** [Excalidraw+ pricing](https://plus.excalidraw.com/pricing), [Claude connector](https://claude.com/connectors/excalidraw-app-demo), [Year two](https://plus.excalidraw.com/blog/year-two), [Brex listing](https://www.brex.com/tools/charge-finder/excalidraw)
- **tldraw:** [v4.0.0](https://tldraw.dev/releases/v4.0.0), [BigGo license debate](https://biggo.com/news/202509190115_tldraw_SDK_4.0_Licensing_Debate), [PitchBook](https://pitchbook.com/profiles/company/515685-52)
- **xyflow:** [React Flow Pro](https://reactflow.dev/pro), [asking for money](https://xyflow.com/blog/asking-for-money-for-open-source), [OpenCollective](https://opencollective.com/xyflow), [npm](https://www.npmjs.com/package/@xyflow/react)
- **Eraser:** [CB Insights](https://www.cbinsights.com/company/eraser/financials), [itechguides](https://www.itechguides.com/products/eraser/)
- **Napkin:** [unite.ai](https://www.unite.ai/napkin-emerges-from-stealth-with-10m-in-seed-funding-to-pioneer-visual-ai-for-business-storytelling/)
- **Lucid:** [Lucid help](https://help.lucid.co/hc/en-us/articles/47850709372180), [idm](https://idm.net.au/node/15541), [Lucid Train](https://www.lucidtrain.com/)
- **IcePanel / Ilograph:** [IcePanel vs Structurizr](https://icepanel.io/blog/2025-11-14-icepanel-vs-structurizr), [Ilograph (aggregator)](https://agentdeals.dev/vendor/ilograph)
- **Structurizr:** [EOL](https://docs.structurizr.com/eol), [cloud EOL post](https://www.patreon.com/Structurizr/posts/cloud-service-of-142577083), [vNext](https://www.patreon.com/Structurizr/posts/introducing-146923136), [AI docs](https://docs.structurizr.com/ai), [AI vs diagrams pt 3](https://www.patreon.com/posts/152027514)
- **DeepWiki / Code Wiki:** [apidog DeepWiki](https://apidog.com/jp/blog/deepwiki/), [InfoQ Code Wiki](https://infoq.com/news/2025/11/google-code-wiki/), [The Register](https://www.theregister.com/2025/11/17/google_previews_code_wiki/)
- **PR review tools:** [CodeRabbit walkthroughs](https://docs.coderabbit.ai/pr-reviews/walkthroughs), [Greptile sequence diagrams](https://www.greptile.com/sequence-diagrams), [ArchDoc PR #22](https://github.com/ArchDoc/archdoc/pull/22), [Pluralith GH Actions](https://docs.pluralith.com/docs/integrations/github-actions), [GitKraken acquires CodeSee](https://www.gitkraken.com/blog/gitkraken-launches-devex-platform-acquires-codesee)
- **Other tools:** [Kroki docs](https://docs.kroki.io/kroki/), [Datadog Cloudcraft](https://datadoghq.com/blog/cloud-architecture-diagrams-cost-compliance-cloudcraft-datadog), [Cloudcraft Capterra](https://www.capterra.com/p/152659/Cloudcraft/), [Cloudcraft vs Hava](https://stackshare.io/stackups/cloudcraft-vs-hava), [yFiles pricing](https://yfiles.com/pricing), [yFiles license types](https://www.yworks.com/products/yfiles-for-html/license-types), [draw.io for Confluence](https://marketplace.atlassian.com/apps/1210933/draw-io-diagrams-for-confluence), [ChartDB about](https://www.chartdb.io/about), [next-ai-draw-io sponsorship (PT)](https://thuliobittencourt.com/?p=1993)
- **Distribution platforms:** [Vercel skills](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem), [Agent Skills open standard](https://siliconangle.com/2025/12/18/anthropic-makes-agent-skills-open-standard/), [MCP Apps README](https://cdn.jsdelivr.net/gh/modelcontextprotocol/ext-apps@main/README.md)
- **Image models:** [Nano Banana Pro infographics](https://bgr.com/2032501/nano-banana-pro-viral-infographics/)