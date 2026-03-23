"use server";

import {
  createCharacter,
  deleteCharacter,
  updateCharacter,
} from "@/app/character/data";
import {
  characterFormSchema,
  importFromPngFormSchema,
} from "@/app/character/validators";
import {
  characterCardSchema,
  readCharacterFromBuffer,
} from "@/lib/character-card-parser";
import { ActionResponse } from "@/lib/types";
import { dbIdValidator } from "@/lib/validators";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";

export async function importCharacterFromPNG(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<{ id: string }>> {
  const parseResult = importFromPngFormSchema.safeParse({
    png: formData.get("png"),
  });

  if (!parseResult.success) {
    console.error(z.prettifyError(parseResult.error));
    return { success: false, message: "Character import failed" };
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

export async function deleteCharacterAction(
  prevState: unknown,
  id: string,
): Promise<ActionResponse<null>> {
  try {
    await deleteCharacter(id);
    redirect("/character");
  } catch (err) {
    console.error(err);
    return { success: false, message: "failed to delete character" };
  }
}

export async function updateCharacterAction(
  characterId: string,
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<null>> {
  const imageFile = formData.get("image") as File | null;
  const formParseResult = characterFormSchema.safeParse({
    name: formData.get("name"),
    tags: formData.getAll("tags"),
    description: formData.get("description"),
    personality: formData.get("personality"),
    scenario: formData.get("scenario"),
    first_mes: formData.get("first_mes"),
    mes_example: formData.get("mes_example"),
    creator_notes: formData.get("creator_notes"),
    image: imageFile && imageFile.size > 0 ? imageFile : undefined,
  });
  if (!formParseResult.success) {
    console.error(z.prettifyError(formParseResult.error));
    return { success: false, message: "Malformed character data" };
  }
  const idParseResult = dbIdValidator.safeParse(characterId);
  if (!idParseResult.success) {
    console.error(z.treeifyError(idParseResult.error));
    return { success: false, message: "Malformed character data" };
  }
  const id = idParseResult.data;
  const { image, ...card } = formParseResult.data;

  try {
    await updateCharacter({ id, update: { card, image } });
    refresh();
    return { success: true, data: null };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Character update failed" };
  }
}
