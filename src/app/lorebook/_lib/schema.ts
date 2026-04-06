import z from "zod";

import { dbIdValidator } from "@/lib/validators";

import { Lorebook as LorebookEntity } from "../../../../generated/client";

export const LOREBOOK_CACHE_KEY = "lorebook";

export const lorebookFormSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  name: z.string().min(1, "Name is required"),
  port: z.number(),
});
export type LorebookFormValues = z.infer<typeof lorebookFormSchema>;

export const lorebookEntityDtoSchema = z.object({
  apiKey: z.string().min(1),
  id: z.string().min(1),
  name: z.string().min(1),
  port: z.number(),
});
export enum LorebookStatus {
  Ready = "ready",
  ServerUnavailable = "server-unavailable",
  Unauthorized = "unauthorized",
}

export type LorebookEntityDto = z.infer<typeof lorebookEntityDtoSchema>;

export function toLorebookEntityDto(
  lorebook: LorebookEntity,
): LorebookEntityDto {
  return lorebookEntityDtoSchema.parse(lorebook);
}

const lorebookIndexSchema = z.object({
  constant: z.boolean().optional(),
  filename: z.string(),
  keys: z.string().array(),
  name: z.string(),
  position: z.number(),
  summary: z.string(),
  tags: z.string().array(),
});

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

export const lorebookDtoSchema = z.discriminatedUnion("status", [
  lorebookUnavailableSchema,
  lorebookReadySchema.omit({ index: true }),
]);

export type LorebookDto = z.infer<typeof lorebookDtoSchema>;

export function toLorebookDto(lorebook: Lorebook): LorebookDto {
  return lorebookDtoSchema.parse(lorebook);
}

export const obsidianApiConnection = z.object({
  apiKey: z.string(),
  port: z.number(),
});
export type ObsidianApiConnection = z.infer<typeof obsidianApiConnection>;

const obsidianError = z.object({
  errorCode: z.number(),
  message: z.string(),
});

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
