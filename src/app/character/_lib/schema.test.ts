import { describe, expect, it } from "vitest";

import { characterCardSchema, characterFormSchema } from "@/app/character/_lib/schema";

describe("characterFormSchema", () => {
  const valid = {
    name: "Elara",
    description: "A powerful mage",
    first_mes: "Hello traveller.",
    mes_example: "",
    personality: "Curious",
    scenario: "A tavern encounter",
    tags: ["fantasy", "mage"],
  };

  it("accepts valid input", () => {
    expect(characterFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(characterFormSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects missing name", () => {
    const { name: _, ...rest } = valid;
    expect(characterFormSchema.safeParse(rest).success).toBe(false);
  });

  it("accepts empty strings for non-name fields", () => {
    expect(
      characterFormSchema.safeParse({ ...valid, description: "", personality: "" }).success,
    ).toBe(true);
  });

  it("accepts an empty tags array", () => {
    expect(characterFormSchema.safeParse({ ...valid, tags: [] }).success).toBe(true);
  });

  it("rejects non-array tags", () => {
    expect(characterFormSchema.safeParse({ ...valid, tags: "fantasy" }).success).toBe(false);
  });
});

describe("characterCardSchema", () => {
  const validCard = {
    avatar: "none",
    chat: "",
    create_date: "2024-01-01T00:00:00Z",
    creatorcomment: "",
    description: "A mage",
    fav: false,
    first_mes: "Hello",
    mes_example: "",
    name: "Elara",
    personality: "Curious",
    scenario: "",
    spec: "chara_card_v2",
    spec_version: "2.0",
    tags: [],
    talkativeness: "0.5",
  };

  it("accepts valid card data", () => {
    expect(characterCardSchema.safeParse(validCard).success).toBe(true);
  });

  it("coerces create_date string to a Date", () => {
    const result = characterCardSchema.safeParse(validCard);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.create_date).toBeInstanceOf(Date);
    }
  });

  it("rejects empty name", () => {
    expect(characterCardSchema.safeParse({ ...validCard, name: "" }).success).toBe(false);
  });

  it("accepts extra fields (looseObject)", () => {
    expect(
      characterCardSchema.safeParse({ ...validCard, custom_field: "extra" }).success,
    ).toBe(true);
  });
});
