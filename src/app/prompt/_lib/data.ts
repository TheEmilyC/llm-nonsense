"use server";

import { cacheTag } from "next/cache";

import {
  CreatePromptParams,
  PROMPT_CACHE_KEY,
  PromptDto,
  promptDtoSchema,
  PromptEntity,
  PromptListItemDto,
  UpdatePromptParams,
} from "@/app/prompt/_lib/schema";
import { Prompt, PromptFragment } from "@/generated/client";
import { prisma } from "@/lib/prisma";

export async function createPrompt({
  maxOutputTokens,
  maxSteps,
  maxTokens,
  name,
  promptFragments,
  temperature,
  topK,
  topP,
}: CreatePromptParams): Promise<PromptEntity> {
  const prompt = await prisma.prompt.create({
    data: {
      maxOutputTokens,
      maxSteps,
      maxTokens,
      name,
      promptFragments: promptFragments
        ? {
            createMany: {
              data: promptFragments,
            },
          }
        : undefined,
      temperature,
      topK,
      topP,
    },
  });
  return { ...prompt, maxOutputTokens: prompt.maxOutputTokens ?? undefined };
}

export async function deletePrompt(id: string) {
  await prisma.prompt.delete({ where: { id } });
}

export async function getPromptById(id: string): Promise<PromptEntity> {
  "use cache";
  cacheTag(`${PROMPT_CACHE_KEY}-${id}`);

  const prompt = await prisma.prompt.findUnique({ where: { id } });
  if (!prompt) throw new Error(`Prompt ID:${id} does not exist`);
  return prompt;
}

export async function getPromptDto(id: string): Promise<null | PromptDto> {
  "use cache";
  cacheTag(`${PROMPT_CACHE_KEY}-${id}`);

  const prompt = await prisma.prompt.findUnique({
    include: { promptFragments: { orderBy: { order: "asc" } } },
    where: { id },
  });
  if (!prompt) return null;

  const promptDto = toPromptDto(prompt);
  return promptDto;
}

export async function getPromptListDto(): Promise<PromptListItemDto[]> {
  "use cache";
  cacheTag(PROMPT_CACHE_KEY);
  const promptList = await prisma.prompt.findMany({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, id: true, name: true },
  });

  const listDto = toPromptListDto(promptList);

  return listDto;
}

export async function updatePrompt({
  id,
  update,
}: UpdatePromptParams): Promise<Prompt> {
  const prompt = await prisma.prompt.update({
    data: {
      maxOutputTokens: update.maxOutputTokens,
      maxSteps: update.maxSteps,
      maxTokens: update.maxTokens,
      name: update.name,
      promptFragments: update.promptFragments
        ? {
            deleteMany: {
              id: {
                notIn: update.promptFragments
                  .map((f) => f.id)
                  .filter((id): id is string => id !== undefined),
              },
            },
            upsert: update.promptFragments.map(({ id, ...data }) => ({
              create: data,
              update: data,
              where: { id: id ?? "" },
            })),
          }
        : undefined,
      temperature: update.temperature,
      topK: update.topK,
      topP: update.topP,
    },
    include: { promptFragments: { orderBy: { order: "asc" } } },
    where: { id },
  });
  return prompt;
}

function toPromptDto(
  prompt: Prompt & { promptFragments: PromptFragment[] },
): PromptDto {
  return promptDtoSchema.parse(prompt);
}

function toPromptListDto(
  list: Pick<Prompt, "createdAt" | "id" | "name">[],
): PromptListItemDto[] {
  return list.map(({ createdAt, id, name }) => ({ createdAt, id, name }));
}
