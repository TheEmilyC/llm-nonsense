"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { dbIdValidator } from "@/app/_shared/schema";
import { getCharacterEntityById } from "@/app/character/_lib/data";
import { getPersonaById } from "@/app/persona/_lib/data";
import { createStory, deleteStory, updateStory } from "@/app/story/_lib/data";
import {
  STORY_CACHE_KEY,
  StoryEntity,
  storyFormSchema,
  StoryFormValues,
  UpdateStoryActionParams,
  updateStoryActionParamsSchema,
} from "@/app/story/_lib/schema";
import { getWorldById } from "@/app/world/_lib/data";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { logger, parseError } from "@/lib/logger";

export async function createStoryAction(
  data: StoryFormValues,
): Promise<ActionResponse> {
  const dataParseResult = storyFormSchema.safeParse(data);
  if (!dataParseResult.success)
    return toActionResponseError(dataParseResult.error);

  const formData = dataParseResult.data;

  let name: string = "";
  if (!formData.name) {
    // generate name
    const [character, persona, world] = await Promise.all([
      formData.characterId
        ? getCharacterEntityById(formData.characterId)
        : null,
      formData.personaId ? getPersonaById(formData.personaId) : null,
      formData.worldId ? getWorldById(formData.worldId) : null,
    ]);
    if (character) name += character.name;
    if (persona) {
      if (name.length > 0) name += " and ";
      name += persona.name;
    }
    if (world) {
      if (name.length > 0) name += " in ";
      name += world.name;
    }
  } else {
    name = formData.name;
  }

  let story: StoryEntity;
  const newStory = {
    ...formData,
    name,
  };
  try {
    story = await createStory(newStory);
  } catch (err) {
    logger.error("Failed to create story", { data, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Story created", { id: story.id });

  updateTag(STORY_CACHE_KEY);
  redirect(`/story/${story.id}`);
}

export async function deleteStoryAction(
  storyId: string,
): Promise<ActionResponse> {
  const idParseResult = dbIdValidator.safeParse(storyId);
  if (!idParseResult.success) return toActionResponseError(idParseResult.error);

  const id = idParseResult.data;

  try {
    await deleteStory(id);
  } catch (err) {
    logger.error("Failed to delete story", { id, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Story deleted", { id });

  updateTag(STORY_CACHE_KEY);
  updateTag(`${STORY_CACHE_KEY}-${id}`);
  redirect("/story");
}

export async function updateStoryAction(
  params: UpdateStoryActionParams,
): Promise<ActionResponse> {
  const parseResult = updateStoryActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { id, update } = parseResult.data;

  try {
    await updateStory({ id, update });
  } catch (err) {
    logger.error("Failed to update story", { id, update, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Story updated", { id });

  updateTag(STORY_CACHE_KEY);
  updateTag(`${STORY_CACHE_KEY}-${id}`);
  return { success: true };
}
