"use server";

import { redirect } from "next/navigation";

import {
  createPrompt,
  deletePrompt,
  updatePrompt,
} from "@/app/prompt/_lib/data";
import {
  CreatePromptParams,
  PromptDto,
  promptFormSchema,
  PromptFormValues,
  promptFragmentCreateSchema,
  promptFragmentUpdateSchema,
  UpdatePromptActionParams,
  updatePromptActionParamsSchema,
  UpdatePromptParams,
} from "@/app/prompt/_lib/schema";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { logger, parseError } from "@/lib/logger";
import { dbIdValidator } from "@/lib/validators";

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
    promptFragments: rawFragments,
    temperature,
    topK,
    topP,
  } = parseResult.data;
  const newPrompt: CreatePromptParams = {
    maxOutputTokens,
    maxSteps,
    maxTokens,
    name,
    promptFragments: promptFragmentCreateSchema
      .array()
      .parse(rawFragments.map((frag, idx) => ({ ...frag, order: idx }))),
    temperature,
    topK,
    topP,
  };
  let prompt: PromptDto;
  try {
    prompt = await createPrompt(newPrompt);
  } catch (err) {
    logger.error("Failed to create prompt", { data, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Prompt created", { id: prompt.id });
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
    logger.error("Failed to delete prompt", { id, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Prompt deleted", { id });
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
      promptFragments: rawFragments,
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
      promptFragments: promptFragmentUpdateSchema
        .array()
        .parse(rawFragments.map((frag, idx) => ({ ...frag, order: idx }))),
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
  return { success: true };
}
