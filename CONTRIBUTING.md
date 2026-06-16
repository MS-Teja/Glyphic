# Contributing to Glyphic

Thanks for your interest in improving Glyphic!

## Prerequisites

- **Node.js** >= 20
- **pnpm** 11 (the repo pins a version via `packageManager`; run `corepack enable` to use it automatically)

## Setup

```bash
pnpm install
```

## Common tasks

All tasks run through Turborepo from the repo root:

```bash
pnpm build       # compile every package (tsc)
pnpm typecheck   # type-check without emitting
pnpm test        # run the vitest suites
pnpm lint        # biome lint
pnpm format      # biome format --write
```

Run a single package, e.g.:

```bash
pnpm --filter @glyphicjs/core test
```

## Architecture

This is a pnpm + Turborepo monorepo:

- **`packages/schema`** — the Zod contract (`@glyphicjs/schema`). The first line of input validation.
- **`packages/core`** — the engine (`@glyphicjs/core`): layout adapters, scene graph, SVG rendering, rasterization. Diagram types are wired in `src/registry.ts`.
- **`packages/mcp-server`** — the Model Context Protocol server.

### Adding a new diagram type

1. Add its Zod schema to `packages/schema/src/diagram.ts` and include it in `DiagramInput`.
2. Add a layout adapter under `packages/core/src/layout/`.
3. Register the type in `packages/core/src/registry.ts` (layout adapter + render strategy).
4. Add an example fixture under `docs/examples/` — the smoke/snapshot tests pick it up automatically.

## Tests

- `examples.smoke.test.ts` renders every fixture and asserts valid output.
- `examples.snapshot.test.ts` holds exact-SVG golden snapshots; intentional output changes are reviewed via `vitest -u`.
- Security/validation behavior is covered in `render/sanitize.test.ts` and `schema/validation.test.ts`.

Please keep the build, typecheck, lint, and tests green before opening a PR.

## License

By contributing you agree your contributions are licensed under the MIT License.
