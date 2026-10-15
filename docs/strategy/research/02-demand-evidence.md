# Demand and pain evidence for Glyphic: who has an unmet need, and who will pay

**Method and caveats.** Hacker News, Reddit, npm-stats and HN-Algolia were blocked by proxy policy (403), and WebFetch failed DNS. Quotes therefore come from search-engine snippets of those pages and couldn't be checked against the live page. GitHub issue data, including reaction counts, came straight from the GitHub search API. Star counts come from aggregators such as trendshift and star-history and are approximate. Revenue figures are third-party estimates (GetLatka, Sacra) unless marked otherwise. I found no Reddit threads directly; search engines barely index them, so the Reddit communities named in the brief are not represented.

## 1. The findings that matter most

1. **The original premise lost in the market, not in the tech.** The two biggest diagram projects of 2026 are agent skills: a prompt plus a design system plus a validator, outputting self-contained HTML/SVG that the model draws itself.
   - **Archify** (tt-a1i/archify): about 83k stars, up from zero in late June 2026. It was gaining about 5k a week in October ([star-history](https://www.star-history.com/tt-a1i/archify/), [gitgenius](https://www.gitgenius.co/repos/tt-a1i/archify)).
   - **cathrynlavery/diagram-design**: about 55k stars, with 37.5k gained between Aug 15 and Oct 14 ([trendshift](https://trendshift.io/repositories/26141)). Its tagline is "No shadows. No Mermaid slop."
   - **Glyphic**: about 7 stars and about 79 weekly npm downloads, according to a directory listing ([enterprisedna](https://enterprisedna.co/directories/mcp/ms-teja-glyphic)).
   - **MCP render tools sit far below the skills.** The official Excalidraw MCP has about 4.8k stars ([gittrend](https://gittrend.io/repo/excalidraw/excalidraw-mcp)), AntV's chart MCP about 4.2k, and mcp-mermaid about 0.6k.
   - **Even AWS moved away from the MCP-tool format.** It yanked its diagram MCP server: "superseded by diagram agent skill in the deploy-on-aws plugin" ([PyPI](https://pypi.org/project/awslabs.aws-diagram-mcp-server/0.8.2025141004/)).
2. **Layout quality is no longer something you can sell.**
   - Mermaid 12.0.0 (released 2026-09-10) ships ELK bundled and as the default layout ([release](https://github.com/mermaid-js/mermaid/releases/tag/mermaid@12.0.0)).
   - Terrastruct, the company behind D2, shut down in September 2026. It open-sourced its paid layout engine TALA under MPL-2.0. In the D2 team's words, "development of open-source D2 was funded by the closed-source IDE (D2 Studio) and proprietary layout algorithm (TALA)" ([D2 blog](https://d2lang.com/blog/d2-non-profit/), [runtimewire](https://runtimewire.com/article/terrastruct-open-sources-tala-alexander-wang-winds-down-business)).
3. **Paid diagramming businesses are small or shrinking.**
   - Structurizr's cloud service reached end of life on 30 Sep 2026 because "usage has since steadily declined" ([EOL](https://docs.structurizr.com/eol), [Patreon](https://www.patreon.com/posts/cloud-service-of-142577083)).
   - Eraser: about $2.8M ARR (estimate) after 4+ years ([GetLatka](https://getlatka.com/companies/eraser.io)).
   - Napkin: about $1.7M revenue in 2025 (estimate) on 5M registered users ([GetLatka](https://getlatka.com/companies/napkin.ai/team), [Fast Company](https://www.fastcompany.com/91373315/napkin-ai-attracts-over-five-million-users)).
   - The money sits next door, where a diagram is one feature among many. AI code review is the clearest case: CodeRabbit is at about $40M ARR (Sacra estimate) and a $1.5B valuation, and the pure-play category is about $420M ARR (estimate) ([Sacra](https://sacra.com/c/coderabbit/), [hyrax](https://hyrax.dev/blog/coderabbit-series-c-review-layer-market)).
4. **Chat platforms now draw diagrams themselves.** Claude added inline interactive visuals on Mar 12, 2026 ([Anthropic](https://claude.com/blog/claude-builds-visuals)). ChatGPT launched "Intelligent UI" with GPT-6 on Oct 7, 2026, including interactive diagrams ([TechCrunch](https://techcrunch.com/2026/10/07/chatgpt-is-getting-a-lot-more-visual-with-the-launch-of-a-new-interface/)). Chat UI kits render Mermaid natively: Streamdown/assistant-ui ([docs](https://www.assistant-ui.com/docs/ui/streamdown.md)) and Open WebUI ([docs](https://docs.openwebui.com/features/mermaid)).
5. **Large-diagram pain is real but low in intensity, and it is mostly a request to navigate, not for one giant diagram.**
   - On Mermaid, a roughly 80k-star repo with millions of users, the most-upvoted layout issues get only 30 to 50 thumbs-up:
     - [#5420](https://github.com/mermaid-js/mermaid/issues/5420), ELK positioning: 49
     - [#815](https://github.com/mermaid-js/mermaid/issues/815), keep node order: 45
     - [#1860](https://github.com/mermaid-js/mermaid/issues/1860), "ZOOM!!!": 35
     - [#4990](https://github.com/mermaid-js/mermaid/issues/4990), subgraph overlap: 34
     - [#2383](https://github.com/mermaid-js/mermaid/issues/2383), "tries harder not to cross lines": 17
   - For comparison, the "Component Diagram" feature request has 363.
   - Experts advise against big all-in-one diagrams. Ilograph calls "master" diagrams of a whole system "almost always a mistake" ([Ilograph](https://ilograph.com/blog/posts/more-common-diagram-mistakes)).
   - Inside the winning tool, the large-diagram pain shows up as requests for drilldown and better edge routing: Archify [#280](https://github.com/tt-a1i/archify/issues/280) (cross-diagram drilldowns), [#401](https://github.com/tt-a1i/archify/issues/401) (expandable node subgraphs), [#660](https://github.com/tt-a1i/archify/issues/660) ("Shared ports/corridors between edges cause routing conflicts"), [#6](https://github.com/tt-a1i/archify/issues/6) ("The arrows are disorganized and unappealing").
6. **The top complaint about AI diagrams is that they are wrong, not that they are ugly.** That gap opens wider as the system gets larger.
7. **Distribution:** Archify got 1 point on HN ([write-up](https://artificiallyintimidating.com/p/archify-free-architecture-diagram-tool)) yet still reached about 83k stars. Diagram tools in 2026 went viral through X, Japanese and Chinese developer communities (note.com, DeepSeek/opencode users), skills.sh and trendshift. HN and dev.to, the channels Glyphic has used, were not where this happened.

## 2. Graded audiences

Scale is 1 to 5, higher is stronger. In the "Models already cover it" column, 5 means frontier models or chat platforms already satisfy the need, which leaves little room for Glyphic.

| Audience | Pain | How often | Willingness to pay (who pays) | Reachable by a solo OSS dev | Models already cover it | Already served by | Grade |
|---|---|---|---|---|---|---|---|
| (a) Agent/LLM-app builders needing a diagram API | 2 | 3 | 1 (individuals or infra; tiny) | 4 | 5 | Claude/ChatGPT native visuals, MCP Apps, Streamdown, Kroki, Excalidraw/draw.io official MCPs | **D** |
| (b) Eng teams documenting architecture | 3 (chronic, rarely urgent) | 2 | 2 (team budgets exist, but Structurizr cloud and Terrastruct died) | 4 | 4 with a skill | Archify, GitDiagram (~17k stars), DeepWiki, CodeBoarding, IcePanel, Eraser | **C** |
| (c) Reviewers of AI-generated PRs | **5** | **5** | 4 for review tooling; **2 for diagrams specifically** | 4 (GitHub Marketplace) | 2–3 (no stable, verifiable before/after view) | CodeRabbit diagrams, Eraserbot visual diffs, PR Lens, CodeBoarding Action, Groma, ArchLens, Cubic, repoatlas | **B** (best pain; diagrams not proven as the fix) |
| (d) Platform/cloud/SRE teams | 3 | 2 | 4 (team) | 2 (needs credentials, trust, enterprise sales) | 2 (large infra graphs are hard for models) | Hava, Cloudcraft (Datadog), Lucidscale, InfraSketch, Terravision, Holori | **C+** |
| (e) Tech writers / devrel / bloggers | 3 (looks, brand fit) | 3 | 2 (individuals, $6–22/mo) | 5 | 4–5 with a skill | diagram-design (55k stars), Excalidraw, Napkin | **C** (lots of stars, little money) |
| (f) Educators / students | 2 | 3 | 1 | 2 | 5 (GPT-6 Intelligent UI demos target this) | Napkin, ChatGPT interactive math/science visuals, Manim tools | **D** |
| (g) Consultants / solution architects | 3 | 3 | 3 (the firm pays; billable hours) | 2 | 3 | Lucid AI, draw.io MCP, Eraser, Cloudcraft; they need editable draw.io/Visio/PPTX | **C-** |
| (h) Non-technical knowledge workers | 2 | 2 | 1–2 | 1 | 5 | Napkin (5M users), Gamma, Claude/ChatGPT visuals, Nano Banana Pro | **F** |
| (i1) Compliance/security (SOC 2 network and data-flow diagrams, threat-model diagrams) | 3 | 1–2 (annual plus change management) | 4 (compliance budgets) | 2–3 | 3 (must be accurate and current) | Hava/Cloudcraft, pytm, TMDD, Apiiro, awesome-copilot threat-model skill | **C+/B-** |
| (i2) Skill and agent-tool authors needing a layout engine | 2–3 | n/a | 1 (ELK free, bundled in Mermaid 12, TALA open-sourced) | 3 | n/a | Their own renderers, ELK | **D** as a business; possible distribution lever |
| (i3) Onboarding to unfamiliar codebases ("cognitive debt") | 3–4 | 3 | 1–2 | 4 | 4 | DeepWiki, GitDiagram, CodeBoarding, Archify | **C** |

## 3. Top quotes, by topic

**Models handle small and medium diagrams; layout still takes iteration**
- HN, 2026: "I've had excellent luck using Claude Code to generate 'mermaid diagrams' for me… headlessly using mmdc/puppeteer." Also: "I now often have CC make technical/architecture diagrams with tikz… much better than mermaid but still requires multiple iterations to fix bad arrows, bad layouts etc." ([HN 47826920](https://news.ycombinator.com/item?id=47826920))
- HN, Claude visuals thread: "Claude can do mermaid diagrams… but I have been asking it to generate draw.io diagrams as of late." ([HN 47352751](https://news.ycombinator.com/item?id=47352751))
- HN Excalidraw-blog thread (81 points): Claude-generated excalidraw-mcp diagrams were "too raw/unpolished"; another commenter said Mermaid "can be created and edited very easily by LLMs." ([HN 47571376](https://news.ycombinator.com/item?id=47571376))
- Mermaid issue, via a mirror: "Often I have to go through try and error to find a configuration, where the edges don't overlap." ([lightrun](https://lightrun.com/answers/mermaid-js-mermaid-how-to-prevent-edge-overlap))

**Large and auto-generated infrastructure diagrams**
- Cloudcraft reviewer on AWS Marketplace: "While all the components are present, the layout is super messy." ([AWS Marketplace](https://aws.amazon.com/marketplace/reviews/reviews-list/B08KBV31ZM?page=20))
- InfraSketch, a vendor: a production setup with "50+ resources generates a graph that's essentially unreadable." ([InfraSketch](https://infrasketch.cloud/blog/terraform-visualization-best-practices.html))
- Obsidian forum, a CSS hack "for big mermaid C4 models… zooms in diagrams by default… allows panning." ([forum](https://forum.obsidian.md/t/let-the-user-decide-the-size-and-alignment-of-mermaid-diagrams/7019?page=3)) Four or more Obsidian plugins exist only to add pan and zoom for Mermaid.

**Documentation goes stale**
- Updating diagrams "is often neglected as it does not provide any short-term benefit." ([Teamscale](https://teamscale.com/blog/en/news/blog/challenges-of-architecture-documentation))
- "That's the problem with diagrams - they are outdated immediately." ([HN 18508284](https://news.ycombinator.com/item?id=18508284))
- Survey numbers:
  - IcePanel 2025 (n=75): keeping documentation current is the #1 challenge, and update cadence splits roughly evenly between weekly, monthly, quarterly and annual ([IcePanel](https://icepanel.io/blog/state-of-software-architecture-survey-2025)).
  - vFunction 2025: 56% have out-of-date docs (via a secondary source).
- Teamblind thread: "anyone else find architecture diagrams utterly useless." ([Blind](https://www.teamblind.com/post/anyone-else-find-architecture-diagrams-utterly-useless-mgsuegkb))

**AI diagrams being wrong**
- DeepWiki: "the high-level compilation pipeline diagram is wrong"; caught it "hallucinating pretty convincingly far more than once." ([HN 45002092](https://news.ycombinator.com/item?id=45002092))
- A blogger on DeepWiki: "the graphs just don't make sense." ([blopker](https://blopker.com/writing/12-deepwiki/))
- GitDiagram: a commenter found "a connection in the diagram that doesn't exist in the codebase." ([HN 42521769](https://news.ycombinator.com/item?id=42521769))
- On Archify: "a confidently wrong architecture diagram is worse than no diagram at all." ([LinkedIn](https://www.linkedin.com/posts/ashishpatel2604_your-code-agent-now-draws-real-architectures-activity-7498221309999505408-xr5x))

**AI-PR review burden (strong, measured)**
- Faros, 10k+ developers: review time +91% and PR size +154% on high-AI-adoption teams ([summary](https://www.augmentcode.com/guides/ai-productivity-paradox-engineering-delivery)).
- Harvard/Jellyfish, 700+ firms, Oct 2026: review time +49%, with no increase in features shipped ([Slashdot/Ars](https://tech.slashdot.org/story/26/10/12/0234217/)).
- Qodo 2026: reviewing and validating AI code is the #1 delivery constraint, a 26% plurality ([Qodo](https://www.qodo.ai/blog/state-of-ai-code-quality-report-2026/)).
- One team's PRs grew 3.5x and they caught fewer bugs ([Brodzinski](https://brodzinski.com/2026/07/3x-pull-request-size-ai.html)).
- **Counter-signal:** in the HN thread on managing PR review load, practitioners describe automating mechanical checks, keeping PRs small, live demos and AI triage. Nobody asks for diagrams ([HN 48329446](https://news.ycombinator.com/item?id=48329446)).
- Some teams turn off CodeRabbit's sequence diagrams ([example](https://github.com/shgew/togi/issues/60)).
- PR Lens, a competitor, points out that a Mermaid sequence diagram has "no way to say that this participant is new, that one was modified." ([PR Lens](https://prlens.dev/guides/pr-lens-vs-coderabbit); vendor source)

**Diagram-in-PR competitors already shipping**
- Eraserbot: comments a visual diff on PRs; paid, since March 2025 ([docs](https://docs.eraser.io/docs/eraserbot)).
- PR Lens: MIT, GitHub App, free for open source, about 1.2–1.5k stars ([repo](https://github.com/coldteadotai/pr-lens)).
- Groma action v1.0, by the author of Backlog.md: before/after maps ([release](https://github.com/MrLesk/groma.md-action/releases/tag/v1.0.0)).
- CodeBoarding: about 2.6k stars, has a PR action ([repo](https://github.com/CodeBoarding/CodeBoarding)).
- ArchLens: free for public repos; billing for private repos not live yet ([repo](https://github.com/archlens-ai/archlens-action)).
- Also Cubic, repoatlas and Logic.

**Compliance**
- The revised SOC 2 points of focus call for "network and/or data flow diagrams that accurately depict the system" ([Wolf & Co](https://www.wolfandco.com/resources/insights/trust-services-criteria-soc-2-reports/)). Auditors expect a "last updated" date within the last 12 months or the audit period ([Strike Graph](https://www.strikegraph.com/blog/pci-dss-vs-soc-2)).

**Willingness-to-pay benchmarks**
- Individuals: Napkin $9–22/mo, Excalidraw+ $6–7/mo, Ilograph $12–22/mo.
- Teams: IcePanel $40–80 per editor/mo, Hava $59–249/mo ([Hava](https://www.hava.io/pricing)), Cloudcraft about $49/user/mo.
- Usage-based: Ilograph's Export API is $99.99/mo for 750 exports ([Ilograph](https://ilograph.com/export-api)).

## 4. Ranked conclusion: where the strongest unmet demand is

The skeptical summary is that no audience shows clear unmet demand that it will pay a solo OSS maintainer to solve with a diagram product. Demand for free tools is huge, but Archify and diagram-design have already captured it with the opposite approach to Glyphic's (the model draws, guided by a skill). The money is in workflows where the diagram is one feature.

1. **(c) Understanding what an AI change did, at review time.** This is the best combination of pain and budget, but only a narrow slice is unmet. What no current tool clearly provides together:
   - a deterministic before/after structural diff
   - a stable layout across commits, so the picture doesn't reshuffle on every push
   - every edge linked to the code it came from
   - architecture rule checks, which are the part that could be paid for private repos

   **Risks:**
   - At least 8 entrants shipped in 2026, and Eraser already sells PR visual diffs.
   - Practitioners don't ask for diagrams.
   - Free rule-checkers already exist: dependency-cruiser, ArchUnit, import-linter, Nx module boundaries.
   - CodeRabbit can add any of this as a feature.

   Before committing, check that reviewers actually open and use these diagrams, for example by running a free action on agent-heavy OSS repos and measuring engagement. This supports the lead's direction only partly, and with less confidence than it assumed.
2. **(i1)+(d) Compliance-grade system and data-flow maps kept current from IaC or code.** The need recurs, has a team budget, depends on accuracy and big-graph layout (which is where Glyphic's ELK post-passes actually help), and has fewer viral free competitors. Against that: incumbents (Hava, Cloudcraft, Lucidscale), the trust and credentials barrier, and a sales motion that is hard for a solo developer. A $50–250/mo micro-SaaS is plausible.
3. **(b)/(e)/(i3) A free skill aimed at stars.** Demand is proven and the channel is reachable, but the leaders are 55–83k stars ahead. It is only worth entering with a clear wedge: navigating large systems by zooming and drilling down (Archify users are asking for this right now), verified edges, or editable draw.io/Excalidraw/PPTX output for consultants (g). Treat it as a funnel, not revenue.

**Avoid:** (a) a diagram API or MCP for agents, (f) education, (h) non-technical users, and selling a layout engine (i2). Platforms and free bundled ELK/TALA have absorbed these.