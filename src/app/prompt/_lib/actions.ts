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
  promptFormSchema,
  PromptFormValues,
  promptInspectorFormSchema,
  PromptInspectorFormValues,
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
  try {
    const newPrompt = await createPrompt({ name: parseResult.data.name });
    return { data: { id: newPrompt.id }, success: true };
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
  const parseResult = promptFormSchema.safeParse(data);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { error: "Malformed prompt data", success: false };
  }
  try {
    const updated = await updatePrompt({
      id: idParseResult.data,
      update: { name: parseResult.data.name },
    });
    return { data: { id: updated.id }, success: true };
  } catch (err) {
    console.error(err);
    return { error: "Prompt update failed", success: false };
  }
}
