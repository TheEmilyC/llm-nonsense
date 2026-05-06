import { describe, expect, it } from "vitest";

import { messageRoleSchema } from "@/app/_shared/schema";

describe("messageRoleSchema", () => {
  it.each(["assistant", "system", "user"] as const)(
    "accepts valid role: %s",
    (role) => {
      expect(messageRoleSchema.parse(role)).toBe(role);
    },
  );

  it("rejects an invalid role", () => {
    expect(messageRoleSchema.safeParse("admin").success).toBe(false);
    expect(messageRoleSchema.safeParse("").success).toBe(false);
  });
});
