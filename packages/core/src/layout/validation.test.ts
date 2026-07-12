import { describe, it, expect } from "vitest";
import { closestId, unknownIdError } from "./validation.js";

describe("closestId", () => {
  it("suggests the nearest id for a small typo", () => {
    expect(closestId("webb", ["web", "api", "db"])).toBe("web");
    expect(closestId("apii", ["web", "api", "db"])).toBe("api");
  });

  it("prefers a case-insensitive exact match", () => {
    expect(closestId("WEB", ["web", "api"])).toBe("web");
  });

  it("returns undefined when nothing is close enough", () => {
    expect(closestId("totallydifferent", ["web", "api", "db"])).toBeUndefined();
  });

  it("returns undefined for an empty known set", () => {
    expect(closestId("web", [])).toBeUndefined();
  });
});

describe("unknownIdError", () => {
  it("includes the reference, a suggestion, and the known ids", () => {
    const err = unknownIdError({
      kind: "Edge",
      index: 2,
      field: "source",
      badId: "webb",
      knownIds: ["web", "api", "db"]
    });
    expect(err.message).toBe(
      'Edge #2 references unknown source node "webb". Did you mean "web"? Known node ids: "web", "api", "db".'
    );
  });

  it("omits the did-you-mean clause when nothing is close", () => {
    const err = unknownIdError({
      kind: "Link",
      index: 0,
      field: "target",
      badId: "zzzzz",
      knownIds: ["a", "b"]
    });
    expect(err.message).not.toContain("Did you mean");
    expect(err.message).toContain('Known node ids: "a", "b".');
  });

  it("uses the provided noun for participants", () => {
    const err = unknownIdError({
      kind: "Sequence message",
      index: 1,
      field: "source",
      badId: "ghost",
      knownIds: ["alice", "bob"],
      noun: "participant"
    });
    expect(err.message).toContain("unknown source participant");
    expect(err.message).toContain("Known participant ids:");
  });

  it("caps the known-id list and summarizes the overflow", () => {
    const many = Array.from({ length: 15 }, (_, i) => `n${i}`);
    const err = unknownIdError({
      kind: "Edge",
      index: 0,
      field: "source",
      badId: "missing",
      knownIds: many
    });
    expect(err.message).toContain("… and 5 more");
    // Only the first 10 ids are spelled out.
    expect(err.message).toContain('"n0"');
    expect(err.message).toContain('"n9"');
    expect(err.message).not.toContain('"n10"');
  });
});
