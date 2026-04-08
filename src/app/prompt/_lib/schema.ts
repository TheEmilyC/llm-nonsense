import z from "zod";

import { messageRoleSchema } from "@/app/_shared/schema";
import { dbIdValidator } from "@/lib/validators";

export const PROMPT_CACHE_KEY = "prompt";

export enum PromptFragmentType {
  chatHistory = "chatHistory",
  content = "content",
  inject = "inject",
}

export enum PromptInjectTag {
  characterDescription = "characterDescription",
  characterPersonality = "characterPersonality",
  characterScenario = "characterScenario",
  lastMessage = "lastMessage",
  lorebook = "lorebook",
  personaDescription = "personaDescription",
  worldDescription = "worldDescription",
}

const basePromptSchema = z.object({
  createdAt: z.date(),
  id: dbIdValidator,
  maxTokens: z.number(),
  modifiedAt: z.date(),
  name: z.string().min(1, "Name is required"),
});

const baseFragmentSchema = z.object({
  enabled: z.boolean(),
  id: dbIdValidator,
  name: z.string().min(1, "Name is required"),
  order: z.number(),
});

const contentFragmentSchema = baseFragmentSchema.extend({
  content: z.string().min(1),
  role: messageRoleSchema,
  type: z.literal(PromptFragmentType.content),
});

const injectFragmentSchema = baseFragmentSchema.extend({
  injectTag: z.enum(PromptInjectTag),
  role: messageRoleSchema,
  type: z.literal(PromptFragmentType.inject),
});

const chatHistoryFragmentSchema = baseFragmentSchema.extend({
  type: z.literal(PromptFragmentType.chatHistory),
});

export const promptFragmentDtoSchema = z.discriminatedUnion("type", [
  contentFragmentSchema,
  injectFragmentSchema,
  chatHistoryFragmentSchema,
]);
export type PromptFragmentDto = z.infer<typeof promptFragmentDtoSchema>;

export const promptFragmentCreateSchema = z.discriminatedUnion("type", [
  contentFragmentSchema.omit({ id: true }),
  injectFragmentSchema.omit({ id: true }),
  chatHistoryFragmentSchema.omit({ id: true }),
]);

export const promptFragmentUpdateSchema = z.discriminatedUnion("type", [
  contentFragmentSchema.extend({ id: dbIdValidator.optional() }),
  injectFragmentSchema.extend({ id: dbIdValidator.optional() }),
  chatHistoryFragmentSchema.extend({ id: dbIdValidator.optional() }),
]);

export const promptDtoSchema = basePromptSchema
  .pick({
    id: true,
    maxTokens: true,
    name: true,
  })
  .extend({
    promptFragments: promptFragmentDtoSchema.array(),
  });
export type PromptDto = z.infer<typeof promptDtoSchema>;

export const createPromptParamsSchema = basePromptSchema
  .pick({
    name: true,
  })
  .extend({
    promptFragments: promptFragmentCreateSchema.array(),
  });
export type CreatePromptParams = z.infer<typeof createPromptParamsSchema>;

export const updatePromptParamsSchema = basePromptSchema
  .pick({ id: true })
  .extend({
    update: z.object({
      name: z.string().optional(),
      promptFragments: promptFragmentUpdateSchema.array(),
    }),
  });
export type UpdatePromptParams = z.infer<typeof updatePromptParamsSchema>;

export const promptListItemDtoSchema = basePromptSchema.pick({
  createdAt: true,
  id: true,
  name: true,
});
export type PromptListItemDto = z.infer<typeof promptListItemDtoSchema>;

export const promptFragmentFormSchema = z.discriminatedUnion("type", [
  contentFragmentSchema
    .omit({ order: true })
    .extend({ id: dbIdValidator.optional() }),
  injectFragmentSchema
    .omit({ order: true })
    .extend({ id: dbIdValidator.optional() }),
  chatHistoryFragmentSchema
    .omit({ order: true })
    .extend({ id: dbIdValidator.optional() }),
]);
export type PromptFragmentFormValues = z.infer<typeof promptFragmentFormSchema>;

export const promptFormSchema = basePromptSchema
  .pick({
    maxTokens: true,
    name: true,
  })
  .extend({
    promptFragments: promptFragmentFormSchema.array(),
  });
export type PromptFormValues = z.infer<typeof promptFormSchema>;
