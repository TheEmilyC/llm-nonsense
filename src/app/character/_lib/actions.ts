"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { readCharacterFromBuffer } from "@/app/character/_lib/character-card-parser";
import {
  createCharacter,
  deleteCharacter,
  updateCharacter,
} from "@/app/character/_lib/data";
import {
  CHARACTER_CACHE_KEY,
  characterCardSchema,
  CharacterDto,
  characterFormSchema,
  CharacterFormValues,
  ImportFromPngForm,
  importFromPngFormSchema,
} from "@/app/character/_lib/schema";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { logger, parseError } from "@/lib/logger";
import { dbIdValidator } from "@/lib/validators";

export async function createCharacterAction(
  data: CharacterFormValues,
): Promise<ActionResponse> {
  const formParseResult = characterFormSchema.safeParse(data);
  if (!formParseResult.success) {
    return toActionResponseError(formParseResult.error);
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

  let character: CharacterDto;
  try {
    character = await createCharacter({ characterCard, image });
  } catch (err) {
    logger.error("Failed creating character", parseError(err));
    return toActionResponseError(err);
  }
  logger.info("Character created", {
    id: character.id,
  });

  updateTag(CHARACTER_CACHE_KEY);
  redirect(`/character/${character.id}`);
}

export async function deleteCharacterAction(
  characterId: string,
): Promise<ActionResponse> {
  const idParseResult = dbIdValidator.safeParse(characterId);
  if (!idParseResult.success) {
    return toActionResponseError(idParseResult.error);
  }
  const id = idParseResult.data;
  try {
    await deleteCharacter(id);
  } catch (err) {
    logger.error("Failed deleting character", { id, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Character deleted", {
    id: characterId,
  });

  updateTag(CHARACTER_CACHE_KEY);
  updateTag(`${CHARACTER_CACHE_KEY}-${id}`);
  redirect("/character");
}

export async function importCharacterFromPNGAction(
  data: ImportFromPngForm,
): Promise<ActionResponse> {
  const parseResult = importFromPngFormSchema.safeParse(data);

  if (!parseResult.success) {
    return toActionResponseError(parseResult.error);
  }
  const { png } = parseResult.data;

  // extract character data
  let character: CharacterDto;
  try {
    const imageBuffer = Buffer.from(await png.arrayBuffer());
    const imageText = JSON.parse(readCharacterFromBuffer(imageBuffer));
    const characterCard = characterCardSchema.parse(imageText);

    character = await createCharacter({
      characterCard,
      image: imageBuffer,
    });
  } catch (err) {
    logger.error("Failed to create character", parseError(err));
    return toActionResponseError(err);
  }
  logger.info("Character imported", { id: character.id });

  updateTag(CHARACTER_CACHE_KEY);
  redirect(`/character/${character.id}`);
}

export async function updateCharacterAction(
  characterId: string,
  data: CharacterFormValues,
): Promise<ActionResponse> {
  const idParseResult = dbIdValidator.safeParse(characterId);
  if (!idParseResult.success) {
    return toActionResponseError(idParseResult.error);
  }
  const formParseResult = characterFormSchema.safeParse(data);
  if (!formParseResult.success) {
    return toActionResponseError(formParseResult.error);
  }
  const id = idParseResult.data;
  const { image, ...card } = formParseResult.data;

  try {
    await updateCharacter({ id, update: { card, image } });
  } catch (err) {
    logger.error(`Failed to update character`, {
      id,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
  logger.info(`Character updated`, { id });

  updateTag(CHARACTER_CACHE_KEY);
  updateTag(`${CHARACTER_CACHE_KEY}-${id}`);
  return { success: true };
}
