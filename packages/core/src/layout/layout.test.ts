import { describe, it, expect } from "vitest";
import { layoutDiagram } from "./index.js";
import { wrapSequenceLabel } from "../text-metrics.js";
import type { DiagramInputType } from "@glyphicjs/schema";

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

  it("wraps sequence labels to the exact lines the renderer will draw", async () => {
    // A long, multi-word label between adjacent participants. The adapter sizes
    // the row from wrapSequenceLabel(label, labelMaxWidth); the renderer wraps
    // with the same helper and the same budget (metadata.labelMaxWidth), so what
    // layout measures must equal what render draws. This pins that agreement.
    const label = "Publish order.created event to the message broker";
    const input: DiagramInputType = {
      type: "sequence",
      exportFormat: ["png"],
      participants: [
        { id: "svc", label: "Service", shape: "service" },
        { id: "bus", label: "Event Bus", shape: "service" }
      ],
      messages: [{ source: "svc", target: "bus", label, type: "async" }]
    };

    const result = await layoutDiagram(input);
    const msg = result.edges.find(e => e.id.startsWith("msg-"));
    expect(msg).toBeDefined();

    const budget = msg!.metadata?.labelMaxWidth;
    expect(typeof budget).toBe("number");

    // The budget must reproduce the same line count both sides will use.
    const lines = wrapSequenceLabel(label, budget as number);
    expect(lines.length).toBeGreaterThan(1); // long label genuinely wraps at this width
  });

  it("gives multi-line messages taller rows than single-line ones", async () => {
    // Two adjacent-participant messages: one short (1 line), one long (wraps).
    // The long one's row must advance currentY further, proving row height is
    // content-aware rather than the old flat 80px.
    const short: DiagramInputType = {
      type: "sequence",
      exportFormat: ["png"],
      participants: [
        { id: "a", label: "A", shape: "service" },
        { id: "b", label: "B", shape: "service" }
      ],
      messages: [
        { source: "a", target: "b", label: "Hi", type: "sync" },
        { source: "b", target: "a", label: "Ok", type: "return" }
      ]
    };
    const long: DiagramInputType = {
      type: "sequence",
      exportFormat: ["png"],
      participants: [
        { id: "a", label: "A", shape: "service" },
        { id: "b", label: "B", shape: "service" }
      ],
      messages: [
        {
          source: "a",
          target: "b",
          label: "Submit the complete multi-field registration payload for review",
          type: "sync"
        },
        { source: "b", target: "a", label: "Ok", type: "return" }
      ]
    };

    const shortResult = await layoutDiagram(short);
    const longResult = await layoutDiagram(long);

    const gap = (r: Awaited<ReturnType<typeof layoutDiagram>>) => {
      const msgs = r.edges.filter(e => e.id.startsWith("msg-"));
      return msgs[1].sections[0].startPoint.y - msgs[0].sections[0].startPoint.y;
    };

    // The wrapped first message pushes the second one further down.
    expect(gap(longResult)).toBeGreaterThan(gap(shortResult));
  });
});
