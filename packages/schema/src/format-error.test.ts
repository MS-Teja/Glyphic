import { describe, it, expect } from "vitest";
import { z } from "zod";
import { DiagramInput } from "./diagram.js";
import { formatValidationError } from "./format-error.js";

/** Parse something invalid and hand back the resulting ZodError. */
function errorFor(input: unknown): z.ZodError {
  const result = DiagramInput.safeParse(input);
  if (result.success) throw new Error("expected the input to fail validation");
  return result.error;
}

describe("formatValidationError", () => {
  it("starts with the exact header phrase consumers match on", () => {
    const out = formatValidationError(errorFor({ type: "nope" }));
    expect(out.startsWith("Invalid diagram input:")).toBe(true);
  });

  it("collapses the root discriminator into the list of valid types", () => {
    const out = formatValidationError(errorFor({ type: "nope" }));
    expect(out).toContain("- type: must be one of:");
    expect(out).toContain("flowchart");
    expect(out).toContain("sequence");
    // The count is derived from the schema's variants, not hardcoded (the
    // discriminated union has 18 `type` values — flowchart and architecture
    // are distinct discriminators that share the NodeEdgeDiagram shape).
    expect(out).toMatch(/\(18 types\)/);
    // No raw Zod "Invalid discriminator value" wall.
    expect(out).not.toContain("Invalid discriminator value");
  });

  it("spells out missing required fields with the expected type", () => {
    const out = formatValidationError(errorFor({ type: "flowchart" }));
    expect(out).toContain("- nodes: required (expected array)");
  });

  it("reports nested paths in dot notation", () => {
    const out = formatValidationError(
      errorFor({ type: "flowchart", nodes: [{ id: "a" }], edges: [] })
    );
    // nodes[0].label is required.
    expect(out).toMatch(/- nodes\.0\.label: required \(expected string\)/);
  });

  it("de-duplicates issues with identical path and message", () => {
    const error = new z.ZodError([
      { code: "custom", path: ["a", "b"], message: "boom" },
      { code: "custom", path: ["a", "b"], message: "boom" },
      { code: "custom", path: ["a", "b"], message: "boom" },
    ] as z.ZodIssue[]);
    const out = formatValidationError(error, { tip: false });
    const occurrences = out.split("\n").filter((l) => l.includes("a.b: boom"));
    expect(occurrences).toHaveLength(1);
  });

  it("caps the bullets and summarizes the rest in an overflow line", () => {
    const issues = Array.from({ length: 20 }, (_, i) => ({
      code: "custom" as const,
      path: [`field${i}`],
      message: "bad",
    }));
    const out = formatValidationError(new z.ZodError(issues as z.ZodIssue[]), {
      tip: false,
    });
    const bulletCount = out.split("\n").filter((l) => l.startsWith("- ")).length;
    expect(bulletCount).toBe(12);
    expect(out).toContain("…and 8 more issue(s)");
  });

  it("uses (root) for issues without a path", () => {
    const error = new z.ZodError([
      { code: "custom", path: [], message: "whole payload is wrong" },
    ] as z.ZodIssue[]);
    const out = formatValidationError(error, { tip: false });
    expect(out).toContain("- (root): whole payload is wrong");
  });

  it("defaults to a docs-pointer tip", () => {
    const out = formatValidationError(errorFor({ type: "nope" }));
    expect(out).toContain("docs/diagram-types.md");
  });

  it("honors a custom tip", () => {
    const out = formatValidationError(errorFor({ type: "nope" }), {
      tip: "Call the get_schema tool for the full DiagramInput contract.",
    });
    expect(out).toContain("Call the get_schema tool for the full DiagramInput contract.");
    expect(out).not.toContain("docs/diagram-types.md");
  });

  it("omits the tip entirely when disabled", () => {
    const out = formatValidationError(errorFor({ type: "nope" }), { tip: false });
    expect(out).not.toContain("Tip:");
    expect(out).not.toContain("docs/diagram-types.md");
  });

  it("mentions stray keys will be ignored for unrecognized_keys", () => {
    const error = new z.ZodError([
      {
        code: "unrecognized_keys",
        keys: ["foo", "bar"],
        path: [],
        message: "Unrecognized key(s) in object: 'foo', 'bar'",
      },
    ] as z.ZodIssue[]);
    const out = formatValidationError(error, { tip: false });
    expect(out).toContain('unexpected key(s) "foo", "bar" will be ignored');
  });
});
