import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";

export const LOREBOOK_CACHE_KEY = "lorebook";

// -- Base

const lorebookStatusSchema = z.enum([
  "READY",
  "SERVER_UNAVAILABLE",
  "UNAUTHORIZED",
  "ERRROR",
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

export const lorebookIndexSchema = z.object({
  filename: z.string(),
  name: z.string(),
  position: z.number(),
  tags: z.string().array(),
});
export type LorebookIndex = z.infer<typeof lorebookIndexSchema>;

const lorebookEntryIndexSchema = lorebookIndexSchema.extend({
  aliases: z.string().array().optional(),
  characters: z.string().array().optional(),
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
  status: lorebookStatusSchema.extract(["ERRROR"]),
});

export const lorebookNotReadySchema = z.discriminatedUnion("status", [
  lorebookUnavailableSchema,
  lorebookErrorSchema,
]);
export type LorebookNotReady = z.infer<typeof lorebookNotReadySchema>;

const lorebookReadySchema = z.object({
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

// -- Obsidian schemas

const lorebookFrontmatterSchema = z.object({
  aliases: z.string().array().optional().nullable(),
  characters: z.string().array().optional().nullable(),
  keys: z.string().array().optional().nullable(),
  position: z.number().optional().nullable(),
  summary: z.string().optional().nullable(),
  tags: z.string().array(),
  title: z.string().optional(),
});

export const obsidianApiConnectionSchema = z.object({
  apiKey: z.string(),
  port: z.number(),
});
export type ObsidianApiConnection = z.infer<typeof obsidianApiConnectionSchema>;

export const obsidianIndexSchema = z.object({
  filename: z.string(),
  result: lorebookFrontmatterSchema,
});
export type ObsidianIndex = z.infer<typeof obsidianIndexSchema>;

export const getObsidianIndexResposneSchema = z.union([
  obsidianIndexSchema.array(),
  obsidianError,
]);
export type GetLorebookIndexResposne = z.infer<
  typeof getObsidianIndexResposneSchema
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
