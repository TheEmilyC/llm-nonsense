"use server";

import { getCharacterById } from "@/app/character/_lib/data";
import { getPersonaById } from "@/app/persona/_lib/data";
import { createStory, deleteStory, updateStory } from "@/app/story/_lib/data";
import {
  StoryDto,
  storyFormSchema,
  StoryFormValues,
  toStoryDto,
} from "@/app/story/_lib/schema";
import { getWorldById } from "@/app/world/_lib/data";
import { ActionResponse } from "@/lib/action-utils";
import { HttpStatus } from "@/lib/http";
import { dbIdValidator } from "@/lib/validators";

export async function createStoryAction(
  data: StoryFormValues,
): Promise<ActionResponse<{ newStoryId: string }>> {
  const dataParseResult = storyFormSchema.safeParse(data);
  if (!dataParseResult.success) {
    console.error(dataParseResult.error);
    return { success: false, error: "Malformed story data" };
  }
  const newStory = dataParseResult.data;

  let name: string = "";
  if (!newStory.name) {
    // generate name
    const [character, persona, world] = await Promise.all([
      newStory.characterId ? getCharacterById(newStory.characterId) : null,
      newStory.personaId ? getPersonaById(newStory.personaId) : null,
      newStory.worldId ? getWorldById(newStory.worldId) : null,
    ]);
    if (character) name += character.card.name;
    if (persona) {
      if (name.length > 0) name += " and ";
      name += persona.name;
    }
    if (world) {
      if (name.length > 0) name += " in ";
      name += world.name;
    }
  } else {
    name = newStory.name;
  }

  let story;
  try {
    story = await createStory({
      newStory: {
        ...newStory,
        name,
        worldId: newStory.worldId ?? null,
        lorebookId: newStory.lorebookId ?? null,
      },
    });
    return { success: true, data: { newStoryId: story.id } };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Create story failed" };
  }
}

export async function updateStoryAction(
  storyId: string,
  data: StoryFormValues,
): Promise<ActionResponse<StoryDto>> {
  const formParseResult = storyFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(formParseResult.error);
    return { success: false, error: "Malformed story data" };
  }
  const idParseResult = dbIdValidator.safeParse(storyId);
  if (!idParseResult.success) {
    console.error(idParseResult.error);
    return { success: false, error: "Malformed story data" };
  }
  const id = idParseResult.data;
  const { ...update } = formParseResult.data;

  let updatedStory;
  try {
    updatedStory = await updateStory({ id, update });
  } catch (err) {
    console.error(err);
    return { success: false, error: "Story update failed" };
  }

  return { success: true, data: toStoryDto(updatedStory) };
}

export async function deleteStoryAction(
  storyId: string,
): Promise<ActionResponse<null>> {
  const idParseResult = dbIdValidator.safeParse(storyId);
  if (!idParseResult.success) {
    return { success: false, error: "not found", status: HttpStatus.NOT_FOUND };
  }
  const id = idParseResult.data;

  try {
    await deleteStory(id);
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to delete story" };
  }
  return { success: true, data: null };
}
