import z from "zod";

import { avatarImageValidator, dbIdValidator } from "@/app/_shared/schema";

export const PERSONA_CACHE_KEY = "persona";

// -- Base
export const personaEntitySchema = z.object({
  createdAt: z.date(),
  description: z.string(),
  id: dbIdValidator,
  image: z.string().min(1, "Image is required"),
  imageHash: z.string().min(1, "Image Hash is required"),
  modifiedAt: z.date(),
  name: z.string().min(1, "Name is required"),
});
export type PersonaEntity = z.infer<typeof personaEntitySchema>;

// -- Schemas

export const personaFormSchema = personaEntitySchema
  .pick({
    description: true,
    name: true,
  })
  .extend({
    image: avatarImageValidator.optional(),
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
