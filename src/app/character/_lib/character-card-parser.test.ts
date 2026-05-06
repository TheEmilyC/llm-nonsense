import { describe, expect, it } from "vitest";

import {
  getCacheKey,
  readCharacterFromBuffer,
  writeCharacterToBuffer,
} from "@/app/character/_lib/character-card-parser";

// Minimal valid 1×1 grayscale PNG
const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==",
  "base64",
);

describe("getCacheKey", () => {
  it("strips the .png extension", () => {
    expect(getCacheKey("characters/alice.png")).toBe("characters/alice");
  });

  it("leaves paths without .png unchanged", () => {
    expect(getCacheKey("characters/alice")).toBe("characters/alice");
  });
});

describe("writeCharacterToBuffer / readCharacterFromBuffer round-trip", () => {
  it("writes and reads back character data", () => {
    const data = JSON.stringify({ name: "Elara", description: "A mage" });
    const encoded = writeCharacterToBuffer(MINIMAL_PNG, data);
    const result = readCharacterFromBuffer(encoded);
    // writeCharacterToBuffer also injects spec/spec_version for CCv3; check originals survive
    expect(JSON.parse(result)).toMatchObject({ name: "Elara", description: "A mage" });
  });

  it("overwrites existing character chunks on re-encode", () => {
    const first = JSON.stringify({ name: "Elara" });
    const second = JSON.stringify({ name: "Kira" });
    const once = writeCharacterToBuffer(MINIMAL_PNG, first);
    const twice = writeCharacterToBuffer(once, second);
    const result = readCharacterFromBuffer(twice);
    expect(JSON.parse(result).name).toBe("Kira");
  });

  it("throws when no metadata is present", () => {
    expect(() => readCharacterFromBuffer(MINIMAL_PNG)).toThrow("No PNG metadata");
  });
});
