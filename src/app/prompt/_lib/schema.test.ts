import { describe, expect, it } from "vitest";

import {
  promptFormSchema,
  promptFragmentSchema,
  promptInjectTagSchema,
} from "@/app/prompt/_lib/schema";

describe("promptFormSchema numeric constraints", () => {
  const s = promptFormSchema.shape;

  it("accepts temperature at 0", () => {
    expect(s.temperature.safeParse(0).success).toBe(true);
  });

  it("accepts temperature at 1", () => {
    expect(s.temperature.safeParse(1).success).toBe(true);
  });

  it("rejects temperature above 1", () => {
    expect(s.temperature.safeParse(1.1).success).toBe(false);
  });

  it("rejects temperature below 0", () => {
    expect(s.temperature.safeParse(-0.1).success).toBe(false);
  });

  it("accepts topP in range", () => {
    expect(s.topP.safeParse(0.9).success).toBe(true);
  });

  it("rejects topP above 1", () => {
    expect(s.topP.safeParse(1.5).success).toBe(false);
  });

  it("accepts topK as positive integer", () => {
    expect(s.topK.safeParse(40).success).toBe(true);
  });

  it("rejects topK of 0", () => {
    expect(s.topK.safeParse(0).success).toBe(false);
  });

  it("rejects non-integer topK", () => {
    expect(s.topK.safeParse(1.5).success).toBe(false);
  });

  it("accepts maxOutputTokens of 0", () => {
    expect(s.maxOutputTokens.safeParse(0).success).toBe(true);
  });

  it("rejects negative maxOutputTokens", () => {
    expect(s.maxOutputTokens.safeParse(-1).success).toBe(false);
  });

  it("accepts maxSteps as positive integer", () => {
    expect(s.maxSteps.safeParse(5).success).toBe(true);
  });

  it("rejects maxSteps of 0", () => {
    expect(s.maxSteps.safeParse(0).success).toBe(false);
  });
});

describe("promptInjectTagSchema", () => {
  it.each([
    "CHARACTER_DESCRIPTION",
    "CHARACTER_PERSONALITY",
    "CHARACTER_SCENARIO",
    "LAST_MESSAGE",
    "LOREBOOK_MEMORIES",
    "LOREBOOK_CONTEXT",
    "LOREBOOK_ENTRIES",
    "LOREBOOK_CONSTANT",
    "PERSONA_DESCRIPTION",
    "WORLD_DESCRIPTION",
  ] as const)("accepts valid tag: %s", (tag) => {
    expect(promptInjectTagSchema.safeParse(tag).success).toBe(true);
  });

  it("rejects an unknown inject tag", () => {
    expect(promptInjectTagSchema.safeParse("UNKNOWN_TAG").success).toBe(false);
  });
});

describe("promptFragmentSchema", () => {
  const baseFields = {
    enabled: true,
    id: "clyxkn59q0000lflhrxvj5g8j",
    name: "My Fragment",
    order: 0,
  };

  it("accepts CHAT_HISTORY fragment", () => {
    const result = promptFragmentSchema.safeParse({
      ...baseFields,
      type: "CHAT_HISTORY",
    });
    expect(result.success).toBe(true);
  });

  it("accepts CONTENT fragment", () => {
    const result = promptFragmentSchema.safeParse({
      ...baseFields,
      content: "You are a helpful assistant.",
      role: "system",
      type: "CONTENT",
    });
    expect(result.success).toBe(true);
  });

  it("accepts INJECT fragment", () => {
    const result = promptFragmentSchema.safeParse({
      ...baseFields,
      injectTag: "CHARACTER_DESCRIPTION",
      role: "system",
      type: "INJECT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects CONTENT fragment with empty content", () => {
    const result = promptFragmentSchema.safeParse({
      ...baseFields,
      content: "",
      role: "system",
      type: "CONTENT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown fragment type", () => {
    const result = promptFragmentSchema.safeParse({
      ...baseFields,
      type: "UNKNOWN",
    });
    expect(result.success).toBe(false);
  });
});
