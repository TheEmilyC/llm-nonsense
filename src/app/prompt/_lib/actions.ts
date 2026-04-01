"use server";

import { buildPrompt } from "@/app/chat/_lib/service";
import { getLorebookById } from "@/app/lorebook/_lib/data";
import {
  promptInspectorFormSchema,
  PromptInspectorFormValues,
} from "@/app/prompt/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";

export async function checkPromptAction(
  data: PromptInspectorFormValues,
): Promise<
  ActionResponse<{
    prompt: string;
    lorebookEntries?: { path: string; title?: string }[];
  }>
> {
  const parseResult = promptInspectorFormSchema.safeParse(data);

  if (!parseResult.success) {
    console.error(parseResult.error);
    return { success: false, error: "Malformed prompt" };
  }
  const { message } = parseResult.data;
  const lorebook = await getLorebookById("cmnffihst0000tj2wj3kq7nfx"); // TODO: remove hardcoding
  const { prompt: promptRaw, lorebookEntries } = await buildPrompt({
    lastMessage: message,
    character: {
      name: "Test Character",
      description: "Test Character Description",
      personality: "Character Personality",
      scenario: "Character Scenario",
    },
    persona: {
      name: "Test Persona",
      description: "Test Persona Description",
    },
    world: {
      name: "Test World",
      description: "Test World Description",
    },
    lorebook,
  });
  const prompt = JSON.stringify(promptRaw, null, 2).replace(/\\n/g, "\n");

  return { success: true, data: { prompt, lorebookEntries } };
}
