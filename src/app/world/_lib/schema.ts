import z from "zod";

import { buildWorldImageUrl } from "@/lib/image";

import { World } from "../../../../generated/client";

export const WORLD_CACHE_KEY = "world";

export const worldImageValidator = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), "Must be an image")
  .refine((file) => file.size <= 15 * 1024 * 1024, "Max file size is 15MB");

export const worldFormSchema = z.object({
  description: z.string(),
  image: worldImageValidator.optional(),
  name: z.string().min(1),
});
export type WorldFormValues = z.infer<typeof worldFormSchema>;

export const worldDtoSchema = z.object({
  createdAt: z.date(),
  description: z.string(),
  id: z.string().min(1),
  imageUrl: z.string().min(1),
  modifiedAt: z.date(),
  name: z.string().min(1),
});
export type WorldDto = z.infer<typeof worldDtoSchema>;

export function toWorldDto(world: World): WorldDto {
  return worldDtoSchema.parse({
    createdAt: world.createdAt,
    description: world.description,
    id: world.id,
    imageUrl: buildWorldImageUrl({ id: world.id, imgHash: world.imageHash }),
    modifiedAt: world.modifiedAt,
    name: world.name,
  });
}
