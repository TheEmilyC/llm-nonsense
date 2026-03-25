import z from "zod";

export const LOREBOOK_CACHE_KEY = "lorebook";

export enum LorebookStatus {
  ServerUnavailable = "server-unavailable",
  NotInitialized = "not-initalized",
  IndexMissing = "index-missing",
  Ready = "ready",
}

const indexEntrySchema = z.object({
  filename: z.string(),
  name: z.string(),
  summary: z.string(),
  tags: z.string().array(),
  keys: z.string().array(),
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
  index: indexEntrySchema.array(),
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

const lorebookIndexFileSchema = z.object({
  name: z.string(),
});
export type LorebookIndexFile = z.infer<typeof lorebookIndexFileSchema>;

const obsidianError = z.object({
  message: z.string(),
  errorCode: z.number(),
});

export const obsidianValutResponseSchema = z.union([
  obsidianError,
  lorebookIndexFileSchema,
]);
export type ObsidianValutResponse = z.infer<typeof obsidianValutResponseSchema>;

export const findLorebookIndexSuccessSchema = z
  .object({
    filename: z.string(),
    result: z.object({
      title: z.string().nullable(),
      tags: z.string().array(),
      keys: z.string().array().nullable(),
      summary: z.string().nullable(),
    }),
  })
  .array();
export const getLorebookIndexResposneSchema = z.union([
  findLorebookIndexSuccessSchema,
  obsidianError,
]);
export type GetLorebookIndexResposne = z.infer<
  typeof getLorebookIndexResposneSchema
>;
