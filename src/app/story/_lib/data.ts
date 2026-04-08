"use server";

import { cacheTag, revalidateTag } from "next/cache";

import {
  CreateStoryParams,
  STORY_CACHE_KEY,
  StoryDto,
  storyDtoSchema,
  StoryListItemDto,
  storyListItemDtoSchema,
  UpdateStoryParams,
} from "@/app/story/_lib/schema";
import { Story } from "@/generated/client";
import { prisma } from "@/lib/prisma";

export async function createStory(
  newStory: CreateStoryParams,
): Promise<StoryDto> {
  const story = await prisma.story.create({
    data: newStory,
  });
  revalidateTag(STORY_CACHE_KEY, "max");
  return toStoryDto(story);
}

export async function deleteStory(id: string) {
  await prisma.story.delete({ where: { id } });
  revalidateTag(STORY_CACHE_KEY, "max");
  revalidateTag(`${STORY_CACHE_KEY}-${id}`, "max");
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

  const stories = await prisma.story.findMany();
  return toStoryListDto(stories);
}

export async function updateStory({
  id,
  update,
}: UpdateStoryParams): Promise<StoryDto> {
  const story = await prisma.story.update({
    data: update,
    where: { id },
  });

  revalidateTag(STORY_CACHE_KEY, "max");
  revalidateTag(`${STORY_CACHE_KEY}-${id}`, "max");
  return toStoryDto(story);
}

function toStoryDto(story: Story): StoryDto {
  return storyDtoSchema.parse({
    ...story,
    lorebookId: story.lorebookId ?? undefined,
    worldId: story.worldId ?? undefined,
  });
}

function toStoryListDto(stories: Story[]): StoryListItemDto[] {
  return storyListItemDtoSchema.array().parse(stories);
}
