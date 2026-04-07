import z from "zod";

import { dbIdValidator } from "@/lib/validators";

import { MessageRole, PromptInjectTag } from "../../../../generated/enums";

export const PROMPT_CACHE_KEY = "prompt";

export const promptFragmentDtoSchema = z
  .object({
    content: z.string().optional(),
    enabled: z.boolean(),
    id: dbIdValidator,
    injectTag: z.enum(PromptInjectTag).optional(),
    name: z.string().min(1, "Name is required"),
    order: z.number(),
    role: z.enum(MessageRole),
  })
  .refine((data) => data.content || data.injectTag, {
    message: "Either content or injectTag is required",
    path: ["content"],
  });
export type PromptFragmentDto = z.infer<typeof promptFragmentDtoSchema>;

export const promptDtoSchema = z.object({
  id: dbIdValidator,
  name: z.string().min(1, "Name is required"),
  promptFragments: promptFragmentDtoSchema.array(),
});
export type PromptDto = z.infer<typeof promptDtoSchema>;

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

export const promptFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});
export type PromptFormValues = z.infer<typeof promptFormSchema>;
