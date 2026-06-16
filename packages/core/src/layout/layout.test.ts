import { describe, it, expect } from "vitest";
import { layoutDiagram } from "./index.js";
import { DiagramInputType } from "@glyphicjs/schema";

describe("Layout Engine", () => {
  it("should layout a simple flowchart", async () => {
    const input: DiagramInputType = {
      type: "flowchart",
      exportFormat: ["png"],
      direction: "TB",
      routing: "orthogonal",
      nodes: [
        { id: "A", label: "Start", shape: "rectangle" },
        { id: "B", label: "End", shape: "rectangle" }
      ],
      edges: [
        { source: "A", target: "B", label: "goes to", style: "solid", arrow: "forward" }
      ]
    };

    const result = await layoutDiagram(input);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    
    // ELK should position B below A since direction is TB (DOWN)
    const nodeA = result.nodes.find(n => n.id === "A");
    const nodeB = result.nodes.find(n => n.id === "B");
    
    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();
    
    // B's y coordinate should be greater than A's y coordinate
    expect(nodeB!.y).toBeGreaterThan(nodeA!.y);
  });

  it("should layout a sequence diagram", async () => {
    const input: DiagramInputType = {
      type: "sequence",
      exportFormat: ["png"],
      participants: [
        { id: "user", label: "User", shape: "actor" },
        { id: "api", label: "API", shape: "service" }
      ],
      messages: [
        { source: "user", target: "api", label: "Request", type: "sync" },
        { source: "api", target: "user", label: "Response", type: "return" }
      ]
    };

    const result = await layoutDiagram(input);
    expect(result.nodes).toHaveLength(2);
    // 2 messages + 2 lifelines
    expect(result.edges).toHaveLength(4);
    
    const userNode = result.nodes.find(n => n.id === "user");
    const apiNode = result.nodes.find(n => n.id === "api");
    
    // API node should be to the right of User node
    expect(apiNode!.x).toBeGreaterThan(userNode!.x);
    
    const messages = result.edges.filter(e => e.id.startsWith("msg-"));

    // Edges should have correct y coordinates (message 2 below message 1)
    expect(messages[1].sections[0].startPoint.y).toBeGreaterThan(messages[0].sections[0].startPoint.y);
  });
});
