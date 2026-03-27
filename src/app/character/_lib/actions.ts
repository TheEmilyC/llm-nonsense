"use server";

import {
  createCharacter,
  deleteCharacter,
  updateCharacter,
} from "@/app/character/_lib/data";
import {
  CharacterDto,
  characterFormSchema,
  CharacterFormValues,
  ImportFromPngForm,
  importFromPngFormSchema,
  toCharacterDto,
} from "@/app/character/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";
import {
  characterCardSchema,
  readCharacterFromBuffer,
} from "@/lib/character-card-parser";
import { dbIdValidator } from "@/lib/validators";
import { notFound } from "next/navigation";
import z from "zod";

export async function importCharacterFromPNGAction(
  data: ImportFromPngForm,
): Promise<ActionResponse<{ id: string }>> {
  const parseResult = importFromPngFormSchema.safeParse(data);

  if (!parseResult.success) {
    console.error(z.prettifyError(parseResult.error));
    return { success: false, error: "Character import failed" };
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
    return { success: false, error: "Character import failed" };
  }
  if (!character) {
    console.error("character missing after create");
    return { success: false, error: "Character import failed" };
  }
  return { success: true, data: { id: character.entity.id } };
}

export async function deleteCharacterAction(
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
    return { success: false, error: "failed to delete character" };
  }
  return { success: true, data: null };
}

export async function updateCharacterAction(
  characterId: string,
  data: CharacterFormValues,
): Promise<ActionResponse<CharacterDto>> {
  const formParseResult = characterFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(z.prettifyError(formParseResult.error));
    return { success: false, error: "Malformed character data" };
  }
  const idParseResult = dbIdValidator.safeParse(characterId);
  if (!idParseResult.success) {
    console.error(z.prettifyError(idParseResult.error));
    notFound();
  }
  const id = idParseResult.data;
  const { image, ...card } = formParseResult.data;

  let character;
  try {
    character = await updateCharacter({ id, update: { card, image } });
  } catch (err) {
    console.error(err);
    return { success: false, error: "Character update failed" };
  }

  return { success: true, data: toCharacterDto(character) };
}

export async function createCharacterAction(
  data: CharacterFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const formParseResult = characterFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(z.prettifyError(formParseResult.error));
    return { success: false, error: "Malformed character data" };
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
    return { success: false, error: "Character create failed" };
  }

  return { success: true, data: { id: character.entity.id } };
}
