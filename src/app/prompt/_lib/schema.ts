import z from "zod";

import { dbIdValidator, messageRoleSchema } from "@/app/_shared/schema";

export const PROMPT_CACHE_KEY = "prompt";

// -- Base

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

const promptEntitySchema = z.object({
  createdAt: z.date(),
  id: dbIdValidator,
  maxOutputTokens: z.number().int().positive(),
  maxSteps: z.number().int().positive(),
  maxTokens: z.number(),
  modifiedAt: z.date(),
  name: z.string().min(1, "Name is required"),
  temperature: z.number().min(0).max(1),
  topK: z.number().int().positive(),
  topP: z.number().min(0).max(1),
});
export type PromptEntity = z.infer<typeof promptEntitySchema>;

const baseFragmentSchema = z.object({
  enabled: z.boolean(),
  id: dbIdValidator,
  name: z.string().min(1, "Name is required"),
  order: z.number(),
});

const promptSettingsFields = {
  maxOutputTokens: true,
  maxSteps: true,
  maxTokens: true,
  temperature: true,
  topK: true,
  topP: true,
} as const;

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

export const promptFragmentSchema = z.discriminatedUnion("type", [
  contentFragmentSchema,
  injectFragmentSchema,
  chatHistoryFragmentSchema,
]);
export type PromptFragment = z.infer<typeof promptFragmentSchema>;

export const promptWithFragmentsSchema = promptEntitySchema
  .pick({
    id: true,
    ...promptSettingsFields,
  })
  .extend({
    promptFragments: promptFragmentSchema.array(),
  });
export type PromptWithFragments = z.infer<typeof promptWithFragmentsSchema>;

// -- Schema

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

export const createPromptParamsSchema = promptEntitySchema
  .pick({
    name: true,
    ...promptSettingsFields,
  })
  .extend({
    promptFragments: promptFragmentCreateSchema.array(),
  });
export type CreatePromptParams = z.infer<typeof createPromptParamsSchema>;

export const updatePromptParamsSchema = promptEntitySchema
  .pick({ id: true })
  .extend({
    update: z.object({
      name: z.string().optional(),
      promptFragments: promptFragmentUpdateSchema.array(),
      ...promptEntitySchema.pick(promptSettingsFields).partial().shape,
    }),
  });
export type UpdatePromptParams = z.infer<typeof updatePromptParamsSchema>;

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

export const promptFormSchema = promptEntitySchema
  .pick({
    name: true,
    ...promptSettingsFields,
  })
  .extend({
    promptFragments: promptFragmentFormSchema.array(),
  });
export type PromptFormValues = z.infer<typeof promptFormSchema>;

export const updatePromptActionParamsSchema = promptEntitySchema
  .pick({
    id: true,
  })
  .extend({
    update: promptFormSchema,
  });
export type UpdatePromptActionParams = z.infer<
  typeof updatePromptActionParamsSchema
>;

// -- DTOs

export const promptDtoSchema = promptEntitySchema
  .pick({
    id: true,
    name: true,
    ...promptSettingsFields,
  })
  .extend({
    promptFragments: promptFragmentSchema.array(),
  });
export type PromptDto = z.infer<typeof promptDtoSchema>;

export const promptListItemDtoSchema = promptEntitySchema.pick({
  createdAt: true,
  id: true,
  name: true,
});
export type PromptListItemDto = z.infer<typeof promptListItemDtoSchema>;
