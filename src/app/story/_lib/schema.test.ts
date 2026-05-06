import { describe, expect, it } from "vitest";

import { storyFormSchema } from "@/app/story/_lib/schema";

const ID = "clyxkn59q0000lflhrxvj5g8j";

const baseIds = {
  characterId: ID,
  personaId: ID,
  promptId: ID,
};

describe("storyFormSchema — create mode", () => {
  it("accepts valid input without a name", () => {
    expect(
      storyFormSchema.safeParse({ ...baseIds, mode: "create" }).success,
    ).toBe(true);
  });

  it("accepts valid input with a name", () => {
    expect(
      storyFormSchema.safeParse({ ...baseIds, mode: "create", name: "My Story" }).success,
    ).toBe(true);
  });

  it("accepts optional lorebookId and worldId", () => {
    expect(
      storyFormSchema.safeParse({ ...baseIds, mode: "create", lorebookId: ID, worldId: ID }).success,
    ).toBe(true);
  });
});

describe("storyFormSchema — edit mode", () => {
  it("accepts valid input with a name", () => {
    expect(
      storyFormSchema.safeParse({ ...baseIds, mode: "edit", name: "Updated Story" }).success,
    ).toBe(true);
  });

  it("rejects missing name", () => {
    expect(
      storyFormSchema.safeParse({ ...baseIds, mode: "edit" }).success,
    ).toBe(false);
  });

  it("rejects empty name", () => {
    expect(
      storyFormSchema.safeParse({ ...baseIds, mode: "edit", name: "" }).success,
    ).toBe(false);
  });
});

describe("storyFormSchema — mode discrimination", () => {
  it("rejects an unknown mode", () => {
    expect(
      storyFormSchema.safeParse({ ...baseIds, mode: "delete" }).success,
    ).toBe(false);
  });
});
