import z from "zod";

import { characterCardSchema } from "@/lib/character-card-schema";
import {
  MAX_CHARACTER_IMAGE_SIZE,
  MAX_CHARACTER_IMAGE_SIZE_MB,
} from "@/lib/constants";
import { buildCharacterImageUrl } from "@/lib/image";

export const CHARACTER_CACHE_KEY = "character";

export const characterListItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  pngHash: z.string().min(1),
});
export type CharacterListItem = z.infer<typeof characterListItemSchema>;

export const characterEntitySchema = z.object({
  createdAt: z.date(),
  id: z.string().min(1),
  modifiedAt: z.date(),
  name: z.string().min(1),
  png: z.string().min(1),
  pngHash: z.string().min(1),
});

export const characterRecordSchema = z.object({
  card: characterCardSchema,
  entity: characterEntitySchema,
});
export type CharacterRecord = z.infer<typeof characterRecordSchema>;

export const characterDtoSchema = z.object({
  ...characterEntitySchema.pick({
    createdAt: true,
    id: true,
    modifiedAt: true,
  }).shape,
  ...characterCardSchema.pick({
    creator_notes: true,
    description: true,
    first_mes: true,
    mes_example: true,
    name: true,
    personality: true,
    scenario: true,
    tags: true,
  }).shape,
  imageUrl: z.string().min(1),
});
export type CharacterDto = z.infer<typeof characterDtoSchema>;

export function toCharacterDto(record: CharacterRecord): CharacterDto {
  return characterDtoSchema.parse({
    createdAt: record.entity.createdAt,
    creator_notes: record.card.creator_notes,
    description: record.card.description,
    first_mes: record.card.first_mes,
    id: record.entity.id,
    imageUrl: buildCharacterImageUrl({
      id: record.entity.id,
      pngHash: record.entity.pngHash,
    }),
    mes_example: record.card.mes_example,
    modifiedAt: record.entity.modifiedAt,
    name: record.card.name,
    personality: record.card.personality,
    scenario: record.card.scenario,
    tags: record.card.tags,
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
  creator_notes: z.string(),
  description: z.string(),
  first_mes: z.string(),
  image: characterImageValidator.optional(),
  mes_example: z.string(),
  name: z.string().min(1),
  personality: z.string(),
  scenario: z.string(),
  tags: z.string().array(),
});
export type CharacterFormValues = z.infer<typeof characterFormSchema>;
