import { describe, it, expect, vi } from "vitest";
import { processDiagram } from "./pipeline.js";

// Mock resvg to avoid native module issues in unit tests.
// Must be a real (constructable) class — vitest 4 invokes mocked
// constructors with `new`, which arrow functions cannot satisfy.
vi.mock("@resvg/resvg-js", () => {
  return {
    Resvg: class {
      render() {
        return { asPng: () => Buffer.from("mockpng") };
      }
    }
  };
});

describe("Rendering Pipeline Orchestrator", () => {
  const dummyFont = new ArrayBuffer(0);

  it("should successfully process a flowchart using Pure SVG Strategy", async () => {
    const input = {
      type: "flowchart",
      direction: "TB",
      nodes: [
        { id: "A", label: "Start" },
        { id: "B", label: "End" }
      ],
      edges: [
        { source: "A", target: "B" }
      ]
    };

    const result = await processDiagram(input, dummyFont);

    // Strategy 2 uses Pure SVG, so it generates real SVG
    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("<rect"); // Nodes are drawn as rects
  });

  it("should successfully process an architecture diagram using Pure SVG Strategy", async () => {
    const input = {
      type: "architecture",
      direction: "LR",
      nodes: [
        { id: "A", label: "User", shape: "person" },
        { id: "B", label: "API", shape: "hexagon" },
        { id: "C", label: "DB", shape: "cylinder" },
      ],
      edges: [
        { source: "A", target: "B" },
        { source: "B", target: "C" },
      ]
    };

    // No font buffer required for pure SVG
    const result = await processDiagram(input);

    // Strategy 3 bypasses Satori, so it generates real SVG
    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("<circle");
    expect(result.svg).toContain("<polygon");
    expect(result.svg).toContain("<ellipse");
  });

  it("should successfully process a sequence diagram using Pure SVG Strategy", async () => {
    const input = {
      type: "sequence",
      participants: [
        { id: "a", label: "Service A", shape: "service" },
        { id: "b", label: "Service B", shape: "service" }
      ],
      messages: [
        { source: "a", target: "b", label: "Call", type: "sync" }
      ]
    };

    const result = await processDiagram(input, new ArrayBuffer(0));
    
    // Strategy is now Pure SVG, so it generates standard SVG
    expect(result.svg).toContain("<svg xmlns=\"http://www.w3.org/2000/svg\"");
    expect(result.metadata.width).toBeGreaterThan(0);
  });

  it("should throw a validation error if input JSON is invalid", async () => {
    const badInput = {
      type: "flowchart",
      nodes: [
        { id: "A" } // missing label
      ]
    };

    await expect(processDiagram(badInput)).rejects.toThrow();
  });
});
