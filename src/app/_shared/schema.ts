import z from "zod";

export const messageRoleSchema = z.enum(["assistant", "system", "user"]);
export type MessageRole = z.infer<typeof messageRoleSchema>;

