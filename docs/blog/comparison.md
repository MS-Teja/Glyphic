# Glyphic vs. the alternatives

> Technical comparison post. Doubles as dev.to / Hashnode cross-post.
> Suggested tags: `webdev`, `architecture`, `ai`, `opensource`, `devtools`

A technical comparison for developers evaluating diagram generation tools.

*(Glyphic is an open-source diagram engine built for AI agents. It turns JSON into SVG/PNG natively without a headless browser.)*

> This page compares approaches, not products. Claude Artifacts is a cloud feature, not a
> library — the comparison is qualitative. The Mermaid comparison includes quantitative
> benchmarks measured on an M2 Mac Mini, 8GB RAM.

## Feature matrix

| Feature | Glyphic | Claude Artifacts | Mermaid | D2 |
|---|---|---|---|---|
| **Input format** | Typed JSON (Zod schema) | Natural language → SVG | Text DSL | Text DSL |
| **Renders without a browser** | ✅ Rust (resvg) | N/A (cloud-only) | ❌ Puppeteer/Chromium | ✅ Go binary |
| **Model-agnostic** | ✅ Any JSON-capable LLM | ❌ Claude only | ✅ | ✅ |
| **Self-hostable** | ✅ Library / API / MCP | ❌ | ✅ (with Puppeteer) | ✅ |
| **Programmatic API** | ✅ `processDiagram()` | ❌ | ✅ `mermaid.render()` | ✅ CLI / Go |
| **React Flow output** | ✅ Interactive nodes/edges | ❌ | ❌ | ❌ |
| **Native MCP server** | ✅ `@glyphicjs/mcp-server` | N/A (built-in to Claude) | ❌ | ❌ |
| **Schema validation** | ✅ Zod + fixable errors | ❌ | ❌ Parse-or-crash | ❌ |
| **Custom fonts** | ✅ Google Fonts / custom TTF | ✅ (in SVG output) | ⚠️ Limited | ✅ |
| **Icons** | ✅ FontAwesome + custom SVG | ✅ (manual in SVG) | ❌ | ⚠️ Limited |
| **Themes / styles** | ✅ Unlimited themes × 4 styles | N/A (freeform) | ✅ Built-in themes | ✅ |
| **Nested groups** | ✅ Arbitrary depth | ✅ (manual in SVG) | ✅ Subgraphs | ✅ Containers |
| **Diagram types** | 18 + Unlimited (freeform SVG) | Unlimited (freeform SVG) | ~20 | ~10 |
| **Output formats** | SVG · PNG · React Flow | SVG (in chat) | SVG · PNG | SVG · PNG · PDF |
| **Deterministic output** | ✅ Byte-identical | ❌ | ⚠️ Mostly | ✅ |
| **Accessible SVG** | ✅ `role="img"` + `<title>` | ❌ | ❌ | ❌ |
| **License** | FSL → Apache-2.0 | Proprietary | MIT | MPL-2.0 |

### Reading this table

**Claude Artifacts** is a different kind of thing — it's a chat feature that generates freeform
SVG, not a library you integrate. It produces beautiful results, but you can't `npm install` it,
self-host it, or use it from any model besides Claude. I include it because it's the comparison
developers naturally make: "Claude can already draw diagrams, why do I need Glyphic?"

The answer: Claude draws diagrams for *you*. Glyphic draws diagrams for your *pipeline*.

**Mermaid** is the closest apples-to-apples comparison for server-side rendering, which is why
the benchmarks below focus on Mermaid + Puppeteer vs. Glyphic.

## Benchmarks: Glyphic vs Puppeteer + Mermaid

> Machine: M2 Mac Mini, 8GB RAM · Node v22
>
> Cold start = first-invocation time (loading resvg WASM vs launching Puppeteer).
> This is the real cost when spinning up a fresh GCP/Lambda instance — not paid on every render.

*Run `node internal/benchmark/benchmark.mjs` to reproduce these numbers.*

### Cold start

| Metric | Glyphic | Mermaid + Puppeteer |
|---|---|---|
| **First invocation** | ~1,695 ms | ~3,601 ms |
| **Memory delta** | ~60 MB | ~275 MB |

Glyphic's cold start is loading the resvg WASM module. Mermaid's cold start is launching a full
Chromium process and initializing the Mermaid library inside it.

### Warm render time (median of 20 runs)

| Diagram | Glyphic (SVG) | Glyphic (PNG) | Mermaid + Puppeteer (SVG) |
|---|---|---|---|
| **Small** (5-node flowchart) | ~5 ms | ~662 ms | ~13 ms |
| **Medium** (15-node architecture) | ~14 ms | ~951 ms | ~36 ms |
| **Large** (8-entity ERD) | ~7 ms | ~778 ms | ~47 ms |

> These are exact numbers from the run. Mermaid is extremely fast at warm text-to-SVG generation once Chromium is running, while Glyphic is doing a full Rust-based SVG-to-PNG rasterization on every render.
> Exact results are in `internal/benchmark/results/`.

### Bundle size

| Package | Size |
|---|---|
| `@glyphicjs/*` (all packages) | ~15–25 MB |
| `puppeteer` (with Chromium) | ~300+ MB |

### What this means

- On a **cold Lambda/Cloud Run instance**, Glyphic is ready ~3.5x faster.
  Puppeteer needs nearly 6 seconds to spin up Chromium.
- For **warm renders**, Mermaid is incredibly fast because it only emits SVG strings. Glyphic spends its ~800ms doing heavy lifting: a full native SVG-to-PNG rasterization.
- In **CI**, `npm install @glyphicjs/core` downloads tens of megabytes. `npm install puppeteer`
  downloads Chromium at ~300 MB.
- **Memory**: Glyphic runs in the Node process. Puppeteer runs a separate Chromium process that
  consumes 200+ MB.

## When to use what

| Use case | Best tool |
|---|---|
| One-off diagram in a Claude chat | Claude Artifacts |
| Quick docs diagram committed to a repo | Mermaid (easy syntax, widespread support) |
| Server-side / agent / pipeline rendering | **Glyphic** (no browser, fast, embeddable) |
| Interactive diagrams in your product | **Glyphic** (React Flow output) |
| Diagram rendering in CI/CD | **Glyphic** (small footprint, deterministic) |
| Self-hosted diagram API | **Glyphic** or D2 (both work, different tradeoffs) |

I'm not pretending Glyphic replaces everything. Claude Artifacts is magical for ad-hoc work.
Mermaid has massive ecosystem support and is great in README files. D2 is a solid Go tool.

Glyphic fills the gap where you need **programmatic, model-agnostic, browser-free diagram
rendering that you own and embed** — which is a gap none of the others fill well.

---

See the [examples gallery](./examples/README.md) for rendered output, and the
[diagram types reference](./diagram-types.md) for every input schema.
