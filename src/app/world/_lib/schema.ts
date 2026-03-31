import { World } from "../../../generated/client";
import { buildWorldImageUrl } from "@/lib/image";
import z from "zod";

export const WORLD_CACHE_KEY = "world";

export const worldImageValidator = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), "Must be an image")
  .refine((file) => file.size <= 15 * 1024 * 1024, "Max file size is 15MB");

export const worldFormSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  image: worldImageValidator.optional(),
});
export type WorldFormValues = z.infer<typeof worldFormSchema>;

export const worldDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  imageUrl: z.string().min(1),
  createdAt: z.date(),
  modifiedAt: z.date(),
});
export type WorldDto = z.infer<typeof worldDtoSchema>;

export function toWorldDto(world: World): WorldDto {
  return worldDtoSchema.parse({
    id: world.id,
    name: world.name,
    description: world.description,
    imageUrl: buildWorldImageUrl({ id: world.id, imgHash: world.imageHash }),
    createdAt: world.createdAt,
    modifiedAt: world.modifiedAt,
  });
}
