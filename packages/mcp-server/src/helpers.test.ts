import { describe, it, expect, vi, afterEach } from "vitest";
import * as os from "node:os";
import * as path from "node:path";
import { sanitizeTitle, makeBaseFilename, resolveOutputDir } from "./server.js";

describe("sanitizeTitle", () => {
  it("lowercases and replaces non-alphanumeric characters with underscores", () => {
    expect(sanitizeTitle("My Cool Diagram! #1")).toBe("my_cool_diagram___1");
  });

  it("falls back to 'diagram' when title is undefined", () => {
    expect(sanitizeTitle(undefined)).toBe("diagram");
  });

  it("falls back to 'diagram' when the sanitized result is empty or underscores-only", () => {
    expect(sanitizeTitle("!!!")).toBe("diagram");
    expect(sanitizeTitle("")).toBe("diagram");
    expect(sanitizeTitle("   ")).toBe("diagram");
  });
});

describe("makeBaseFilename", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("produces distinct filenames for the same title at the same frozen timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const a = makeBaseFilename("My Diagram");
    const b = makeBaseFilename("My Diagram");

    expect(a).not.toBe(b);
  });

  it("matches the expected filename shape", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const name = makeBaseFilename("My Diagram");
    expect(name).toMatch(/^[a-z0-9_]+_\d+_[0-9a-f]{6}$/);
  });
});

describe("resolveOutputDir", () => {
  it("defaults to ~/Desktop/Glyphic Diagrams when env is empty", () => {
    const result = resolveOutputDir({});
    expect(result).toBe(path.join(os.homedir(), "Desktop", "Glyphic Diagrams"));
  });

  it("uses GLYPHIC_OUTPUT_DIR when set and non-empty", () => {
    expect(resolveOutputDir({ GLYPHIC_OUTPUT_DIR: "/x" })).toBe("/x");
  });

  it("returns null when GLYPHIC_NO_SAVE is '1' or 'true'", () => {
    expect(resolveOutputDir({ GLYPHIC_NO_SAVE: "1" })).toBeNull();
    expect(resolveOutputDir({ GLYPHIC_NO_SAVE: "true" })).toBeNull();
  });

  it("falls back to default when GLYPHIC_NO_SAVE is '0'", () => {
    expect(resolveOutputDir({ GLYPHIC_NO_SAVE: "0" })).toBe(path.join(os.homedir(), "Desktop", "Glyphic Diagrams"));
  });

  it("GLYPHIC_NO_SAVE takes precedence over GLYPHIC_OUTPUT_DIR", () => {
    expect(resolveOutputDir({ GLYPHIC_NO_SAVE: "1", GLYPHIC_OUTPUT_DIR: "/x" })).toBeNull();
  });
});
