import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/error";
import { parseError } from "@/lib/logger";

describe("parseError", () => {
  it("extracts message, name, and stack from a plain Error", () => {
    const err = new Error("oops");
    const result = parseError(err);
    expect(result.message).toBe("oops");
    expect(result.name).toBe("Error");
    expect(typeof result.stack).toBe("string");
  });

  it("includes code and statusCode for AppError", () => {
    const err = new AppError("bad request", "VALIDATION_ERROR", 400);
    const result = parseError(err);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(result.statusCode).toBe(400);
  });

  it("wraps non-Error values in a raw field", () => {
    expect(parseError("something bad")).toEqual({ raw: "something bad" });
    expect(parseError(42)).toEqual({ raw: "42" });
    expect(parseError(null)).toEqual({ raw: "null" });
  });
});
