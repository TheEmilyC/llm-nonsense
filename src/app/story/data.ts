"use server";

import { prisma } from "@/lib/prisma";
import { Story } from "../../../generated/client";

export interface CreateStoryParams {
  newStory: {
    personaId: string;
    characterId: string;
    name: string;
  };
}

export async function createStory({ newStory }: CreateStoryParams) {
  const story = await prisma.story.create({
    data: {
      name: newStory.name,
      characterId: newStory.characterId,
      personaId: newStory.personaId,
    },
  });
  return story;
}

export async function getStoryList() {
  const stories = await prisma.story.findMany();
  return stories.map((story) => ({
    id: story.id,
    name: story.name,
  }));
}

export async function getStoryById(id: string) {
  return await prisma.story.findUnique({ where: { id } });
}

export async function getStoryByIdOrFail(id: string) {
  const result = await getStoryById(id);
  if (!result) throw `Story ID:${id} does not exist`;
  return result;
}

export interface UpdateStoryParams {
  id: string;
  update: Partial<
    Pick<Story, "name" | "characterId" | "personaId" | "lorebook">
  >;
}

export async function updateStory({ id, update }: UpdateStoryParams) {
  const orgStory = await getStoryById(id);
  if (!orgStory) throw "Story does not exist";

  const entityUpdate: Partial<Story> = {};
  let updateRequired = false;
  if (update.name !== undefined && update.name !== orgStory.name) {
    entityUpdate.name = update.name;
    updateRequired = true;
  }

  if (
    update.characterId !== undefined &&
    update.characterId !== orgStory.characterId
  ) {
    entityUpdate.characterId = update.characterId;
    updateRequired = true;
  }

  if (
    update.personaId !== undefined &&
    update.personaId !== orgStory.personaId
  ) {
    entityUpdate.personaId = update.personaId;
    updateRequired = true;
  }

  if (update.lorebook !== undefined && update.lorebook !== orgStory.lorebook) {
    entityUpdate.lorebook = update.lorebook;
    updateRequired = true;
  }

  if (updateRequired) {
    return prisma.story.update({
      data: entityUpdate,
      where: { id },
    });
  } else {
    return orgStory;
  }
}

export async function deleteStory(id: string) {
  await prisma.story.delete({ where: { id } });
}
