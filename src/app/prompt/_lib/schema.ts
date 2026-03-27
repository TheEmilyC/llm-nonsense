import z from "zod";

export const promptInspectorFormSchema = z.object({
  message: z.string().min(1),
});
export type PromptInspectorFormValues = z.infer<
  typeof promptInspectorFormSchema
>;
