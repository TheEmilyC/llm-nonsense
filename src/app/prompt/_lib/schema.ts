import z from "zod";

import { dbIdValidator } from "@/lib/validators";

import { MessageRole } from "@/app/chat/_lib/schema";

export const PROMPT_CACHE_KEY = "prompt";

export enum PromptFragmentType {
  content = "content",
  inject = "inject",
}

export enum PromptInjectTag {
  lastMessage = "lastMessage",
  chatHistory = "chatHistory",
  characterName = "characterName",
  characterDescription = "characterDescription",
  characterPersonality = "characterPersonality",
  characterScenario = "characterScenario",
  personaName = "personaName",
  personaDescription = "personaDescription",
  worldName = "worldName",
  worldDescription = "worldDescription",
  lorebook = "lorebook",
}

const baseFragmentSchema = z.object({
  enabled: z.boolean(),
  id: dbIdValidator,
  name: z.string().min(1, "Name is required"),
  order: z.number(),
  role: z.enum(MessageRole),
});

const contentFragmentSchema = baseFragmentSchema.extend({
  content: z.string().min(1),
  type: z.literal(PromptFragmentType.content),
});

const injectFragmentSchema = baseFragmentSchema.extend({
  injectTag: z.enum(PromptInjectTag),
  type: z.literal(PromptFragmentType.inject),
});

export const promptFragmentDtoSchema = z.discriminatedUnion("type", [
  contentFragmentSchema,
  injectFragmentSchema,
]);
export type PromptFragmentDto = z.infer<typeof promptFragmentDtoSchema>;

export const promptFragmentCreateSchema = baseFragmentSchema
  .omit({
    id: true,
  })
  .extend({
    content: z.string().optional(),
    injectTag: z.enum(PromptInjectTag).optional(),
  });

export const promptFragmentUpdateSchema = baseFragmentSchema.extend({
  content: z.string().optional(),
  id: dbIdValidator.optional(),
  injectTag: z.enum(PromptInjectTag).optional(),
});

export const promptDtoSchema = z.object({
  id: dbIdValidator,
  name: z.string().min(1, "Name is required"),
  promptFragments: promptFragmentDtoSchema.array(),
});
export type PromptDto = z.infer<typeof promptDtoSchema>;

export const createPromptParamsSchema = promptDtoSchema
  .pick({
    name: true,
  })
  .extend({
    promptFragments: promptFragmentCreateSchema.array(),
  });
export type CreatePromptParams = z.infer<typeof createPromptParamsSchema>;

export const updatePromptParamsSchema = z.object({
  id: dbIdValidator,
  update: z.object({
    name: z.string().optional(),
    promptFragments: promptFragmentUpdateSchema.array(),
  }),
});
export type UpdatePromptParams = z.infer<typeof updatePromptParamsSchema>;

export const promptListItemDtoSchema = z.object({
  createdAt: z.date(),
  id: dbIdValidator,
  name: z.string().min(1),
});
export type PromptListItemDto = z.infer<typeof promptListItemDtoSchema>;

export const promptInspectorFormSchema = z.object({
  message: z.string().min(1),
});
export type PromptInspectorFormValues = z.infer<
  typeof promptInspectorFormSchema
>;

const baseFragmentFormSchema = baseFragmentSchema
  .omit({
    order: true,
  })
  .extend({
    id: z.string().optional(),
  });

export const promptFragmentFormSchema = z.discriminatedUnion("type", [
  baseFragmentFormSchema.extend({
    content: z.string().min(1),
    type: z.literal("content"),
  }),
  baseFragmentFormSchema.extend({
    injectTag: z.enum(PromptInjectTag),
    type: z.literal("inject"),
  }),
]);
export type PromptFragmentFormValues = z.infer<typeof promptFragmentFormSchema>;

export const promptFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  promptFragments: promptFragmentFormSchema.array(),
});
export type PromptFormValues = z.infer<typeof promptFormSchema>;
