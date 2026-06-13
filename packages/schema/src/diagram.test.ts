import { describe, it, expect } from "vitest";
import { DiagramInput } from "./diagram.js";

describe("DiagramInput Schema", () => {
  it("should validate a valid flowchart", () => {
    const data = {
      type: "flowchart",
      title: "Simple Flow",
      nodes: [
        { id: "A", label: "Start", shape: "rounded" },
        { id: "B", label: "End", shape: "rectangle" }
      ],
      edges: [
        { source: "A", target: "B", label: "goes to" }
      ]
    };
    const result = DiagramInput.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should fail validation if node ID has spaces", () => {
    const data = {
      type: "architecture",
      nodes: [
        { id: "my node", label: "Bad Node" }
      ],
      edges: []
    };
    const result = DiagramInput.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should validate a valid sequence diagram", () => {
    const data = {
      type: "sequence",
      participants: [
        { id: "user", label: "User", shape: "actor" },
        { id: "api", label: "API", shape: "service" }
      ],
      messages: [
        { source: "user", target: "api", label: "GET /data", type: "sync" },
        { source: "api", target: "user", label: "200 OK", type: "return" }
      ]
    };
    const result = DiagramInput.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should apply default values", () => {
    const data = {
      type: "flowchart",
      nodes: [
        { id: "A", label: "Node A" }
      ]
    };
    const result = DiagramInput.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "flowchart") {
      expect(result.data.direction).toBe("TB");
      expect(result.data.nodes[0].shape).toBe("rectangle");
      expect(result.data.edges).toEqual([]);
    }
  });
});
