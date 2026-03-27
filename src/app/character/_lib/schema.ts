import { characterCardSchema } from "@/lib/character-card-schema";
import {
  MAX_CHARACTER_IMAGE_SIZE,
  MAX_CHARACTER_IMAGE_SIZE_MB,
} from "@/lib/constants";
import { buildCharacterImageUrl } from "@/lib/image";
import z from "zod";

export const CHARACTER_CACHE_KEY = "character";

export const characterListItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  pngHash: z.string().min(1),
});
export type CharacterListItem = z.infer<typeof characterListItemSchema>;

export const characterEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  png: z.string().min(1),
  pngHash: z.string().min(1),
  createdAt: z.date(),
  modifiedAt: z.date(),
});

export const characterRecordSchema = z.object({
  entity: characterEntitySchema,
  card: characterCardSchema,
});
export type CharacterRecord = z.infer<typeof characterRecordSchema>;

export const characterDtoSchema = z.object({
  ...characterEntitySchema.pick({
    id: true,
    createdAt: true,
    modifiedAt: true,
  }).shape,
  ...characterCardSchema.pick({
    name: true,
    description: true,
    personality: true,
    scenario: true,
    first_mes: true,
    mes_example: true,
    creator_notes: true,
    tags: true,
  }).shape,
  imageUrl: z.string().min(1),
});
export type CharacterDto = z.infer<typeof characterDtoSchema>;

export function toCharacterDto(record: CharacterRecord): CharacterDto {
  return characterDtoSchema.parse({
    id: record.entity.id,
    createdAt: record.entity.createdAt,
    modifiedAt: record.entity.modifiedAt,
    name: record.card.name,
    description: record.card.description,
    personality: record.card.personality,
    scenario: record.card.scenario,
    first_mes: record.card.first_mes,
    mes_example: record.card.mes_example,
    creator_notes: record.card.creator_notes,
    tags: record.card.tags,
    imageUrl: buildCharacterImageUrl({
      id: record.entity.id,
      pngHash: record.entity.pngHash,
    }),
  });
}

export const characterImageValidator = z
  .instanceof(File)
  .refine((file) => file.type === "image/png", "Only PNGs are supported.")
  .refine(
    (file) => file.size <= MAX_CHARACTER_IMAGE_SIZE,
    `Max file size is ${MAX_CHARACTER_IMAGE_SIZE_MB}MB`,
  );

export const importFromPngFormSchema = z.object({
  png: characterImageValidator,
});
export type ImportFromPngForm = z.infer<typeof importFromPngFormSchema>;

export const characterFormSchema = z.object({
  name: z.string().min(1),
  tags: z.string().array(),
  description: z.string(),
  personality: z.string(),
  scenario: z.string(),
  first_mes: z.string(),
  mes_example: z.string(),
  creator_notes: z.string(),
  image: characterImageValidator.optional(),
});
export type CharacterFormValues = z.infer<typeof characterFormSchema>;
