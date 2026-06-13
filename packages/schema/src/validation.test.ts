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
