import { Persona } from "../../../generated/client";
import { buildPersonaImageUrl } from "@/lib/image";
import z from "zod";

export const PERSONA_CACHE_KEY = "persona";

export const personaImageValidator = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), "Must be an image")
  .refine((file) => file.size <= 15 * 1024 * 1024, "Max file size is 15MB");

export const personaFormSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  image: personaImageValidator.optional(),
});
export type PersonaFormValues = z.infer<typeof personaFormSchema>;

export const personaDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  imageUrl: z.string().min(1),
  createdAt: z.date(),
  modifiedAt: z.date(),
});
export type PersonaDto = z.infer<typeof personaDtoSchema>;

export function toPersonaDto(persona: Persona): PersonaDto {
  return personaDtoSchema.parse({
    id: persona.id,
    name: persona.name,
    description: persona.description,
    imageUrl: buildPersonaImageUrl({ id: persona.id, imgHash: persona.imageHash }),
    createdAt: persona.createdAt,
    modifiedAt: persona.modifiedAt,
  });
}
