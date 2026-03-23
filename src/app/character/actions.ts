"use server";

import { createCharacter } from "@/app/character/data";
import { importFromPngFormSchema } from "@/app/character/validators";
import {
  characterCardSchema,
  readCharacterFromBuffer,
} from "@/lib/character-card-parser";
import { ActionResponse } from "@/lib/types";
import { redirect } from "next/navigation";

export async function importCharacterFromPNG(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<{ id: string }>> {
  const parseResult = importFromPngFormSchema.safeParse({
    png: formData.get("png"),
  });

  if (!parseResult.success) {
    return { success: false, message: parseResult.error.message };
  }
  const { png } = parseResult.data;

  // extract character data
  try {
    const imageBuffer = Buffer.from(await png.arrayBuffer());
    const imageText = JSON.parse(readCharacterFromBuffer(imageBuffer));
    const characterCard = characterCardSchema.parse(imageText);

    const { entity } = await createCharacter({
      characterCard,
      image: imageBuffer,
    });
    redirect(`/character/${entity.id}`);
  } catch (err) {
    console.error(err);
    return { success: false, message: "Character import failed" };
  }
}
