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
import {
  Prisma,
  Prompt,
  PromptFragment,
  PromptRegex,
  PromptRegexLink,
} from "@/generated/client";
import { AppError } from "@/lib/error";
import { prisma, PrismaErrorCodes } from "@/lib/prisma";

type PromptDtoRaw = Prompt & {
  promptFragments: PromptFragment[];
  promptRegexes: (PromptRegexLink & { promptRegex: PromptRegex })[];
};

export async function createPrompt({
  maxOutputTokens,
  maxSteps,
  maxTokens,
  name,
  prefetch,
  promptFragments,
  promptRegexes,
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
      prefetch,
      promptFragments: promptFragments
        ? {
            createMany: {
              data: promptFragments.map((f, index) => ({
                ...f,
                order: index + 1,
              })),
            },
          }
        : undefined,
      promptRegexes: promptRegexes
        ? {
            create: promptRegexes.map(
              ({ enabled, isShared, name, pattern, target }, index) => ({
                enabled,
                order: index + 1,
                promptRegex: { create: { isShared, name, pattern, target } },
              }),
            ),
          }
        : undefined,
      temperature,
      topK,
      topP,
    },
  });
  return prompt;
}

export async function deletePrompt(id: string) {
  try {
    await prisma.prompt.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === PrismaErrorCodes.ForeignKeyConstraint
    ) {
      throw new AppError(err.message, "CONSTRAINT_ERROR", 2003);
    }
    throw err;
  }
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
    include: {
      promptFragments: { orderBy: { order: "asc" } },
      promptRegexes: {
        include: { promptRegex: true },
        orderBy: { order: "asc" },
      },
    },
    where: { id },
  });
  if (!prompt) return null;

  return toPromptDto(prompt);
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
  return prisma.$transaction(async (tx) => {
    if (update.promptRegexes !== undefined) {
      // Remove un-used unshared regex
      const incomingIds = update.promptRegexes
        .map((r) => r.id)
        .filter((rid): rid is string => rid !== undefined);

      const toDelete = await tx.promptRegexLink.findMany({
        select: { promptRegexId: true },
        where: {
          promptId: id,
          promptRegex: { isShared: false },
          promptRegexId: { notIn: incomingIds },
        },
      });

      if (toDelete.length > 0) {
        await tx.promptRegex.deleteMany({
          where: { id: { in: toDelete.map((r) => r.promptRegexId) } },
        });
      }
    }

    return tx.prompt.update({
      data: {
        maxOutputTokens: update.maxOutputTokens,
        maxSteps: update.maxSteps,
        maxTokens: update.maxTokens,
        name: update.name,
        prefetch: update.prefetch,
        promptFragments: update.promptFragments
          ? {
              deleteMany: {
                id: {
                  notIn: update.promptFragments
                    .map((f) => f.id)
                    .filter((fid): fid is string => fid !== undefined),
                },
              },
              upsert: update.promptFragments.map(
                ({ id: fid, ...data }, index) => ({
                  create: { ...data, order: index + 1 },
                  update: { ...data, order: index + 1 },
                  where: { id: fid ?? "" },
                }),
              ),
            }
          : undefined,
        promptRegexes: update.promptRegexes
          ? {
              deleteMany: {
                promptRegexId: {
                  notIn: update.promptRegexes
                    .map((r) => r.id)
                    .filter((rid): rid is string => rid !== undefined),
                },
              },
              upsert: update.promptRegexes.map(
                ({ id: rid, ...data }, index) => ({
                  create: {
                    enabled: data.enabled,
                    order: index + 1,
                    promptRegex: {
                      create: {
                        isShared: false,
                        name: data.name,
                        pattern: data.pattern,
                        target: data.target,
                      },
                    },
                  },
                  update: {
                    enabled: data.enabled,
                    order: index + 1,
                    promptRegex: {
                      update: {
                        name: data.name,
                        pattern: data.pattern,
                        target: data.target,
                      },
                    },
                  },
                  where: {
                    promptId_promptRegexId: {
                      promptId: id,
                      promptRegexId: rid ?? "",
                    },
                  },
                }),
              ),
            }
          : undefined,
        temperature: update.temperature,
        topK: update.topK,
        topP: update.topP,
      },
      include: { promptFragments: { orderBy: { order: "asc" } } },
      where: { id },
    });
  });
}

function toPromptDto(prompt: PromptDtoRaw): PromptDto {
  return promptDtoSchema.parse({
    ...prompt,
    promptRegexes: prompt.promptRegexes.map(
      (link: PromptRegexLink & { promptRegex: PromptRegex }) => ({
        enabled: link.enabled,
        id: link.promptRegex.id,
        isShared: link.promptRegex.isShared,
        linkId: link.id,
        name: link.promptRegex.name,
        order: link.order,
        pattern: link.promptRegex.pattern,
        promptId: link.promptId,
        target: link.promptRegex.target,
      }),
    ),
  });
}

function toPromptListDto(
  list: Pick<Prompt, "createdAt" | "id" | "name">[],
): PromptListItemDto[] {
  return list.map(({ createdAt, id, name }) => ({ createdAt, id, name }));
}
