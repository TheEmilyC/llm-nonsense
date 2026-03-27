"use server";

import { buildPrompt } from "@/app/chat/_lib/service";
import {
  promptInspectorFormSchema,
  PromptInspectorFormValues,
} from "@/app/prompt/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";

export async function checkPromptAction(
  data: PromptInspectorFormValues,
): Promise<ActionResponse<{ prompt: string }>> {
  const parseResult = promptInspectorFormSchema.safeParse(data);

  if (!parseResult.success) {
    console.error(parseResult.error);
    return { success: false, error: "Malformed prompt" };
  }
  const { message } = parseResult.data;
  const prompt = JSON.stringify(
    await buildPrompt({
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
      lorebookName: "heimskra",
    }),
    null,
    2,
  );

  return { success: true, data: { prompt } };
}
