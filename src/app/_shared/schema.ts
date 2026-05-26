import z from "zod";

import {
  MAX_AVATAR_IMAGE_SIZE,
  MAX_AVATAR_IMAGE_SIZE_MB,
} from "@/lib/constants";

export const dbIdValidator = z.cuid2();

export const avatarImageValidator = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), "Must be an image")
  .refine(
    (file) => file.size <= MAX_AVATAR_IMAGE_SIZE,
    `Max file size is ${MAX_AVATAR_IMAGE_SIZE_MB}MB`,
  );

export const messageRoleSchema = z.enum(["assistant", "system", "user"]);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const entityProfileSchema = z.object({
  id: dbIdValidator,
  imageSrc: z.string().min(1, "Image source is required"),
  name: z.string().min(1, "Name is required"),
});
export type EntityProfile = z.infer<typeof entityProfileSchema>;
