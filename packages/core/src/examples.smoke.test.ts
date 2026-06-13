import { describe, it, expect, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { DiagramInput } from "@glyphic/schema";
import { processDiagram } from "./pipeline.js";

// Rasterization is native; mock it so the smoke test stays pure/fast.
vi.mock("@resvg/resvg-js", () => ({
  Resvg: class {
    render() {
      return { asPng: () => Buffer.from("mockpng") };
    }
  }
}));

const examplesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../docs/examples"
);
const files = readdirSync(examplesDir).filter((f) => f.endsWith(".json"));

describe("docs/examples render smoke test", () => {
  it("discovers example fixtures", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`renders ${file} into valid SVG without throwing`, async () => {
      const raw = JSON.parse(readFileSync(join(examplesDir, file), "utf8"));
      const input = DiagramInput.parse(raw);
      const result = await processDiagram(input);

      expect(result.svg).toContain("<svg");
      expect(result.metadata.width).toBeGreaterThan(0);
      expect(result.metadata.height).toBeGreaterThan(0);
    });
  }
});
