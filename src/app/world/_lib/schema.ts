import z from "zod";

import { avatarImageValidator, dbIdValidator } from "@/app/_shared/schema";

export const WORLD_CACHE_KEY = "world";

// -- Base
export const worldEntitySchema = z.object({
  createdAt: z.date(),
  description: z.string(),
  id: dbIdValidator,
  image: z.string().min(1, "Image is required"),
  imageHash: z.string().min(1, "Image Hash is required"),
  modifiedAt: z.date(),
  name: z.string().min(1, "Name is required"),
});
export type WorldEntity = z.infer<typeof worldEntitySchema>;

export const worldImageValidator = avatarImageValidator;

// -- Schemas

export const worldFormSchema = worldEntitySchema
  .pick({
    description: true,
    name: true,
  })
  .extend({
    image: worldImageValidator.optional(),
  });
export type WorldFormValues = z.infer<typeof worldFormSchema>;

export const updateWorldActionParamsSchema = worldEntitySchema
  .pick({
    id: true,
  })
  .extend({
    update: worldFormSchema,
  });
export type UpdateWorldActionParams = z.infer<
  typeof updateWorldActionParamsSchema
>;

// -- DTOs

export const worldListDtoSchema = worldEntitySchema
  .pick({
    id: true,
    name: true,
  })
  .extend({
    imageUrl: z.string().min(1),
  });
export type WorldListDto = z.infer<typeof worldListDtoSchema>;

export const worldDtoSchema = worldEntitySchema
  .pick({
    description: true,
    id: true,
    name: true,
  })
  .extend({
    imageUrl: z.string().min(1),
  });
export type WorldDto = z.infer<typeof worldDtoSchema>;
