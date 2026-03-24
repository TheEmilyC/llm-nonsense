import z from "zod";

export const personaImageValidator = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), "Must be an image")
  .refine((file) => file.size <= 15 * 1024 * 1024, "Max file size is 15MB");

export const personaFormSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  image: personaImageValidator.optional(),
});
export type PersonaFormValues = z.infer<typeof personaFormSchema>;
