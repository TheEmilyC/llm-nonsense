import z from "zod";

import { dbIdValidator, messageRoleSchema } from "@/app/_shared/schema";

export const PROMPT_CACHE_KEY = "prompt";

// -- Base

export const promptFragmentTypeSchema = z.enum([
  "CHAT_HISTORY",
  "CONTENT",
  "INJECT",
]);
export type PromptFragmentType = z.infer<typeof promptFragmentTypeSchema>;

export const promptInjectTagSchema = z.enum([
  "CHARACTER_DESCRIPTION",
  "CHARACTER_PERSONALITY",
  "CHARACTER_SCENARIO",
  "LAST_MESSAGE",
  "LOREBOOK_MEMORIES",
  "LOREBOOK_CONTEXT",
  "LOREBOOK_ENTRIES",
  "LOREBOOK_CONSTANT",
  "PERSONA_DESCRIPTION",
  "WORLD_DESCRIPTION",
]);
export type PromptInjectTag = z.infer<typeof promptInjectTagSchema>;

export const promptRegexTargetSchema = z.enum(["USER", "ASSISTANT", "BOTH"]);
export type PromptRegexTarget = z.infer<typeof promptRegexTargetSchema>;

const promptEntitySchema = z.object({
  createdAt: z.date(),
  id: dbIdValidator,
  maxOutputTokens: z.number().int().min(0),
  maxSteps: z.number().int().positive(),
  maxTokens: z.number(),
  modifiedAt: z.date(),
  name: z.string().min(1, "Name is required"),
  prefetch: z.boolean(),
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

const promptRegexSchema = z.object({
  enabled: z.boolean(),
  id: dbIdValidator,
  isShared: z.boolean(),
  linkId: dbIdValidator,
  name: z.string().min(1, "Name is required"),
  order: z.number().positive(),
  pattern: z.string().min(1, "Pattern is required"),
  promptId: dbIdValidator,
  target: promptRegexTargetSchema,
});

const promptSettingsFields = {
  maxOutputTokens: true,
  maxSteps: true,
  maxTokens: true,
  prefetch: true,
  temperature: true,
  topK: true,
  topP: true,
} as const;

const contentFragmentSchema = baseFragmentSchema.extend({
  content: z.string().min(1),
  role: messageRoleSchema,
  type: promptFragmentTypeSchema.extract(["CONTENT"]),
});
export type ContentFragment = z.infer<typeof contentFragmentSchema>;

const injectFragmentSchema = baseFragmentSchema.extend({
  injectTag: promptInjectTagSchema,
  role: messageRoleSchema,
  type: promptFragmentTypeSchema.extract(["INJECT"]),
});
export type InjectFragment = z.infer<typeof injectFragmentSchema>;

const chatHistoryFragmentSchema = baseFragmentSchema.extend({
  type: promptFragmentTypeSchema.extract(["CHAT_HISTORY"]),
});
export type ChatHistoryFragment = z.infer<typeof chatHistoryFragmentSchema>;

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
    promptRegexes: promptRegexSchema.pick({ pattern: true, target: true }).array(),
  });
export type PromptWithFragments = z.infer<typeof promptWithFragmentsSchema>;

// -- Schema

export const promptFragmentCreateSchema = z.discriminatedUnion("type", [
  contentFragmentSchema.omit({ id: true, order: true }),
  injectFragmentSchema.omit({ id: true, order: true }),
  chatHistoryFragmentSchema.omit({ id: true, order: true }),
]);

export const promptFragmentUpdateSchema = z.discriminatedUnion("type", [
  contentFragmentSchema
    .extend({ id: dbIdValidator.optional() })
    .omit({ order: true }),
  injectFragmentSchema
    .extend({ id: dbIdValidator.optional() })
    .omit({ order: true }),
  chatHistoryFragmentSchema
    .extend({ id: dbIdValidator.optional() })
    .omit({ order: true }),
]);

export const promptRegexCreateSchema = promptRegexSchema.pick({
  enabled: true,
  isShared: true,
  name: true,
  pattern: true,
  target: true,
});
export type PromptRegexCreate = z.infer<typeof promptRegexCreateSchema>;

export const promptRegexUpdateSchema = promptRegexCreateSchema.extend({
  id: dbIdValidator.optional(),
});
export type PromptRegexUpdate = z.infer<typeof promptRegexUpdateSchema>;

export const createPromptParamsSchema = promptEntitySchema
  .pick({
    name: true,
    ...promptSettingsFields,
  })
  .extend({
    promptFragments: promptFragmentCreateSchema.array(),
    promptRegexes: promptRegexCreateSchema.array(),
  });
export type CreatePromptParams = z.infer<typeof createPromptParamsSchema>;

export const updatePromptParamsSchema = promptEntitySchema
  .pick({ id: true })
  .extend({
    update: z.object({
      name: z.string().optional(),
      promptFragments: promptFragmentUpdateSchema.array(),
      promptRegexes: promptRegexUpdateSchema.array(),
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
    promptRegexes: promptRegexSchema
      .pick({
        enabled: true,
        isShared: true,
        name: true,
        pattern: true,
        target: true,
      })
      .extend({ id: dbIdValidator.optional() })
      .array(),
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
    promptRegexes: promptRegexSchema.array(),
  });
export type PromptDto = z.infer<typeof promptDtoSchema>;

export const promptListItemDtoSchema = promptEntitySchema.pick({
  createdAt: true,
  id: true,
  name: true,
});
export type PromptListItemDto = z.infer<typeof promptListItemDtoSchema>;
