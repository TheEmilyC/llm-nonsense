"use server";

import { notFound } from "next/navigation";

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

export async function createCharacterAction(
  data: CharacterFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const formParseResult = characterFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(formParseResult.error);
    return { error: "Malformed character data", success: false };
  }
  const { image, ...card } = formParseResult.data;
  const characterCard = {
    avatar: "none",
    chat: "",
    create_date: new Date(),
    creatorcomment: "",
    fav: false,
    spec: "chara_card_v3",
    spec_version: "3.0",
    talkativeness: "0.5",
    ...card,
  };

  let character;
  try {
    character = await createCharacter({ characterCard, image });
  } catch (err) {
    console.error(err);
    return { error: "Character create failed", success: false };
  }

  return { data: { id: character.entity.id }, success: true };
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
    return { error: "failed to delete character", success: false };
  }
  return { data: null, success: true };
}

export async function importCharacterFromPNGAction(
  data: ImportFromPngForm,
): Promise<ActionResponse<{ id: string }>> {
  const parseResult = importFromPngFormSchema.safeParse(data);

  if (!parseResult.success) {
    console.error(parseResult.error);
    return { error: "Character import failed", success: false };
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
    return { error: "Character import failed", success: false };
  }
  if (!character) {
    console.error("character missing after create");
    return { error: "Character import failed", success: false };
  }
  return { data: { id: character.entity.id }, success: true };
}

export async function updateCharacterAction(
  characterId: string,
  data: CharacterFormValues,
): Promise<ActionResponse<CharacterDto>> {
  const formParseResult = characterFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(formParseResult.error);
    return { error: "Malformed character data", success: false };
  }
  const idParseResult = dbIdValidator.safeParse(characterId);
  if (!idParseResult.success) {
    console.error(idParseResult.error);
    notFound();
  }
  const id = idParseResult.data;
  const { image, ...card } = formParseResult.data;

  let character;
  try {
    character = await updateCharacter({ id, update: { card, image } });
  } catch (err) {
    console.error(err);
    return { error: "Character update failed", success: false };
  }

  return { data: toCharacterDto(character), success: true };
}
