import z from "zod";

import { dbIdValidator } from "@/lib/validators";

export const LOREBOOK_CACHE_KEY = "lorebook";

// -- Base

export enum LorebookStatus {
  Ready = "ready",
  ServerUnavailable = "server-unavailable",
  Unauthorized = "unauthorized",
}

export const lorebookEntitySchema = z.object({
  apiKey: z.string().min(1),
  createdAt: z.date(),
  id: dbIdValidator,
  modifiedAt: z.date(),
  name: z.string().min(1),
  port: z.number(),
});

const lorebookIndexSchema = z.object({
  constant: z.boolean().optional(),
  filename: z.string(),
  keys: z.string().array(),
  name: z.string(),
  position: z.number(),
  summary: z.string(),
  tags: z.string().array(),
});

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
  status: z.union([
    z.literal(LorebookStatus.ServerUnavailable),
    z.literal(LorebookStatus.Unauthorized),
  ]),
});
const lorebookReadySchema = z.object({
  id: dbIdValidator,
  index: lorebookIndexSchema.array(),
  name: z.string(),
  status: z.literal(LorebookStatus.Ready),
});

export const lorebookSchema = z.discriminatedUnion("status", [
  lorebookUnavailableSchema,
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

export const obsidianApiConnectionSchema = z.object({
  apiKey: z.string(),
  port: z.number(),
});
export type ObsidianApiConnection = z.infer<typeof obsidianApiConnectionSchema>;

export const getObsidianIndexSuccessSchema = z
  .object({
    filename: z.string(),
    result: z.object({
      constant: z.string().optional().nullable(),
      keys: z.string().array().nullable(),
      position: z.number().optional().nullable(),
      summary: z.string().nullable(),
      tags: z.string().array(),
      title: z.string().nullable(),
    }),
  })
  .array();
export const getObsidianIndexResposneSchema = z.union([
  getObsidianIndexSuccessSchema,
  obsidianError,
]);
export type GetLorebookIndexResposne = z.infer<
  typeof getObsidianIndexResposneSchema
>;

export const obsidianFileSchema = z.object({
  content: z.string(),
  frontmatter: z.object({
    aliases: z.string().array().optional().nullable(),
    constant: z.string().optional().nullable(),
    keys: z.string().array().optional().nullable(),
    summary: z.string().optional().nullable(),
    title: z.string().optional(),
  }),
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

export const lorebookEntityDtoSchema = lorebookEntitySchema.pick({
  apiKey: true,
  id: true,
  name: true,
  port: true,
});
export type LorebookEntityDto = z.infer<typeof lorebookEntityDtoSchema>;

export const lorebookStatusDtoSchema = z.discriminatedUnion("status", [
  lorebookUnavailableSchema,
  lorebookReadySchema.omit({ index: true }),
]);
export type LorebookStatusDto = z.infer<typeof lorebookStatusDtoSchema>;
