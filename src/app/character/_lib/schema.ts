import z from "zod";

import {
  MAX_CHARACTER_IMAGE_SIZE,
  MAX_CHARACTER_IMAGE_SIZE_MB,
} from "@/lib/constants";

export const CHARACTER_CACHE_KEY = "character";

// -- Base

// V3 character card community standard
export const characterCardSchema = z.looseObject({
  avatar: z.string(),
  chat: z.string(),
  create_date: z.coerce.date(),
  creator_notes: z.string(),
  creatorcomment: z.string(),
  description: z.string(),
  fav: z.boolean(),
  first_mes: z.string(),
  mes_example: z.string(),
  name: z.string().min(1),
  personality: z.string(),
  scenario: z.string(),
  spec: z.string(),
  spec_version: z.string(),
  tags: z.string().array(),
  talkativeness: z.string(),
});
export type CharacterCard = z.infer<typeof characterCardSchema>;

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

const characterImageValidator = z
  .instanceof(File)
  .refine((file) => file.type === "image/png", "Only PNGs are supported.")
  .refine(
    (file) => file.size <= MAX_CHARACTER_IMAGE_SIZE,
    `Max file size is ${MAX_CHARACTER_IMAGE_SIZE_MB}MB`,
  );

// -- Schemas

export const importFromPngFormSchema = z.object({
  png: characterImageValidator,
});
export type ImportFromPngForm = z.infer<typeof importFromPngFormSchema>;

export const characterFormSchema = characterCardSchema
  .pick({
    creator_notes: true,
    description: true,
    first_mes: true,
    mes_example: true,
    name: true,
    personality: true,
    scenario: true,
    tags: true,
  })
  .extend({
    image: characterImageValidator.optional(),
  });
export type CharacterFormValues = z.infer<typeof characterFormSchema>;

export const characterImageFileDtoSchema = characterEntitySchema.pick({
  id: true,
  png: true,
});
export type CharacterImageFileDto = z.infer<typeof characterImageFileDtoSchema>;

// -- DTOs

export const characterListDtoSchema = characterEntitySchema
  .pick({
    id: true,
    name: true,
  })
  .extend({
    imageUrl: z.string().min(1),
  });
export type CharacterListDto = z.infer<typeof characterListDtoSchema>;

export const characterDtoSchema = characterEntitySchema
  .pick({
    createdAt: true,
    id: true,
    modifiedAt: true,
  })
  .extend(
    characterCardSchema.pick({
      creator_notes: true,
      description: true,
      first_mes: true,
      mes_example: true,
      name: true,
      personality: true,
      scenario: true,
      tags: true,
    }).shape,
  )
  .extend({
    imageUrl: z.string().min(1),
  });
export type CharacterDto = z.infer<typeof characterDtoSchema>;
