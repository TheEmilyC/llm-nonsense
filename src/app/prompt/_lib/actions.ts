"use server";

import { notFound } from "next/navigation";

import { buildPrompt } from "@/app/chat/_lib/service";
import { getLorebookById } from "@/app/lorebook/_lib/data";
import { LorebookStatus } from "@/app/lorebook/_lib/schema";
import {
  createPrompt,
  deletePrompt,
  updatePrompt,
} from "@/app/prompt/_lib/data";
import {
  CreatePromptParams,
  promptFormSchema,
  PromptFormValues,
  promptFragmentCreateSchema,
  promptFragmentUpdateSchema,
  promptInspectorFormSchema,
  PromptInspectorFormValues,
  UpdatePromptParams,
} from "@/app/prompt/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";
import { dbIdValidator } from "@/lib/validators";

export async function checkPromptAction(
  data: PromptInspectorFormValues,
): Promise<
  ActionResponse<{
    lorebookEntries?: { path: string; title?: string }[];
    prompt: string;
  }>
> {
  const parseResult = promptInspectorFormSchema.safeParse(data);

  if (!parseResult.success) {
    console.error(parseResult.error);
    return { error: "Malformed prompt", success: false };
  }
  const { message } = parseResult.data;
  const lorebook = await getLorebookById("cmnmfyl1y0008rt2wxsraodda"); // TODO: remove hardcoding
  const { lorebookEntries, prompt: promptRaw } = await buildPrompt({
    character: {
      description: "Test Character Description",
      name: "Test Character",
      personality: "Character Personality",
      scenario: "Character Scenario",
    },
    lastMessage: message,
    lorebook: lorebook.status === LorebookStatus.Ready ? lorebook : undefined,
    persona: {
      description: "Test Persona Description",
      name: "Test Persona",
    },
    world: {
      description: "Test World Description",
      name: "Test World",
    },
  });
  const prompt = JSON.stringify(promptRaw, null, 2).replace(/\\n/g, "\n");

  return { data: { lorebookEntries, prompt }, success: true };
}

export async function createPromptAction(
  data: PromptFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const parseResult = promptFormSchema.safeParse(data);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { error: "Malformed prompt data", success: false };
  }
  const { name, promptFragments: rawFragments } = parseResult.data;
  const newPrompt: CreatePromptParams = {
    name: name,
    promptFragments: promptFragmentCreateSchema
      .array()
      .parse(rawFragments.map((frag, idx) => ({ ...frag, order: idx }))),
  };
  try {
    const prompt = await createPrompt(newPrompt);
    return { data: { id: prompt.id }, success: true };
  } catch (err) {
    console.error(err);
    return { error: "Prompt create failed", success: false };
  }
}

export async function deletePromptAction(
  promptId: string,
): Promise<ActionResponse<null>> {
  const idParseResult = dbIdValidator.safeParse(promptId);
  if (!idParseResult.success) {
    notFound();
  }
  try {
    await deletePrompt(idParseResult.data);
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete prompt", success: false };
  }
  return { data: null, success: true };
}

export async function updatePromptAction(
  promptId: string,
  data: PromptFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const idParseResult = dbIdValidator.safeParse(promptId);
  if (!idParseResult.success) {
    console.error(idParseResult.error);
    return { error: "Malformed prompt id", success: false };
  }
  const id = idParseResult.data;
  const parseResult = promptFormSchema.safeParse(data);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { error: "Malformed prompt data", success: false };
  }
  const { name, promptFragments: rawFragments } = parseResult.data;

  const updateData: UpdatePromptParams = {
    id,
    update: {
      name,
      promptFragments: promptFragmentUpdateSchema
        .array()
        .parse(rawFragments.map((frag, idx) => ({ ...frag, order: idx }))),
    },
  };
  try {
    const updated = await updatePrompt(updateData);
    return { data: { id: updated.id }, success: true };
  } catch (err) {
    console.error(err);
    return { error: "Prompt update failed", success: false };
  }
}
