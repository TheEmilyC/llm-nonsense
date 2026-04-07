import z from "zod";

import { dbIdValidator } from "@/lib/validators";

export const STORY_CACHE_KEY = "story";

const baseStorySchema = z.object({
  characterId: dbIdValidator,
  createdAt: z.date(),
  id: dbIdValidator,
  lorebookId: dbIdValidator.optional(),
  modifiedAt: z.date(),
  name: z.string().min(1),
  personaId: dbIdValidator,
  promptId: dbIdValidator,
  worldId: dbIdValidator.optional(),
});

export const storyDtoSchema = baseStorySchema.pick({
  characterId: true,
  id: true,
  lorebookId: true,
  name: true,
  personaId: true,
  promptId: true,
  worldId: true,
});
export type StoryDto = z.infer<typeof storyDtoSchema>;

export const createStoryParamsSchema = baseStorySchema.pick({
  characterId: true,
  lorebookId: true,
  name: true,
  personaId: true,
  promptId: true,
  worldId: true,
});
export type CreateStoryParams = z.infer<typeof createStoryParamsSchema>;

export const updateStoryParamsSchema = z.object({
  id: dbIdValidator,
  update: baseStorySchema
    .pick({
      characterId: true,
      lorebookId: true,
      name: true,
      personaId: true,
      promptId: true,
      worldId: true,
    })
    .partial(),
});
export type UpdateStoryParams = z.infer<typeof updateStoryParamsSchema>;

export const storyListItemDtoSchema = baseStorySchema.pick({
  id: true,
  name: true,
});
export type StoryListItemDto = z.infer<typeof storyListItemDtoSchema>;

const formBaseSchema = baseStorySchema.pick({
  characterId: true,
  lorebookId: true,
  personaId: true,
  promptId: true,
  worldId: true,
});

export const storyFormSchema = z.discriminatedUnion("mode", [
  formBaseSchema.extend({
    mode: z.literal("create"),
    name: z.string().optional(),
  }),
  formBaseSchema.extend({
    mode: z.literal("edit"),
    name: z.string().min(1),
  }),
]);
export type StoryFormValues = z.infer<typeof storyFormSchema>;
