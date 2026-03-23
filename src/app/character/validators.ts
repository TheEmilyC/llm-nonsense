import {
  MAX_CHARACTER_IMAGE_SIZE,
  MAX_CHARACTER_IMAGE_SIZE_MB,
} from "@/lib/constants";
import z from "zod";

export const characterImageValidator = z
  .instanceof(File)
  .refine((file) => file.type === "image/png", "Only PNGs are supported.")
  .refine(
    (file) => file.size <= MAX_CHARACTER_IMAGE_SIZE,
    `Max file size is ${MAX_CHARACTER_IMAGE_SIZE_MB}MB`,
  );

export const importFromPngFormSchema = z.object({
  png: characterImageValidator,
});
export type ImportFromPngForm = z.infer<typeof importFromPngFormSchema>;
