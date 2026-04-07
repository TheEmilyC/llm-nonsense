"use server";

import { cacheTag, revalidateTag } from "next/cache";

import {
  CreatePromptParams,
  PROMPT_CACHE_KEY,
  PromptDto,
  promptDtoSchema,
  PromptFragmentType,
  PromptListItemDto,
  promptListItemDtoSchema,
  UpdatePromptParams,
} from "@/app/prompt/_lib/schema";
import { prisma } from "@/lib/prisma";

import { Prompt, PromptFragment } from "../../../../generated/client";

export async function createPrompt({
  name,
  promptFragments,
}: CreatePromptParams): Promise<PromptDto> {
  const prompt = await prisma.prompt.create({
    data: {
      name,
      promptFragments: promptFragments
        ? {
            createMany: {
              data: promptFragments,
            },
          }
        : undefined,
    },
    include: { promptFragments: { orderBy: { order: "asc" } } },
  });
  const promptDto = toDto(prompt);
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

  const promptDto = toDto(prompt);
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

  const listDto = toListDto(promptList);

  return listDto;
}

export async function updatePrompt({
  id,
  update,
}: UpdatePromptParams): Promise<PromptDto> {
  const result = await prisma.prompt.update({
    data: {
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
    },
    include: { promptFragments: { orderBy: { order: "asc" } } },
    where: { id },
  });
  revalidateTag(PROMPT_CACHE_KEY, "max");
  revalidateTag(`${PROMPT_CACHE_KEY}-${id}`, "max");
  return toDto(result);
}

function toDto(
  prompt: Prompt & { promptFragments: PromptFragment[] },
): PromptDto {
  return promptDtoSchema.parse({
    ...prompt,
    promptFragments: prompt.promptFragments.map((frag) => ({
      ...frag,
      type: frag.injectTag
        ? PromptFragmentType.inject
        : PromptFragmentType.content,
    })),
  });
}

function toListDto(
  list: Pick<Prompt, "createdAt" | "id" | "name">[],
): PromptListItemDto[] {
  return promptListItemDtoSchema.array().parse(list);
}
