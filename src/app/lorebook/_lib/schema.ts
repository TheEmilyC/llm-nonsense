import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";

export const LOREBOOK_CACHE_KEY = "lorebook";

// -- Base

const lorebookStatusSchema = z.enum([
  "READY",
  "SERVER_UNAVAILABLE",
  "UNAUTHORIZED",
  "ERROR",
  "NONE_SELECTED",
]);
export type LorebookStatus = z.infer<typeof lorebookStatusSchema>;

export const lorebookEntitySchema = z.object({
  apiKey: z.string().min(1),
  createdAt: z.date(),
  id: dbIdValidator,
  modifiedAt: z.date(),
  name: z.string().min(1),
  port: z.number(),
});

const obsidianLinkSchema = z.object({
  display: z.string(),
  embed: z.boolean(),
  path: z.string(),
  type: z.string(),
});
export type ObsidianLink = z.infer<typeof obsidianLinkSchema>;

export const lorebookIndexSchema = z.object({
  createdAt: z.date(),
  filename: z.string(),
  name: z.string(),
  order: z.number(),
  tags: z.string().array(),
});
export type LorebookIndex = z.infer<typeof lorebookIndexSchema>;

const obsidianLinkedTagSchema = z.union([z.string(), obsidianLinkSchema]);

const lorebookEntryIndexSchema = lorebookIndexSchema.extend({
  aliases: z.string().array(),
  characters: z.string().array(),
  summary: z.string(),
});
export type LorebookEntryIndex = z.infer<typeof lorebookEntryIndexSchema>;

const obsidianError = z.object({
  errorCode: z.number(),
  message: z.string(),
});

// -- Lorebook Schemas

export const lorebookFormSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  name: z.string().min(1, "Name is required"),
  port: z.number(),
});
export type LorebookFormValues = z.infer<typeof lorebookFormSchema>;

const lorebookUnavailableSchema = z.object({
  status: lorebookStatusSchema.extract([
    "SERVER_UNAVAILABLE",
    "UNAUTHORIZED",
    "NONE_SELECTED",
  ]),
});

const lorebookErrorSchema = z.object({
  error: obsidianError,
  status: lorebookStatusSchema.extract(["ERROR"]),
});

export const lorebookNotReadySchema = z.discriminatedUnion("status", [
  lorebookUnavailableSchema,
  lorebookErrorSchema,
]);
export type LorebookNotReady = z.infer<typeof lorebookNotReadySchema>;

const lorebookReadySchema = z.object({
  cast: lorebookEntryIndexSchema.optional(),
  constants: lorebookEntryIndexSchema.array(),
  context: lorebookIndexSchema.array(),
  entries: lorebookEntryIndexSchema.array(),
  id: dbIdValidator,
  memories: lorebookEntryIndexSchema.array(),
  name: z.string(),
  status: lorebookStatusSchema.extract(["READY"]),
});
export type LorebookReady = z.infer<typeof lorebookReadySchema>;

export const lorebookSchema = z.discriminatedUnion("status", [
  lorebookUnavailableSchema,
  lorebookErrorSchema,
  lorebookReadySchema,
]);
export type Lorebook = z.infer<typeof lorebookSchema>;

export const updateLorebookActionParamsSchema = z.object({
  id: dbIdValidator,
  update: lorebookFormSchema,
});
export type UpdateLorebookActionParams = z.infer<
  typeof updateLorebookActionParamsSchema
>;

export const getLorebookActionParamsSchema = z.object({
  id: dbIdValidator,
  isRetry: z.boolean().optional(),
});
export type GetLorebookActionParams = z.infer<
  typeof getLorebookActionParamsSchema
>;

export const generateMemoryArcActionParamsSchema = z.object({
  files: z.string().array(),
  id: dbIdValidator,
});
export type GenerateMemoryArcActionParams = z.infer<
  typeof generateMemoryArcActionParamsSchema
>;

export const lorebookFactSchema = z.object({
  claim: z.string(),
  confidence: z.enum(["explicit", "implied"]),
});
export type LorebookFact = z.infer<typeof lorebookFactSchema>;

// -- Obsidian schemas

const lorebookFrontmatterSchema = z.object({
  aliases: z.string().array().optional().nullable(),
  characters: obsidianLinkedTagSchema.array().optional().nullable(),
  keys: z.string().array().optional().nullable(),
  order: z.coerce.number().optional().nullable(),
  summary: z.string().optional().nullable(),
  tags: z.string().array(),
  title: z.string().optional(),
});

const lorebookIndexResult = lorebookFrontmatterSchema.extend({
  ctime: z.coerce.date(),
});

export const obsidianApiConnectionSchema = z.object({
  apiKey: z.string(),
  port: z.number(),
});
export type ObsidianApiConnection = z.infer<typeof obsidianApiConnectionSchema>;

export const obsidianIndexSchema = z.object({
  filename: z.string(),
  result: lorebookIndexResult,
});
export type ObsidianIndex = z.infer<typeof obsidianIndexSchema>;

export const getObsidianIndexResponseSchema = z.union([
  obsidianIndexSchema.array(),
  obsidianError,
]);
export type GetLorebookIndexResponse = z.infer<
  typeof getObsidianIndexResponseSchema
>;

export const obsidianFileSchema = z.object({
  content: z.string(),
  frontmatter: lorebookFrontmatterSchema,
  path: z.string(),
  stat: z.object({
    ctime: z.number(),
    mtime: z.number(),
    size: z.number(),
  }),
  tags: z.string().array(),
});
export type ObsidianFile = z.infer<typeof obsidianFileSchema>;

export const obsidianFileResponseSchema = z.union([
  obsidianFileSchema,
  obsidianError,
]);

// -- DTOs

export const lorebookEntityListDtoSchema = lorebookEntitySchema.pick({
  createdAt: true,
  id: true,
  name: true,
});
export type LorebookEntityListDto = z.infer<typeof lorebookEntityListDtoSchema>;

export const lorebookEntityDtoSchema = lorebookEntitySchema.pick({
  apiKey: true,
  id: true,
  name: true,
  port: true,
});
export type LorebookEntityDto = z.infer<typeof lorebookEntityDtoSchema>;

export const lorebookStatusDtoSchema = z.discriminatedUnion("status", [
  lorebookUnavailableSchema,
  lorebookErrorSchema,
  lorebookReadySchema.omit({ context: true }),
]);
export type LorebookStatusDto = z.infer<typeof lorebookStatusDtoSchema>;
