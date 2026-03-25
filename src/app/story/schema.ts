import z from "zod";
import { Story } from "../../../generated/client";

export const STORY_CACHE_KEY = "story";

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

export const storyDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  characterId: z.string().min(1),
  personaId: z.string().min(1),
  createdAt: z.date(),
  modifiedAt: z.date(),
});
export type StoryDto = z.infer<typeof storyDtoSchema>;

export function toStoryDto(story: Story) {
  return storyDtoSchema.parse(story);
}
