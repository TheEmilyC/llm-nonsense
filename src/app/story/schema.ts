import z from "zod";

const baseSchema = z.object({
  characterId: z.string(),
  personaId: z.string(),
  worldId: z.string().optional(),
  assignedLorebook: z.string().optional(),
});

export const storyFormSchema = z.discriminatedUnion("mode", [
  baseSchema.extend({
    mode: z.literal("create"),
    name: z.string().optional(),
  }),
  baseSchema.extend({
    mode: z.literal("edit"),
    name: z.string().min(1),
  }),
]);
export type StoryFormValues = z.infer<typeof storyFormSchema>;
