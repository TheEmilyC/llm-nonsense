import z from "zod";

import { dbIdValidator } from "@/lib/validators";

export const WORLD_CACHE_KEY = "world";

// -- Base
const baseWorldSchema = z.object({
  createdAt: z.date(),
  description: z.string(),
  id: dbIdValidator,
  image: z.string().min(1, "Image is required"),
  imageHash: z.string().min(1, "Image Hash is required"),
  modifiedAt: z.date(),
  name: z.string().min(1, "Name is required"),
});

export const worldImageValidator = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), "Must be an image")
  .refine((file) => file.size <= 15 * 1024 * 1024, "Max file size is 15MB");

// -- Schemas

export const worldFormSchema = baseWorldSchema
  .pick({
    description: true,
    name: true,
  })
  .extend({
    image: worldImageValidator.optional(),
  });
export type WorldFormValues = z.infer<typeof worldFormSchema>;

export const updateWorldActionParamsSchema = baseWorldSchema
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

export const worldListDtoSchema = baseWorldSchema
  .pick({
    id: true,
    name: true,
  })
  .extend({
    imageUrl: z.string().min(1),
  });
export type WorldListDto = z.infer<typeof worldListDtoSchema>;

export const worldDtoSchema = baseWorldSchema
  .pick({
    description: true,
    id: true,
    name: true,
  })
  .extend({
    imageUrl: z.string().min(1),
  });
export type WorldDto = z.infer<typeof worldDtoSchema>;
