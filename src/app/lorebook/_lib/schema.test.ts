import { describe, expect, it } from "vitest";

import {
  lorebookFactSchema,
  lorebookFormSchema,
  lorebookUpdateSuggestionSchema,
} from "@/app/lorebook/_lib/schema";

describe("lorebookFormSchema", () => {
  const valid = {
    apiKey: "secret",
    memoryLocation: null,
    name: "My Vault",
    port: 27124,
  };

  it("accepts valid input", () => {
    expect(lorebookFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty apiKey", () => {
    expect(lorebookFormSchema.safeParse({ ...valid, apiKey: "" }).success).toBe(
      false,
    );
  });

  it("rejects empty name", () => {
    expect(lorebookFormSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
  });

  it("rejects non-number port", () => {
    expect(
      lorebookFormSchema.safeParse({ ...valid, port: "27124" }).success,
    ).toBe(false);
  });
});

describe("lorebookFactSchema", () => {
  it("accepts explicit confidence", () => {
    expect(
      lorebookFactSchema.safeParse({
        claim: "She is a mage",
        confidence: "explicit",
      }).success,
    ).toBe(true);
  });

  it("accepts implied confidence", () => {
    expect(
      lorebookFactSchema.safeParse({
        claim: "She may be hiding something",
        confidence: "implied",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown confidence values", () => {
    expect(
      lorebookFactSchema.safeParse({
        claim: "Something",
        confidence: "unknown",
      }).success,
    ).toBe(false);
  });

  it("requires claim", () => {
    expect(
      lorebookFactSchema.safeParse({ confidence: "explicit" }).success,
    ).toBe(false);
  });
});

describe("lorebookUpdateSuggestionSchema", () => {
  it("accepts append variant", () => {
    expect(
      lorebookUpdateSuggestionSchema.safeParse({
        proposedContent: "New lore text",
        reasoning: "Because plot",
        sourceFactIndices: [0],
        updateType: "append",
      }).success,
    ).toBe(true);
  });

  it("accepts modify variant", () => {
    expect(
      lorebookUpdateSuggestionSchema.safeParse({
        currentContent: "old text",
        proposedContent: "new text",
        reasoning: "updated",
        sourceFactIndices: [1, 2],
        updateType: "modify",
      }).success,
    ).toBe(true);
  });

  it("accepts conflict variant", () => {
    expect(
      lorebookUpdateSuggestionSchema.safeParse({
        existingContent: "She is young",
        factDescription: "She is stated to be 300 years old",
        reasoning: "contradiction",
        sourceFactIndices: [0],
        updateType: "conflict",
      }).success,
    ).toBe(true);
  });

  it("accepts no_change variant", () => {
    expect(
      lorebookUpdateSuggestionSchema.safeParse({
        reasoning: "already accurate",
        sourceFactIndices: [],
        updateType: "no_change",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown updateType", () => {
    expect(
      lorebookUpdateSuggestionSchema.safeParse({
        reasoning: "nope",
        sourceFactIndices: [],
        updateType: "delete",
      }).success,
    ).toBe(false);
  });

  it("rejects append missing required proposedContent", () => {
    expect(
      lorebookUpdateSuggestionSchema.safeParse({
        reasoning: "missing content",
        sourceFactIndices: [],
        updateType: "append",
      }).success,
    ).toBe(false);
  });
});
