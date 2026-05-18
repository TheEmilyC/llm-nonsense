"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { dbIdValidator } from "@/app/_shared/schema";
import {
  createPrompt,
  deletePrompt,
  getPromptDto,
  updatePrompt,
} from "@/app/prompt/_lib/data";
import {
  CreatePromptParams,
  PROMPT_CACHE_KEY,
  PromptEntity,
  promptFormSchema,
  PromptFormValues,
  promptFragmentCreateSchema,
  promptFragmentUpdateSchema,
  promptRegexCreateSchema,
  promptRegexUpdateSchema,
  UpdatePromptActionParams,
  updatePromptActionParamsSchema,
  UpdatePromptParams,
} from "@/app/prompt/_lib/schema";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { AppError } from "@/lib/error";
import { logger, parseError } from "@/lib/logger";

export async function copyPromptAction(
  promptId: string,
): Promise<ActionResponse> {
  const idParseResult = dbIdValidator.safeParse(promptId);
  if (!idParseResult.success) {
    return toActionResponseError(idParseResult.error);
  }
  const id = idParseResult.data;

  const source = await getPromptDto(id);
  if (!source) {
    return toActionResponseError(new Error("Prompt not found"));
  }

  const newPrompt: CreatePromptParams = {
    maxOutputTokens: source.maxOutputTokens,
    maxSteps: source.maxSteps,
    maxTokens: source.maxTokens,
    name: `Copy of ${source.name}`,
    prefetch: source.prefetch,
    promptFragments: promptFragmentCreateSchema
      .array()
      .parse(source.promptFragments),
    promptRegexes: promptRegexCreateSchema.array().parse(source.promptRegexes),
    temperature: source.temperature,
    topK: source.topK,
    topP: source.topP,
  };

  let prompt: PromptEntity;
  try {
    prompt = await createPrompt(newPrompt);
  } catch (err) {
    logger.error("Failed to copy prompt", { id, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Prompt copied", { newId: prompt.id, sourceId: id });

  updateTag(PROMPT_CACHE_KEY);
  redirect(`/prompt/${prompt.id}`);
}

export async function createPromptAction(
  data: PromptFormValues,
): Promise<ActionResponse> {
  const parseResult = promptFormSchema.safeParse(data);
  if (!parseResult.success) {
    return toActionResponseError(parseResult.error);
  }
  const {
    maxOutputTokens,
    maxSteps,
    maxTokens,
    name,
    prefetch,
    promptFragments: rawFragments,
    promptRegexes: rawRegexes,
    temperature,
    topK,
    topP,
  } = parseResult.data;
  const newPrompt: CreatePromptParams = {
    maxOutputTokens,
    maxSteps,
    maxTokens,
    name,
    prefetch,
    promptFragments: promptFragmentCreateSchema.array().parse(rawFragments),
    promptRegexes: promptRegexCreateSchema.array().parse(rawRegexes),
    temperature,
    topK,
    topP,
  };
  let prompt: PromptEntity;
  try {
    prompt = await createPrompt(newPrompt);
  } catch (err) {
    logger.error("Failed to create prompt", { data, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Prompt created", { id: prompt.id });

  updateTag(PROMPT_CACHE_KEY);
  redirect(`/prompt/${prompt.id}`);
}

export async function deletePromptAction(
  promptId: string,
): Promise<ActionResponse> {
  const idParseResult = dbIdValidator.safeParse(promptId);
  if (!idParseResult.success) {
    return toActionResponseError(idParseResult.error);
  }
  const id = idParseResult.data;
  try {
    await deletePrompt(id);
  } catch (err) {
    if (err instanceof AppError && err.code === "CONSTRAINT_ERROR") {
      return {
        error: {
          code: err.code,
          message: "Stories still use this prompt, can't delete",
        },
        success: false,
      };
    }

    logger.error("Failed to delete prompt", { id, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Prompt deleted", { id });

  updateTag(PROMPT_CACHE_KEY);
  updateTag(`${PROMPT_CACHE_KEY}-${id}`);
  redirect("/prompt");
}

export async function updatePromptAction(
  params: UpdatePromptActionParams,
): Promise<ActionResponse> {
  const parseResult = updatePromptActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const {
    id,
    update: {
      maxOutputTokens,
      maxSteps,
      maxTokens,
      name,
      prefetch,
      promptFragments: rawFragments,
      promptRegexes: rawRegexes,
      temperature,
      topK,
      topP,
    },
  } = parseResult.data;

  const updateData: UpdatePromptParams = {
    id,
    update: {
      maxOutputTokens,
      maxSteps,
      maxTokens,
      name,
      prefetch,
      promptFragments: promptFragmentUpdateSchema.array().parse(rawFragments),
      promptRegexes: promptRegexUpdateSchema.array().parse(rawRegexes),
      temperature,
      topK,
      topP,
    },
  };

  try {
    await updatePrompt(updateData);
  } catch (err) {
    logger.error("Failed to update prompt", {
      data: parseResult.data,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
  logger.info("Prompt updated", { id });

  updateTag(PROMPT_CACHE_KEY);
  updateTag(`${PROMPT_CACHE_KEY}-${id}`);
  return { success: true };
}
