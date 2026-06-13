import { describe, it, expect } from "vitest";
import { DiagramInput } from "./diagram.js";

const baseFlow = { type: "flowchart", nodes: [{ id: "a", label: "A" }], edges: [] };

describe("schema validation hardening", () => {
  it("rejects non-https customFontUrl (SSRF/injection surface)", () => {
    expect(() => DiagramInput.parse({ ...baseFlow, theme: { customFontUrl: "file:///etc/passwd" } })).toThrow();
    expect(() => DiagramInput.parse({ ...baseFlow, theme: { customFontUrl: "http://evil.example/f.ttf" } })).toThrow();
    expect(() => DiagramInput.parse({ ...baseFlow, theme: { customFontUrl: "javascript:alert(1)" } })).toThrow();
  });

  it("accepts an https customFontUrl", () => {
    expect(() => DiagramInput.parse({ ...baseFlow, theme: { customFontUrl: "https://cdn.example/f.ttf" } })).not.toThrow();
  });

  it("rejects fontFamily containing CSS-breaking characters", () => {
    expect(() => DiagramInput.parse({ ...baseFlow, theme: { fontFamily: "Evil'); }" } })).toThrow();
  });

  it("caps the number of nodes (DoS guard)", () => {
    const nodes = Array.from({ length: 1001 }, (_, i) => ({ id: "n" + i, label: "x" }));
    expect(() => DiagramInput.parse({ type: "flowchart", nodes, edges: [] })).toThrow();
  });

  it("rejects deeply nested canvas elements (depth bomb)", () => {
    let el: any = { type: "rect", x: 0, y: 0, width: 1, height: 1 };
    for (let i = 0; i < 30; i++) el = { type: "group", children: [el] };
    expect(() => DiagramInput.parse({ type: "canvas", width: 10, height: 10, elements: [el] })).toThrow();
  });

  it("rejects negative pie values", () => {
    expect(() => DiagramInput.parse({ type: "pie", data: [{ label: "a", value: -5 }] })).toThrow();
  });

  it("requires gantt tasks to have end or duration", () => {
    expect(() =>
      DiagramInput.parse({
        type: "gantt",
        sections: [{ label: "S", tasks: [{ id: "t", label: "T", start: 0 }] }]
      })
    ).toThrow();
    expect(() =>
      DiagramInput.parse({
        type: "gantt",
        sections: [{ label: "S", tasks: [{ id: "t", label: "T", start: 0, duration: 3 }] }]
      })
    ).not.toThrow();
  });

  it("still accepts a normal valid diagram", () => {
    expect(() => DiagramInput.parse(baseFlow)).not.toThrow();
  });
});

describe("new first-class diagram types", () => {
  it("accepts a valid state diagram and rejects an unknown kind", () => {
    expect(() =>
      DiagramInput.parse({ type: "state", states: [{ id: "s", kind: "initial" }], transitions: [] })
    ).not.toThrow();
    expect(() => DiagramInput.parse({ type: "state", states: [{ id: "s", kind: "bogus" }] })).toThrow();
  });

  it("accepts a valid ERD and rejects an invalid cardinality", () => {
    expect(() =>
      DiagramInput.parse({
        type: "erd",
        entities: [{ id: "u", attributes: [{ name: "id", key: "PK" }] }],
        relationships: []
      })
    ).not.toThrow();
    expect(() =>
      DiagramInput.parse({ type: "erd", entities: [{ id: "u" }], relationships: [{ from: "u", to: "u", cardinality: "lots" }] })
    ).toThrow();
  });

  it("accepts a valid UML class diagram", () => {
    expect(() =>
      DiagramInput.parse({
        type: "class",
        classes: [{ id: "A", attributes: ["x: number"], methods: ["go(): void"] }],
        relationships: [{ from: "A", to: "A", type: "inheritance" }]
      })
    ).not.toThrow();
  });

  it("accepts a valid timeline", () => {
    expect(() =>
      DiagramInput.parse({ type: "timeline", periods: [{ label: "2024", events: ["Founded"] }] })
    ).not.toThrow();
  });

  it("validates journey task score range (1-5)", () => {
    expect(() =>
      DiagramInput.parse({ type: "journey", sections: [{ label: "S", tasks: [{ label: "t", score: 3 }] }] })
    ).not.toThrow();
    expect(() =>
      DiagramInput.parse({ type: "journey", sections: [{ label: "S", tasks: [{ label: "t", score: 9 }] }] })
    ).toThrow();
  });

  it("accepts a valid kanban board and rejects an unknown priority", () => {
    expect(() =>
      DiagramInput.parse({ type: "kanban", columns: [{ label: "To Do", cards: [{ label: "task", priority: "high" }] }] })
    ).not.toThrow();
    expect(() =>
      DiagramInput.parse({ type: "kanban", columns: [{ label: "To Do", cards: [{ label: "task", priority: "urgent" }] }] })
    ).toThrow();
  });

  it("accepts a valid C4 diagram and rejects an unknown kind", () => {
    expect(() =>
      DiagramInput.parse({ type: "c4", elements: [{ id: "p", label: "User", kind: "person" }], relationships: [] })
    ).not.toThrow();
    expect(() => DiagramInput.parse({ type: "c4", elements: [{ id: "p", label: "User", kind: "alien" }] })).toThrow();
  });

  it("accepts a valid treemap and rejects a depth bomb", () => {
    expect(() =>
      DiagramInput.parse({ type: "treemap", root: { label: "r", children: [{ label: "a", value: 1 }] } })
    ).not.toThrow();
    let n: any = { label: "leaf", value: 1 };
    for (let i = 0; i < 15; i++) n = { label: "g", children: [n] };
    expect(() => DiagramInput.parse({ type: "treemap", root: n })).toThrow();
  });
});
