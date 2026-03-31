import z from "zod";

export const LOREBOOK_CACHE_KEY = "lorebook";
export const LOREBOOK_DB_CACHE_KEY = "lorebook-db";

export const lorebookDbFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  port: z.number(),
  apiKey: z.string().min(1, "API key is required"),
});
export type LorebookDbFormValues = z.infer<typeof lorebookDbFormSchema>;

export const lorebookDbDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  apiKey: z.string().min(1),
  port: z.number(),
  createdAt: z.date(),
  modifiedAt: z.date(),
});
export type LorebookDbDto = z.infer<typeof lorebookDbDtoSchema>;

export enum LorebookStatus {
  ServerUnavailable = "server-unavailable",
  NotInitialized = "not-initalized",
  IndexMissing = "index-missing",
  Ready = "ready",
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

const lorebookServerUnavailableSchema = z.object({
  status: z.literal(LorebookStatus.ServerUnavailable),
});
const lorebookNotInitializedSchema = z.object({
  status: z.literal(LorebookStatus.NotInitialized),
});
const lorebookIndexMissingSchema = z.object({
  status: z.literal(LorebookStatus.IndexMissing),
  name: z.string(),
});
const lorebookReadySchema = z.object({
  status: z.literal(LorebookStatus.Ready),
  name: z.string(),
  index: lorebookIndexSchema.array(),
});

export const lorebookSchema = z.discriminatedUnion("status", [
  lorebookServerUnavailableSchema,
  lorebookNotInitializedSchema,
  lorebookIndexMissingSchema,
  lorebookReadySchema,
]);

export type Lorebook = z.infer<typeof lorebookSchema>;

export const lorebookDtoSchema = z.discriminatedUnion("status", [
  lorebookServerUnavailableSchema,
  lorebookNotInitializedSchema,
  lorebookIndexMissingSchema,
  lorebookReadySchema.omit({ index: true }),
]);

export type LorebookDto = z.infer<typeof lorebookDtoSchema>;

export function toLorebookDto(lorebook: Lorebook): LorebookDto {
  return lorebookDtoSchema.parse(lorebook);
}

export const initializeLorebookFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});
export type InitializeLorebookFormValues = z.infer<
  typeof initializeLorebookFormSchema
>;

const obsidianError = z.object({
  message: z.string(),
  errorCode: z.number(),
});

const lorebookMetadataFileSchema = z.object({
  name: z.string(),
});

export const obsidianMetadataResponseSchema = z.union([
  obsidianError,
  lorebookMetadataFileSchema,
]);
export type ObsidianMetadataResponse = z.infer<
  typeof obsidianMetadataResponseSchema
>;

export const getLorebookIndexSuccessSchema = z
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
export const getLorebookIndexResposneSchema = z.union([
  getLorebookIndexSuccessSchema,
  obsidianError,
]);
export type GetLorebookIndexResposne = z.infer<
  typeof getLorebookIndexResposneSchema
>;

export const lorebookFileSchema = z.object({
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
export type LorebookFile = z.infer<typeof lorebookFileSchema>;

export const lorebookFileResponseSchema = z.union([
  lorebookFileSchema,
  obsidianError,
]);
