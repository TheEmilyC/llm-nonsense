"use server";

import { cacheTag, updateTag } from "next/cache";

import {
  STORY_CACHE_KEY,
  StoryDto,
  StoryListItemDto,
} from "@/app/story/_lib/schema";
import { Story } from "@/generated/client";
import { prisma } from "@/lib/prisma";

type CreateStoryParams = Pick<
  Story,
  "characterId" | "name" | "personaId" | "promptId"
> & { lorebookId?: string; worldId?: string };

interface UpdateStoryParams {
  id: string;
  update: Partial<
    Pick<
      Story,
      | "characterId"
      | "lorebookId"
      | "name"
      | "personaId"
      | "promptId"
      | "worldId"
    >
  >;
}

export async function createStory(
  newStory: CreateStoryParams,
): Promise<StoryDto> {
  const story = await prisma.story.create({
    data: {
      characterId: newStory.characterId,
      lorebookId: newStory.lorebookId,
      name: newStory.name,
      personaId: newStory.personaId,
      promptId: newStory.promptId,
      worldId: newStory.worldId,
    },
  });
  updateTag(STORY_CACHE_KEY);
  return toStoryDto(story);
}

export async function deleteStory(id: string) {
  await prisma.story.delete({ where: { id } });
  updateTag(STORY_CACHE_KEY);
  updateTag(`${STORY_CACHE_KEY}-${id}`);
}

export async function getStoryById(id: string): Promise<null | StoryDto> {
  "use cache";
  cacheTag(`${STORY_CACHE_KEY}-${id}`);
  const result = await prisma.story.findUnique({ where: { id } });
  if (!result) return null;
  return toStoryDto(result);
}

export async function getStoryByIdOrFail(id: string): Promise<StoryDto> {
  const result = await getStoryById(id);
  if (!result) throw new Error(`Story ID:${id} does not exist`);
  return result;
}

export async function getStoryList(): Promise<StoryListItemDto[]> {
  "use cache";
  cacheTag(STORY_CACHE_KEY);

  const stories = await prisma.story.findMany({
    select: { id: true, name: true },
  });
  return toStoryListDto(stories);
}

export async function updateStory({
  id,
  update,
}: UpdateStoryParams): Promise<StoryDto> {
  const story = await prisma.story.update({
    data: {
      characterId: update.characterId,
      lorebookId: update.lorebookId,
      name: update.name,
      personaId: update.personaId,
      promptId: update.promptId,
      worldId: update.worldId,
    },
    where: { id },
  });

  updateTag(STORY_CACHE_KEY);
  updateTag(`${STORY_CACHE_KEY}-${id}`);
  return toStoryDto(story);
}

function toStoryDto(story: Story): StoryDto {
  return {
    characterId: story.characterId,
    id: story.id,
    lorebookId: story.lorebookId ?? undefined,
    name: story.name,
    personaId: story.personaId,
    promptId: story.promptId,
    worldId: story.worldId ?? undefined,
  };
}

function toStoryListDto(
  stories: Pick<Story, "id" | "name">[],
): StoryListItemDto[] {
  return stories.map(({ id, name }) => ({ id, name }));
}
