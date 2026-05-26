import { describe, expect, it } from "vitest";

import {
  characterCardSchema,
  characterFormSchema,
  importFromPngFormSchema,
} from "@/app/character/_lib/schema";
import {
  MAX_AVATAR_IMAGE_SIZE,
  MAX_AVATAR_IMAGE_SIZE_MB,
} from "@/lib/constants";

describe("characterFormSchema", () => {
  const valid = {
    description: "A powerful mage",
    first_mes: "Hello traveller.",
    mes_example: "",
    name: "Elara",
    personality: "Curious",
    scenario: "A tavern encounter",
    tags: ["fantasy", "mage"],
  };

  it("accepts valid input", () => {
    expect(characterFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(characterFormSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
  });

  it("rejects missing name", () => {
    const { name: _, ...rest } = valid;
    expect(characterFormSchema.safeParse(rest).success).toBe(false);
  });

  it("accepts empty strings for non-name fields", () => {
    expect(
      characterFormSchema.safeParse({
        ...valid,
        description: "",
        personality: "",
      }).success,
    ).toBe(true);
  });

  it("accepts an empty tags array", () => {
    expect(characterFormSchema.safeParse({ ...valid, tags: [] }).success).toBe(
      true,
    );
  });

  it("rejects non-array tags", () => {
    expect(
      characterFormSchema.safeParse({ ...valid, tags: "fantasy" }).success,
    ).toBe(false);
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
    expect(
      characterCardSchema.safeParse({ ...validCard, name: "" }).success,
    ).toBe(false);
  });

  it("accepts extra fields (looseObject)", () => {
    expect(
      characterCardSchema.safeParse({ ...validCard, custom_field: "extra" })
        .success,
    ).toBe(true);
  });
});

describe("characterImageValidator (via importFromPngFormSchema)", () => {
  function makeFile(name: string, type: string, size = 1024): File {
    const file = new File([], name, { type });
    Object.defineProperty(file, "size", { configurable: true, value: size });
    return file;
  }

  it("accepts a valid PNG under the size limit", () => {
    const file = makeFile("avatar.png", "image/png");
    expect(importFromPngFormSchema.safeParse({ png: file }).success).toBe(true);
  });

  it("rejects a non-PNG MIME type", () => {
    const file = makeFile("avatar.jpg", "image/jpeg");
    const result = importFromPngFormSchema.safeParse({ png: file });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Only PNGs are supported.");
    }
  });

  it("rejects a file exceeding the size limit", () => {
    const file = makeFile("big.png", "image/png", MAX_AVATAR_IMAGE_SIZE + 1);
    const result = importFromPngFormSchema.safeParse({ png: file });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        `Max file size is ${MAX_AVATAR_IMAGE_SIZE_MB}MB`,
      );
    }
  });

  it("accepts a file exactly at the size limit", () => {
    const file = makeFile("edge.png", "image/png", MAX_AVATAR_IMAGE_SIZE);
    expect(importFromPngFormSchema.safeParse({ png: file }).success).toBe(true);
  });

  it("rejects a non-File value", () => {
    expect(
      importFromPngFormSchema.safeParse({ png: "not-a-file" }).success,
    ).toBe(false);
  });
});
