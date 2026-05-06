import { describe, expect, it } from "vitest";

import { personaFormSchema } from "@/app/persona/_lib/schema";

describe("personaFormSchema", () => {
  it("accepts valid input", () => {
    expect(
      personaFormSchema.safeParse({ name: "Aria", description: "A witty persona" }).success,
    ).toBe(true);
  });

  it("accepts empty description", () => {
    expect(
      personaFormSchema.safeParse({ name: "Aria", description: "" }).success,
    ).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      personaFormSchema.safeParse({ name: "", description: "desc" }).success,
    ).toBe(false);
  });

  it("rejects missing name", () => {
    expect(
      personaFormSchema.safeParse({ description: "desc" }).success,
    ).toBe(false);
  });
});
