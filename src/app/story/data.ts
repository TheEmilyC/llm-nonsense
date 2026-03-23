"use server";

import { prisma } from "@/lib/prisma";
import { Story } from "../../../generated/client";

export interface CreateStoryParams {
  newStory: {
    personaId?: string;
    characterId?: string;
    name: string;
  };
}

export async function createStory({ newStory }: CreateStoryParams) {
  const story = prisma.story.create({
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

export interface UpdateStoryParams {
  id: string;
  update: {
    name?: string;
    characterId?: string;
    personaId?: string;
  };
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
