import { z } from "zod";
import { describe, expect, it } from "vitest";

import { AppError, LlmError, ObsidianError, ValidationError } from "@/lib/error";
import { toActionResponseError } from "@/lib/action-utils";

function makeZodError(): z.ZodError {
  const result = z
    .object({ name: z.string(), age: z.number() })
    .safeParse({ name: 42, age: "not-a-number" });
  if (!result.success) return result.error;
  throw new Error("expected parse to fail");
}

describe("toActionResponseError", () => {
  it("maps ZodError to VALIDATION_ERROR with field details", () => {
    const response = toActionResponseError(makeZodError());
    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.code).toBe("VALIDATION_ERROR");
      expect(response.error.message).toBe("Validation failed");
      expect(response.error.details).toHaveProperty("name");
      expect(response.error.details).toHaveProperty("age");
    }
  });

  it("maps ValidationError to VALIDATION_ERROR preserving details", () => {
    const details = { email: ["must be valid"] };
    const response = toActionResponseError(
      new ValidationError("invalid input", details),
    );
    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.code).toBe("VALIDATION_ERROR");
      expect(response.error.details).toEqual(details);
    }
  });

  it("maps AppError preserving its code and message", () => {
    const response = toActionResponseError(
      new AppError("not authorized", "INTERNAL_ERROR", 403),
    );
    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.code).toBe("INTERNAL_ERROR");
      expect(response.error.message).toBe("not authorized");
    }
  });

  it("maps LlmError to LLM_ERROR", () => {
    const response = toActionResponseError(new LlmError("model timeout"));
    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.code).toBe("LLM_ERROR");
    }
  });

  it("maps ObsidianError to OBSIDIAN_ERROR", () => {
    const response = toActionResponseError(new ObsidianError("vault offline"));
    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.code).toBe("OBSIDIAN_ERROR");
    }
  });

  it("maps unknown errors to INTERNAL_ERROR", () => {
    const response = toActionResponseError(new Error("generic"));
    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.code).toBe("INTERNAL_ERROR");
      expect(response.error.message).toBe("Something went wrong");
    }
  });

  it("maps non-Error throws to INTERNAL_ERROR", () => {
    const response = toActionResponseError("just a string");
    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.code).toBe("INTERNAL_ERROR");
    }
  });
});
