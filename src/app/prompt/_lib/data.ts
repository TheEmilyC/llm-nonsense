"use server";

import { cacheTag, revalidateTag } from "next/cache";

import {
  CreatePromptParams,
  PROMPT_CACHE_KEY,
  PromptDto,
  promptDtoSchema,
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
}: CreatePromptParams): Promise<PromptDto> {
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
    include: { promptFragments: { orderBy: { order: "asc" } } },
  });
  const promptDto = toPromptDto(prompt);
  revalidateTag(PROMPT_CACHE_KEY, "max");
  return promptDto;
}

export async function deletePrompt(id: string): Promise<void> {
  await prisma.prompt.delete({ where: { id } });
  revalidateTag(PROMPT_CACHE_KEY, "max");
  revalidateTag(`${PROMPT_CACHE_KEY}-${id}`, "max");
}

export async function getPromptById(id: string): Promise<null | PromptDto> {
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

export async function getPromptByIdOrFail(id: string): Promise<PromptDto> {
  const prompt = await getPromptById(id);
  if (!prompt) throw new Error(`Prompt ID:${id} does not exist`);
  return prompt;
}

export async function getPromptList(): Promise<PromptListItemDto[]> {
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
}: UpdatePromptParams): Promise<PromptDto> {
  const result = await prisma.prompt.update({
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
  revalidateTag(PROMPT_CACHE_KEY, "max");
  revalidateTag(`${PROMPT_CACHE_KEY}-${id}`, "max");
  return toPromptDto(result);
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
