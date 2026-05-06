import { describe, expect, it } from "vitest";

import {
  buildCharacterImageUrl,
  buildPersonaImageUrl,
  buildWorldImageUrl,
  createImageHash,
} from "@/lib/image";

describe("buildCharacterImageUrl", () => {
  it("returns the correct URL format", () => {
    expect(buildCharacterImageUrl("abc", "hash123")).toBe(
      "/api/character/abc/image?v=hash123",
    );
  });

  it("includes both id and hash in the URL", () => {
    const url = buildCharacterImageUrl("char-99", "deadbeef");
    expect(url).toContain("char-99");
    expect(url).toContain("deadbeef");
  });
});

describe("buildPersonaImageUrl", () => {
  it("returns the correct URL format", () => {
    expect(buildPersonaImageUrl("p1", "abc123")).toBe(
      "/api/persona/p1/image?v=abc123",
    );
  });
});

describe("buildWorldImageUrl", () => {
  it("returns the correct URL format", () => {
    expect(buildWorldImageUrl("w42", "cafebabe")).toBe(
      "/api/world/w42/image?v=cafebabe",
    );
  });
});

describe("createImageHash", () => {
  it("returns an 8-character hex string", () => {
    const hash = createImageHash(Buffer.from("test data"));
    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic for the same input", () => {
    const buf = Buffer.from("same content");
    expect(createImageHash(buf)).toBe(createImageHash(buf));
  });

  it("produces different hashes for different inputs", () => {
    expect(createImageHash(Buffer.from("aaa"))).not.toBe(
      createImageHash(Buffer.from("bbb")),
    );
  });
});
