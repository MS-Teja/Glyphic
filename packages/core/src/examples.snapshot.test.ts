import { describe, it, expect, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { DiagramInput } from "@glyphic/schema";
import { processDiagram } from "./pipeline.js";

// Exact-SVG snapshots act as a guard for behavior-preserving refactors:
// any change to rendered output for a known fixture shows up as a diff.
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
const files = readdirSync(examplesDir).filter((f) => f.endsWith(".json")).sort();

describe("docs/examples SVG snapshots (refactor guard)", () => {
  for (const file of files) {
    it(`renders ${file} to a stable SVG`, async () => {
      const raw = JSON.parse(readFileSync(join(examplesDir, file), "utf8"));
      const result = await processDiagram(DiagramInput.parse(raw));
      expect(result.svg).toMatchSnapshot();
    });
  }
});
