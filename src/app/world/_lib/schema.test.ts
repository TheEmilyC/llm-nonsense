import { describe, expect, it } from "vitest";

import { worldFormSchema } from "@/app/world/_lib/schema";

describe("worldFormSchema", () => {
  it("accepts valid input", () => {
    expect(
      worldFormSchema.safeParse({ name: "Aethoria", description: "A high-fantasy world" }).success,
    ).toBe(true);
  });

  it("accepts empty description", () => {
    expect(
      worldFormSchema.safeParse({ name: "Aethoria", description: "" }).success,
    ).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      worldFormSchema.safeParse({ name: "", description: "desc" }).success,
    ).toBe(false);
  });

  it("rejects missing name", () => {
    expect(
      worldFormSchema.safeParse({ description: "desc" }).success,
    ).toBe(false);
  });
});
