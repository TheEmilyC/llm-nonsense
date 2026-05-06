import { describe, expect, it } from "vitest";

import {
  AppError,
  LlmError,
  NotFoundError,
  ObsidianError,
  ValidationError,
} from "@/lib/error";

describe("AppError", () => {
  it("sets message, code, and default statusCode", () => {
    const err = new AppError("something broke", "INTERNAL_ERROR");
    expect(err.message).toBe("something broke");
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.statusCode).toBe(500);
  });

  it("accepts a custom statusCode", () => {
    const err = new AppError("gone", "NOT_FOUND", 404);
    expect(err.statusCode).toBe(404);
  });

  it("is an instance of Error", () => {
    expect(new AppError("msg", "INTERNAL_ERROR")).toBeInstanceOf(Error);
  });

  it("sets name to the class name", () => {
    expect(new AppError("msg", "INTERNAL_ERROR").name).toBe("AppError");
  });
});

describe("LlmError", () => {
  it("sets code to LLM_ERROR", () => {
    const err = new LlmError("llm failed");
    expect(err.code).toBe("LLM_ERROR");
  });

  it("is an instance of AppError", () => {
    expect(new LlmError("msg")).toBeInstanceOf(AppError);
  });
});

describe("NotFoundError", () => {
  it("formats message without id", () => {
    const err = new NotFoundError("Character");
    expect(err.message).toBe("Character not found");
  });

  it("formats message with id", () => {
    const err = new NotFoundError("Character", "42");
    expect(err.message).toBe("Character 42 not found");
  });

  it("sets code to NOT_FOUND and statusCode to 404", () => {
    const err = new NotFoundError("Item");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.statusCode).toBe(404);
  });
});

describe("ObsidianError", () => {
  it("sets code to OBSIDIAN_ERROR", () => {
    const err = new ObsidianError("vault error");
    expect(err.code).toBe("OBSIDIAN_ERROR");
  });

  it("accepts a custom statusCode", () => {
    const err = new ObsidianError("not found", 404);
    expect(err.statusCode).toBe(404);
  });
});

describe("ValidationError", () => {
  it("sets code to VALIDATION_ERROR and statusCode to 400", () => {
    const err = new ValidationError("invalid input");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.statusCode).toBe(400);
  });

  it("stores optional details", () => {
    const details = { name: ["required"] };
    const err = new ValidationError("invalid", details);
    expect(err.details).toEqual(details);
  });

  it("details is undefined when not provided", () => {
    expect(new ValidationError("msg").details).toBeUndefined();
  });
});
