import z from "zod";

export const dbIdValidator = z.cuid2();

export const messageRoleSchema = z.enum(["assistant", "system", "user"]);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const entityProfileSchema = z.object({
  id: dbIdValidator,
  imageSrc: z.string().min(1, "Image source is required"),
  name: z.string().min(1, "Name is required"),
});
export type EntityProfile = z.infer<typeof entityProfileSchema>;
