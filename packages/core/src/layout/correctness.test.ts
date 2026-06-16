import { describe, it, expect } from "vitest";
import { DiagramInput } from "@glyphicjs/schema";
import { layoutDiagram } from "./index.js";

describe("layout correctness regressions", () => {
  it("gives parallel edges (same source/target) their own labels", async () => {
    const input = DiagramInput.parse({
      type: "flowchart",
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" }
      ],
      edges: [
        { source: "a", target: "b", label: "first" },
        { source: "a", target: "b", label: "second" }
      ]
    });
    const result = await layoutDiagram(input);
    const labels = result.edges.map((e) => e.label).sort();
    expect(labels).toEqual(["first", "second"]);
  });

  it("does not mutate the caller's input for mindmaps", async () => {
    const input = DiagramInput.parse({
      type: "mindmap",
      nodes: [{ id: "a", label: "Root" }],
      edges: []
    });
    await layoutDiagram(input);
    expect((input as any).algorithm).toBeUndefined();
  });

  it("rejects sequence messages referencing unknown participants", async () => {
    const input = DiagramInput.parse({
      type: "sequence",
      participants: [
        { id: "a", label: "A" },
        { id: "b", label: "B" }
      ],
      messages: [{ source: "a", target: "ghost", label: "hi" }]
    });
    await expect(layoutDiagram(input)).rejects.toThrow(/unknown/i);
  });
});
