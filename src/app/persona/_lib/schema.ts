import z from "zod";

import { dbIdValidator } from "@/lib/validators";

export const PERSONA_CACHE_KEY = "persona";

// -- Base
const personaEntitySchema = z.object({
  createdAt: z.date(),
  description: z.string(),
  id: dbIdValidator,
  image: z.string().min(1, "Image is required"),
  imageHash: z.string().min(1, "Image Hash is required"),
  modifiedAt: z.date(),
  name: z.string().min(1, "Name is required"),
});

const personaImageValidator = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), "Must be an image")
  .refine((file) => file.size <= 15 * 1024 * 1024, "Max file size is 15MB");

// -- Schemas

export const personaFormSchema = personaEntitySchema
  .pick({
    description: true,
    name: true,
  })
  .extend({
    image: personaImageValidator.optional(),
  });
export type PersonaFormValues = z.infer<typeof personaFormSchema>;

export const updatePersonaActionParamsSchema = personaEntitySchema
  .pick({
    id: true,
  })
  .extend({
    update: personaFormSchema,
  });
export type UpdatePersonaActionParams = z.infer<
  typeof updatePersonaActionParamsSchema
>;

// -- DTOs

export const personaListDtoSchema = personaEntitySchema
  .pick({
    id: true,
    name: true,
  })
  .extend({
    imageUrl: z.string().min(1),
  });
export type PersonaListDto = z.infer<typeof personaListDtoSchema>;

export const personaDtoSchema = personaEntitySchema
  .pick({
    createdAt: true,
    description: true,
    id: true,
    modifiedAt: true,
    name: true,
  })
  .extend({
    imageUrl: z.string().min(1),
  });
export type PersonaDto = z.infer<typeof personaDtoSchema>;

export const personaImageFileDtoSchema = personaEntitySchema.pick({
  id: true,
  image: true,
});
export type PersonaImageFileDto = z.infer<typeof personaImageFileDtoSchema>;
