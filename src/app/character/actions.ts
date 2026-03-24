"use server";

import {
  createCharacter,
  deleteCharacter,
  updateCharacter,
} from "@/app/character/data";
import {
  characterFormSchema,
  importFromPngFormSchema,
} from "@/app/character/schema";
import { ActionResponse } from "@/lib/action-utils";
import {
  characterCardSchema,
  readCharacterFromBuffer,
} from "@/lib/character-card-parser";
import { dbIdValidator } from "@/lib/validators";
import { refresh } from "next/cache";
import { notFound, redirect } from "next/navigation";
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
  let character;
  try {
    const imageBuffer = Buffer.from(await png.arrayBuffer());
    const imageText = JSON.parse(readCharacterFromBuffer(imageBuffer));
    const characterCard = characterCardSchema.parse(imageText);

    character = await createCharacter({
      characterCard,
      image: imageBuffer,
    });
  } catch (err) {
    console.error(err);
    return { success: false, message: "Character import failed" };
  }
  if (!character) {
    console.error("character missing after create");
    return { success: false, message: "Character import failed" };
  }
  redirect(`/character/${character.entity.id}`);
}

export async function deleteCharacterAction(
  prevState: unknown,
  characterId: string,
): Promise<ActionResponse<null>> {
  const idParseResult = dbIdValidator.safeParse(characterId);
  if (!idParseResult.success) {
    notFound();
  }
  const id = idParseResult.data;
  try {
    await deleteCharacter(id);
  } catch (err) {
    console.error(err);
    return { success: false, message: "failed to delete character" };
  }
  redirect("/character");
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
    console.error(z.prettifyError(idParseResult.error));
    notFound();
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

export async function createCharacterAction(
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
  const { image, ...card } = formParseResult.data;
  const characterCard = {
    creatorcomment: "",
    avatar: "none",
    chat: "",
    talkativeness: "0.5",
    fav: false,
    spec: "chara_card_v3",
    spec_version: "3.0",
    create_date: new Date(),
    ...card,
  };

  let character;
  try {
    character = await createCharacter({ characterCard, image });
  } catch (err) {
    console.error(err);
    return { success: false, message: "Character create failed" };
  }
  redirect(`/character/${character.entity.id}`);
}
