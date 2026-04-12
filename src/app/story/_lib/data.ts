"use server";

import { cacheTag } from "next/cache";

import {
  STORY_CACHE_KEY,
  StoryDto,
  StoryEntity,
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
): Promise<StoryEntity> {
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
  return toStoryEntity(story);
}

export async function deleteStory(id: string) {
  await prisma.story.delete({ where: { id } });
}

export async function getStoryById(id: string): Promise<null | StoryEntity> {
  "use cache";
  cacheTag(`${STORY_CACHE_KEY}-${id}`);
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) return null;
  return toStoryEntity(story);
}

export async function getStoryDto(id: string): Promise<null | StoryDto> {
  const result = await getStoryById(id);
  if (!result) return null;
  return toStoryDto(result);
}

export async function getStoryListDto(): Promise<StoryListItemDto[]> {
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
}: UpdateStoryParams): Promise<StoryEntity> {
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

  return toStoryEntity(story);
}

function toStoryDto(story: StoryEntity): StoryDto {
  return {
    characterId: story.characterId,
    id: story.id,
    lorebookId: story.lorebookId,
    name: story.name,
    personaId: story.personaId,
    promptId: story.promptId,
    worldId: story.worldId,
  };
}

function toStoryEntity(story: Story): StoryEntity {
  return {
    ...story,
    lorebookId: story.lorebookId ?? undefined,
    worldId: story.worldId ?? undefined,
  };
}

function toStoryListDto(
  stories: Pick<Story, "id" | "name">[],
): StoryListItemDto[] {
  return stories.map(({ id, name }) => ({ id, name }));
}
