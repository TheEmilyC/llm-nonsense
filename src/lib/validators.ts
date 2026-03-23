import z from "zod";

export const idRequestSchema = z.object({
  id: z.string().min(1),
});
export type IdRequestSchema = z.infer<typeof idRequestSchema>;

export const dbIdValidator = z.cuid2();
