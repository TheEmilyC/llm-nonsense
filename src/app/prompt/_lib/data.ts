"use server";

import { cacheTag, revalidateTag } from "next/cache";

import {
  PROMPT_CACHE_KEY,
  PromptDto,
  promptDtoSchema,
  PromptListItemDto,
  promptListItemDtoSchema,
} from "@/app/prompt/_lib/schema";
import { prisma } from "@/lib/prisma";

import { Prompt, PromptFragment } from "../../../../generated/client";

export type CreatePromptParams = Pick<Prompt, "name"> & {
  promptFragments?: Pick<
    PromptFragment,
    "content" | "enabled" | "injectTag" | "name" | "order" | "role"
  >[];
};

export interface UpdatePromptParams {
  id: string;
  update: Partial<Pick<Prompt, "name">> & {
    promptFragments?: (Pick<
      PromptFragment,
      "content" | "enabled" | "injectTag" | "name" | "order" | "role"
    > & { id?: string })[];
  };
}

export async function createPrompt({
  name,
  promptFragments,
}: CreatePromptParams): Promise<PromptDto> {
  const newPrompt = await prisma.prompt.create({
    data: {
      name,
      promptFragments: promptFragments
        ? {
            createMany: {
              data: promptFragments?.map((frag) => ({
                content: frag.content,
                enabled: frag.enabled,
                injectTag: frag.injectTag,
                name: frag.name,
                order: frag.order,
                role: frag.role,
              })),
            },
          }
        : undefined,
    },
  });
  const promptDto = promptDtoSchema.parse(newPrompt);
  revalidateTag(PROMPT_CACHE_KEY, "max");
  return promptDto;
}

export async function deletePrompt(id: string): Promise<void> {
  prisma.prompt.delete({ where: { id } });
}

export async function getPromptById(id: string): Promise<null | PromptDto> {
  "use cache";
  cacheTag(`${PROMPT_CACHE_KEY}-${id}`);

  const prompt = await prisma.prompt.findUnique({
    include: { promptFragments: { orderBy: { order: "asc" } } },
    where: { id },
  });
  if (!prompt) return null;

  const promptDto = promptDtoSchema.parse(prompt);
  return promptDto;
}

export async function getPromptByIdOrFail(id: string) {
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

  const listDto = promptListItemDtoSchema.array().parse(promptList);

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
            upsert: update.promptFragments.map((frag) => ({
              create: {
                content: frag.content,
                enabled: frag.enabled,
                injectTag: frag.injectTag,
                name: frag.name,
                order: frag.order,
                role: frag.role,
              },
              update: {
                content: frag.content,
                enabled: frag.enabled,
                injectTag: frag.injectTag,
                name: frag.name,
                order: frag.order,
                role: frag.role,
              },
              where: { id: frag.id ?? "" },
            })),
          }
        : undefined,
    },
    include: { promptFragments: { orderBy: { order: "asc" } } },
    where: { id },
  });
  revalidateTag(PROMPT_CACHE_KEY, "max");
  revalidateTag(`${PROMPT_CACHE_KEY}-${id}`, "max");
  return promptDtoSchema.parse(result);
}
