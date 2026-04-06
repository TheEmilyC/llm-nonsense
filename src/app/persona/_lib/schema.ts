import z from "zod";

import { buildPersonaImageUrl } from "@/lib/image";

import { Persona } from "../../../../generated/client";

export const PERSONA_CACHE_KEY = "persona";

export const personaImageValidator = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), "Must be an image")
  .refine((file) => file.size <= 15 * 1024 * 1024, "Max file size is 15MB");

export const personaFormSchema = z.object({
  description: z.string(),
  image: personaImageValidator.optional(),
  name: z.string().min(1),
});
export type PersonaFormValues = z.infer<typeof personaFormSchema>;

export const personaDtoSchema = z.object({
  createdAt: z.date(),
  description: z.string(),
  id: z.string().min(1),
  imageUrl: z.string().min(1),
  modifiedAt: z.date(),
  name: z.string().min(1),
});
export type PersonaDto = z.infer<typeof personaDtoSchema>;

export function toPersonaDto(persona: Persona): PersonaDto {
  return personaDtoSchema.parse({
    createdAt: persona.createdAt,
    description: persona.description,
    id: persona.id,
    imageUrl: buildPersonaImageUrl({
      id: persona.id,
      imgHash: persona.imageHash,
    }),
    modifiedAt: persona.modifiedAt,
    name: persona.name,
  });
}
