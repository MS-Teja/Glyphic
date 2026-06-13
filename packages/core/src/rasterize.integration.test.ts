import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { DiagramInput } from "@glyphic/schema";
import { processDiagram } from "./pipeline.js";

// Intentionally does NOT mock @resvg/resvg-js: this drives the real rasterizer
// so malformed SVG (e.g. bad XML entities from a themed @import) is caught —
// the mocked smoke/snapshot tests never parse the SVG.
const examplesDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../docs/examples");
const files = readdirSync(examplesDir).filter((f) => f.endsWith(".json"));

describe("real rasterization", () => {
  for (const file of files) {
    it(`rasterizes ${file} to a non-empty PNG`, async () => {
      const input = DiagramInput.parse(JSON.parse(readFileSync(join(examplesDir, file), "utf8")));
      const result = await processDiagram(input);
      expect(result.png.length).toBeGreaterThan(0);
    });
  }

  it("rasterizes a themed (Google Font) diagram whose @import contains '&'", async () => {
    const result = await processDiagram({
      type: "flowchart",
      theme: { fontFamily: "Roboto" },
      nodes: [
        { id: "a", label: "A & B" },
        { id: "b", label: "End" }
      ],
      edges: [{ source: "a", target: "b", label: "x & y" }]
    });
    expect(result.png.length).toBeGreaterThan(0);
  });
});
