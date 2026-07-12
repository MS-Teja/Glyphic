import { describe, it, expect, vi } from "vitest";
import { escapeXml, escapeCssString, isHttpsUrl, sanitizeSvg } from "./sanitize.js";
import { processDiagram } from "../pipeline.js";

vi.mock("@resvg/resvg-js", () => ({
  Resvg: class {
    render() {
      return { asPng: () => Buffer.from("mockpng") };
    }
  }
}));

describe("sanitize helpers", () => {
  it("escapeXml neutralizes markup characters", () => {
    expect(escapeXml(`<script>"&'`)).toBe("&lt;script&gt;&quot;&amp;&apos;");
  });

  it("escapeCssString escapes string-breaking characters", () => {
    const out = escapeCssString(`'); }`);
    expect(out).not.toContain("'");
    expect(out).not.toContain(")");
  });

  it("isHttpsUrl accepts only https URLs", () => {
    expect(isHttpsUrl("https://fonts.gstatic.com/x.ttf")).toBe(true);
    expect(isHttpsUrl("http://evil.example/x.ttf")).toBe(false);
    expect(isHttpsUrl("file:///etc/passwd")).toBe(false);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpsUrl("not a url")).toBe(false);
  });

  it("sanitizeSvg strips active content", () => {
    const dirty = `<g><script>alert(1)</script><rect onload="alert(2)" x="0"/><a href="javascript:alert(3)">x</a></g>`;
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain("<script");
    expect(clean.toLowerCase()).not.toContain("onload");
    expect(clean).not.toContain("javascript:");
  });

  it("sanitizeSvg strips slash-separated event handlers", () => {
    const clean = sanitizeSvg(`<svg/onload=alert(1)><circle/onclick='x()'/></svg>`).toLowerCase();
    expect(clean).not.toContain("onload");
    expect(clean).not.toContain("onclick");
  });

  it("sanitizeSvg neutralizes external and data href, keeps local fragment refs", () => {
    const clean = sanitizeSvg(
      `<use href="https://evil.example/x"/><image xlink:href="data:image/svg+xml,foo"/><use href="#icon-a"/>`,
    );
    expect(clean).not.toContain("evil.example");
    expect(clean).not.toContain("data:image");
    expect(clean).toContain('href="#icon-a"'); // legitimate internal ref preserved
  });
});

describe("processDiagram output is injection-safe", () => {
  it("escapes malicious node labels", async () => {
    const result = await processDiagram({
      type: "flowchart",
      nodes: [{ id: "a", label: "</text><script>alert(1)</script>" }],
      edges: []
    });
    expect(result.svg).not.toContain("<script>");
  });

  it("sanitizes canvas raw-svg markup", async () => {
    const result = await processDiagram({
      type: "canvas",
      width: 200,
      height: 200,
      elements: [
        {
          type: "raw-svg",
          svg: `<script>alert(1)</script><rect x="0" y="0" width="10" height="10"/>`,
          x: 0,
          y: 0
        }
      ]
    });
    expect(result.svg).not.toContain("<script>");
  });

  it("sanitizes theme.customIcons markup", async () => {
    const result = await processDiagram({
      type: "flowchart",
      theme: { customIcons: { evil: "<script>alert(1)</script>" } },
      nodes: [{ id: "a", label: "A", icon: "evil" }],
      edges: []
    } as any);
    expect(result.svg).not.toContain("<script>");
  });

  it("rejects non-https customFontUrl at the schema boundary", async () => {
    await expect(
      processDiagram({
        type: "flowchart",
        theme: { customFontUrl: "file:///etc/passwd" },
        nodes: [{ id: "a", label: "A" }],
        edges: []
      } as any)
    ).rejects.toThrow();
  });
});
