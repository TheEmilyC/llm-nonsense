import { describe, expect, it } from "vitest";

import { chatModelKeySchema } from "@/app/chat/_lib/schema";

describe("chatModelKeySchema", () => {
  it.each(["deepseek", "gemini", "glm", "opus4_8"] as const)(
    "accepts valid model key: %s",
    (key) => {
      expect(chatModelKeySchema.safeParse(key).success).toBe(true);
    },
  );

  it("rejects an unknown model key", () => {
    expect(chatModelKeySchema.safeParse("gpt-4").success).toBe(false);
    expect(chatModelKeySchema.safeParse("").success).toBe(false);
  });
});
