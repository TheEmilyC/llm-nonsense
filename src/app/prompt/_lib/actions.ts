"use server";

import { buildPrompt } from "@/app/chat/_lib/service";
import { getLorebookById } from "@/app/lorebook/_lib/data";
import { LorebookStatus } from "@/app/lorebook/_lib/schema";
import {
  promptInspectorFormSchema,
  PromptInspectorFormValues,
} from "@/app/prompt/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";

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
