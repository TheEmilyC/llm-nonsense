import z from "zod";

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

export const lorebookSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal(LorebookStatus.ServerUnavailable) }),
  z.object({ status: z.literal(LorebookStatus.NotInitialized) }),
  z.object({
    status: z.literal(LorebookStatus.IndexMissing),
    name: z.string(),
  }),
  z.object({
    status: z.literal(LorebookStatus.Ready),
    name: z.string(),
    index: indexEntrySchema.array(),
  }),
]);

export type Lorebook = z.infer<typeof lorebookSchema>;

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
