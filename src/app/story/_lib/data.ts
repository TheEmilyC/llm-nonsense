"use server";

import { STORY_CACHE_KEY } from "@/app/story/_lib/schema";
import { prisma } from "@/lib/prisma";
import { cacheTag, revalidateTag } from "next/cache";
import { Story } from "../../../../generated/client";

export interface CreateStoryParams {
  newStory: Pick<
    Story,
    "personaId" | "characterId" | "name" | "worldId" | "lorebookId"
  >;
}

export async function createStory({ newStory }: CreateStoryParams) {
  const story = await prisma.story.create({
    data: {
      name: newStory.name,
      characterId: newStory.characterId,
      personaId: newStory.personaId,
      worldId: newStory.worldId,
      lorebookId: newStory.lorebookId,
    },
  });
  revalidateTag(STORY_CACHE_KEY, "max");
  return story;
}

export async function getStoryList() {
  "use cache";
  cacheTag(STORY_CACHE_KEY);

  const stories = await prisma.story.findMany();
  return stories.map((story) => ({
    id: story.id,
    name: story.name,
  }));
}

export async function getStoryById(id: string) {
  "use cache";
  cacheTag(`${STORY_CACHE_KEY}-${id}`);

  return await prisma.story.findUnique({ where: { id } });
}

export async function getStoryByIdOrFail(id: string) {
  const result = await getStoryById(id);
  if (!result) throw new Error(`Story ID:${id} does not exist`);
  return result;
}

export interface UpdateStoryParams {
  id: string;
  update: Partial<
    Pick<Story, "name" | "characterId" | "personaId" | "worldId" | "lorebookId">
  >;
}

export async function updateStory({ id, update }: UpdateStoryParams) {
  const orgStory = await getStoryById(id);
  if (!orgStory) throw new Error("Story does not exist");

  const entityUpdate: Partial<Story> = {};
  if (update.name !== undefined && update.name !== orgStory.name)
    entityUpdate.name = update.name;

  if (
    update.characterId !== undefined &&
    update.characterId !== orgStory.characterId
  )
    entityUpdate.characterId = update.characterId;

  if (update.personaId !== undefined && update.personaId !== orgStory.personaId)
    entityUpdate.personaId = update.personaId;

  if (update.worldId !== undefined && update.worldId !== orgStory.worldId)
    entityUpdate.worldId = update.worldId;

  if (
    update.lorebookId !== undefined &&
    update.lorebookId !== orgStory.lorebookId
  )
    entityUpdate.lorebookId = update.lorebookId;

  const story = await prisma.story.update({
    data: entityUpdate,
    where: { id },
  });

  revalidateTag(STORY_CACHE_KEY, "max");
  revalidateTag(`${STORY_CACHE_KEY}-${id}`, "max");
  return story;
}

export async function deleteStory(id: string) {
  await prisma.story.delete({ where: { id } });
  revalidateTag(STORY_CACHE_KEY, "max");
  revalidateTag(`${STORY_CACHE_KEY}-${id}`, "max");
}
