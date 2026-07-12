import { describe, it, expect, vi, afterEach } from "vitest";
import * as os from "node:os";
import * as path from "node:path";
import { sanitizeTitle, makeBaseFilename, resolveOutputDir, printBanner, VERSION } from "./server.js";

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

describe("printBanner", () => {
  const savedNoSave = process.env.GLYPHIC_NO_SAVE;
  const savedNoColor = process.env.NO_COLOR;

  afterEach(() => {
    // biome-ignore lint/performance/noDelete: assigning undefined to process.env coerces to the string "undefined"; delete is required to actually unset
    if (savedNoSave === undefined) delete process.env.GLYPHIC_NO_SAVE;
    else process.env.GLYPHIC_NO_SAVE = savedNoSave;
    // biome-ignore lint/performance/noDelete: same — must truly unset the env var
    if (savedNoColor === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = savedNoColor;
    vi.restoreAllMocks();
  });

  function captureBanner(): string {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    printBanner();
    return spy.mock.calls.map((call) => call.join(" ")).join("\n");
  }

  it("includes the version, docs and issues links", () => {
    const out = captureBanner();
    expect(out).toContain(`v${VERSION}`);
    expect(out).toContain("https://github.com/MS-Teja/Glyphic/blob/main/docs/mcp.md");
    expect(out).toContain("https://github.com/MS-Teja/Glyphic/issues");
  });

  it("emits no ANSI escapes when NO_COLOR is set", () => {
    process.env.NO_COLOR = "1";
    const out = captureBanner();
    expect(out).not.toContain("\u001b");
  });

  it("says saving is off when GLYPHIC_NO_SAVE=1", () => {
    process.env.GLYPHIC_NO_SAVE = "1";
    const out = captureBanner();
    expect(out).toContain("File saving is off");
    expect(out).not.toContain("Diagrams land in");
  });
});
