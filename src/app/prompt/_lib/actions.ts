"use server";

import { buildPrompt } from "@/app/chat/_lib/service";
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
    world:{
      name: "Test World",
      description: "Test World Description"
    },
    lorebookName: "heimskra",
  });
  const prompt = JSON.stringify(promptRaw, null, 2).replace(/\\n/g, "\n");

  return { success: true, data: { prompt, lorebookEntries } };
}
