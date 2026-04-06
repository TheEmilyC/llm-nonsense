import z from "zod";

import { Story } from "../../../../generated/client";

export const STORY_CACHE_KEY = "story";

const baseSchema = z.object({
  characterId: z.string(),
  lorebookId: z.string().optional(),
  personaId: z.string(),
  worldId: z.string().optional(),
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
  characterId: z.string().min(1),
  id: z.string().min(1),
  lorebookId: z.string().optional(),
  name: z.string().min(1),
  personaId: z.string().min(1),
  worldId: z.string().optional(),
});
export type StoryDto = z.infer<typeof storyDtoSchema>;

export function toStoryDto(story: Story) {
  return storyDtoSchema.parse({
    ...story,
    lorebookId: story.lorebookId ?? undefined,
    worldId: story.worldId ?? undefined,
  });
}
