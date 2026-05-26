import { describe, expect, it } from "vitest";

import { personaFormSchema } from "@/app/persona/_lib/schema";
import {
  MAX_AVATAR_IMAGE_SIZE,
  MAX_AVATAR_IMAGE_SIZE_MB,
} from "@/lib/constants";

function makeFile(type: string, size = 1024): File {
  const file = new File([], "test", { type });
  Object.defineProperty(file, "size", { configurable: true, value: size });
  return file;
}

const base = { description: "desc", name: "Aria" };

describe("personaImageValidator (via personaFormSchema)", () => {
  it("accepts any image/* MIME type", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
      const result = personaFormSchema.safeParse({ ...base, image: makeFile(type) });
      expect(result.success, `expected ${type} to be accepted`).toBe(true);
    }
  });

  it("rejects a non-image MIME type", () => {
    const result = personaFormSchema.safeParse({
      ...base,
      image: makeFile("application/pdf"),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be an image");
    }
  });

  it("rejects a file exceeding the size limit", () => {
    const result = personaFormSchema.safeParse({
      ...base,
      image: makeFile("image/png", MAX_AVATAR_IMAGE_SIZE + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        `Max file size is ${MAX_AVATAR_IMAGE_SIZE_MB}MB`,
      );
    }
  });

  it("accepts a file exactly at the size limit", () => {
    const result = personaFormSchema.safeParse({
      ...base,
      image: makeFile("image/png", MAX_AVATAR_IMAGE_SIZE),
    });
    expect(result.success).toBe(true);
  });

  it("accepts when image is omitted (field is optional)", () => {
    expect(personaFormSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a non-File value", () => {
    expect(
      personaFormSchema.safeParse({ ...base, image: "not-a-file" }).success,
    ).toBe(false);
  });
});

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
