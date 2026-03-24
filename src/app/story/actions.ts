"use server";

import { getCharacterById } from "@/app/character/data";
import { getPersonaById } from "@/app/persona/data";
import { createStory, deleteStory, updateStory } from "@/app/story/data";
import { storyFormSchema, StoryFormValues } from "@/app/story/schema";
import { ActionResponse } from "@/lib/action-utils";
import { dbIdValidator } from "@/lib/validators";
import { refresh } from "next/cache";
import { notFound, redirect } from "next/navigation";

export async function createStoryAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<null>> {
  const formParseResult = storyFormSchema.safeParse({
    mode: formData.get("mode"),
    name: formData.get("name"),
    characterId: formData.get("characterId"),
    personaId: formData.get("personaId"),
  } as StoryFormValues);
  if (!formParseResult.success) {
    console.error(formParseResult.error);
    return { success: false, message: "Malformed story data" };
  }
  const newStory = formParseResult.data;

  let name: string = "";
  if (!newStory.name) {
    // generate name
    const [character, persona, world] = await Promise.all([
      newStory.characterId ? getCharacterById(newStory.characterId) : null,
      newStory.personaId ? getPersonaById(newStory.personaId) : null,
      newStory.worldId ? { name: "worldtest" } : null, // TODO: Implement with worlds
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
    story = await createStory({ newStory: { ...newStory, name } });
  } catch (err) {
    console.error(err);
    return { success: false, message: "Create story failed" };
  }
  redirect(`/story/${story.id}`);
}

export async function updateStoryAction(
  storyId: string,
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<null>> {
  const formParseResult = storyFormSchema.safeParse({
    mode: formData.get("mode"),
    name: formData.get("name"),
    characterId: formData.get("characterId"),
    personaId: formData.get("personaId"),
    worldId: formData.get("worldId") ?? undefined,
    assignedLorebook: formData.get("assignedLorebook") ?? undefined,
  });
  if (!formParseResult.success) {
    console.error(formParseResult.error);
    return { success: false, message: "Malformed story data" };
  }
  const idParseResult = dbIdValidator.safeParse(storyId);
  if (!idParseResult.success) {
    console.error(idParseResult.error);
    return { success: false, message: "Malformed persona data" };
  }
  const id = idParseResult.data;
  const { ...update } = formParseResult.data;

  try {
    await updateStory({ id, update });
  } catch (err) {
    console.error(err);
    return { success: false, message: "Story update failed" };
  }
  refresh();
  return { success: true, data: null };
}

export async function deleteStoryAction(
  prevState: unknown,
  storyId: string,
): Promise<ActionResponse<null>> {
  const idParseResult = dbIdValidator.safeParse(storyId);
  if (!idParseResult.success) {
    notFound();
  }
  const id = idParseResult.data;

  try {
    await deleteStory(id);
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to delete story" };
  }
  redirect("/story");
}
