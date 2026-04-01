import { dbIdValidator } from "@/lib/validators";
import z from "zod";
import { Lorebook as LorebookEntity } from "../../../../generated/client";

export const LOREBOOK_CACHE_KEY = "lorebook";

export const lorebookFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  port: z.number(),
  apiKey: z.string().min(1, "API key is required"),
});
export type LorebookFormValues = z.infer<typeof lorebookFormSchema>;

export const lorebookEntityDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  apiKey: z.string().min(1),
  port: z.number(),
});
export type LorebookEntityDto = z.infer<typeof lorebookEntityDtoSchema>;

export function toLorebookEntityDto(
  lorebook: LorebookEntity,
): LorebookEntityDto {
  return lorebookEntityDtoSchema.parse(lorebook);
}

export enum LorebookStatus {
  ServerUnavailable = "server-unavailable",
  Ready = "ready",
  Unauthorized = "unauthorized",
}

const lorebookIndexSchema = z.object({
  filename: z.string(),
  name: z.string(),
  summary: z.string(),
  tags: z.string().array(),
  keys: z.string().array(),
  constant: z.boolean().optional(),
  position: z.number(),
});

const lorebookUnavailableSchema = z.object({
  status: z.union([
    z.literal(LorebookStatus.ServerUnavailable),
    z.literal(LorebookStatus.Unauthorized),
  ]),
});
const lorebookReadySchema = z.object({
  status: z.literal(LorebookStatus.Ready),
  id: dbIdValidator,
  name: z.string(),
  index: lorebookIndexSchema.array(),
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
  port: z.number(),
  apiKey: z.string(),
});
export type ObsidianApiConnection = z.infer<typeof obsidianApiConnection>;

const obsidianError = z.object({
  message: z.string(),
  errorCode: z.number(),
});

export const getObsidianIndexSuccessSchema = z
  .object({
    filename: z.string(),
    result: z.object({
      title: z.string().nullable(),
      tags: z.string().array(),
      keys: z.string().array().nullable(),
      summary: z.string().nullable(),
      constant: z.string().optional().nullable(),
      position: z.number().optional().nullable(),
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
  tags: z.string().array(),
  frontmatter: z.object({
    title: z.string().optional(),
    aliases: z.string().array().optional().nullable(),
    keys: z.string().array().optional().nullable(),
    summary: z.string().optional().nullable(),
    constant: z.string().optional().nullable(),
  }),
  stat: z.object({
    ctime: z.number(),
    mtime: z.number(),
    size: z.number(),
  }),
  path: z.string(),
  content: z.string(),
});
export type ObsidianFile = z.infer<typeof obsidianFileSchema>;

export const obsidianFileResponseSchema = z.union([
  obsidianFileSchema,
  obsidianError,
]);
