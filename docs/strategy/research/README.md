# Research behind the October 2026 plan

Five research inputs fed [`../PLAN.md`](../PLAN.md). They were produced on 2026-10-15 by a multi-agent workflow: four independent researchers, then four competing strategists, then two adversarial judges.

| File | What it covers |
|---|---|
| [01-market-landscape.md](01-market-landscape.md) | Around 40 diagram and architecture tools: stars, licenses, business models, distribution channels, failures. Which open-source diagram projects grew in 2025–26 and why, and which ones make money. |
| [02-demand-evidence.md](02-demand-evidence.md) | Pain and willingness to pay, with quotes and links, graded across 11 candidate audiences |
| [03-codebase-audit.md](03-codebase-audit.md) | A measured audit of this repo: build and tests, keep/drop inventory, render cost and readability at 20–200 nodes, layout stability, schema size, and claims that don't hold up |
| [04-technical-frontier.md](04-technical-frontier.md) | Large-graph layout (ELK, TALA, libavoid, HOLA, yFiles…), LLM diagram benchmarks, and how feasible and durable each technical bet is |
| [05-strategies-and-judging.md](05-strategies-and-judging.md) | The four competing strategies in full, plus both judges' scores, fatal flaws, flagged unsupported claims and syntheses |

## Caveats

- **Sources.** Hacker News, Reddit and npm stats were blocked by the network policy during research. Many quotes and business numbers come from search snippets or aggregators, and the reports tag them that way. GitHub star counts came from the GitHub API on 2026-10-15.
- **File paths.** Paths under `/tmp/claude-0/.../scratchpad/` in the reports point to the agents' temporary workspace, which no longer exists. The scripts worth keeping were copied to [`../spikes/`](../spikes/).
- **Claims are not all verified.** The judges flagged unsupported claims in every strategy, listed in file 05. Treat the numbers in 05 as hypotheses unless the plan restates them as measured.
