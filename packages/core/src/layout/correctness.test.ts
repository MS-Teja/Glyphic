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

  it("rejects flowchart edges referencing an unknown source node", async () => {
    const input = DiagramInput.parse({
      type: "flowchart",
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" }
      ],
      edges: [{ source: "ghost", target: "b" }]
    });
    await expect(layoutDiagram(input)).rejects.toThrow(/unknown/i);
    await expect(layoutDiagram(input)).rejects.toThrow(/ghost/);
  });

  it("rejects flowchart edges referencing an unknown target node", async () => {
    const input = DiagramInput.parse({
      type: "flowchart",
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" }
      ],
      edges: [{ source: "a", target: "ghost" }]
    });
    await expect(layoutDiagram(input)).rejects.toThrow(/unknown/i);
    await expect(layoutDiagram(input)).rejects.toThrow(/ghost/);
  });

  it("rejects ERD relationships referencing an unknown entity", async () => {
    const input = DiagramInput.parse({
      type: "erd",
      entities: [
        { id: "user", label: "User" },
        { id: "order", label: "Order" }
      ],
      relationships: [{ from: "user", to: "ghost" }]
    });
    await expect(layoutDiagram(input)).rejects.toThrow(/unknown/i);
    await expect(layoutDiagram(input)).rejects.toThrow(/ghost/);
  });

  it("rejects sankey links referencing an unknown node with a friendly error", async () => {
    const input = DiagramInput.parse({
      type: "sankey",
      nodes: [{ id: "a" }, { id: "b" }],
      edges: [{ source: "a", target: "ghost", value: 5 }]
    });
    await expect(layoutDiagram(input)).rejects.toThrow(/unknown/i);
    // Not d3-sankey's cryptic "missing: <id>".
    await expect(layoutDiagram(input)).rejects.not.toThrow(/missing:/);
  });

  it("suggests the closest id and lists the known ids on a typo'd edge", async () => {
    const input = DiagramInput.parse({
      type: "flowchart",
      nodes: [
        { id: "web", label: "Web" },
        { id: "api", label: "API" },
        { id: "db", label: "DB" }
      ],
      edges: [{ source: "webb", target: "api" }]
    });
    // Did-you-mean picks "web" (distance 1) and the valid ids are enumerated.
    await expect(layoutDiagram(input)).rejects.toThrow(/Did you mean "web"\?/);
    await expect(layoutDiagram(input)).rejects.toThrow(/Known node ids: "web", "api", "db"\./);
  });
});
