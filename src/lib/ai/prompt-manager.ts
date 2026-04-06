import fs from "fs/promises";
import path, { join } from "path";

import { PROMPT_FILE, WORKING_DIRECTORY } from "@/lib/env-variables";

export interface PromptFragment {
  content: string | string[];
  defaultEnable: boolean;
  name: string;
  priority: number;
  role: "system" | "user";
}

const PROMPTS_DIR = path.join(WORKING_DIRECTORY, "data/prompts");

const readPropmptFile = async (
  promptFile: string,
): Promise<PromptFragment[]> => {
  const raw = await fs.readFile(promptFile, "utf8");
  return JSON.parse(raw) as PromptFragment[];
};

interface ConstructPromptMessagesParams {
  character: {
    description: string;
    name: string;
    personality: string;
    scenario: string;
  };
  lastMessage?: string;
  lorebook?: string;
  persona: {
    description: string;
    name: string;
  };
  prompts: string[];
  world: null | {
    description: string;
    name: string;
  };
}

export async function assemblePrompts({ debug = false } = {}): Promise<{
  systemPrompt: string;
  userPrompt: string;
}> {
  const promptFragments = await readPropmptFile(join(PROMPTS_DIR, PROMPT_FILE));

  const systemPrompt = promptFragments
    .filter((f) => f.role === "system" && f.defaultEnable)
    .map((f) => (Array.isArray(f.content) ? f.content.join("\n") : f.content))
    .join("\n");
  if (debug) console.info("Assembled system prompt:", systemPrompt);

  const userPrompt = promptFragments
    .filter((f) => f.role === "user" && f.defaultEnable)
    .map((f) => (Array.isArray(f.content) ? f.content.join("\n") : f.content))
    .join("\n");
  if (debug) console.info("Assembled user prompt:", userPrompt);

  return { systemPrompt, userPrompt };
}

export function constructPromptMessages({
  character,
  lastMessage = "",
  lorebook = "",
  persona,
  prompts,
  world,
}: ConstructPromptMessagesParams): string[] {
  const variables: Record<string, string> = {};
  //character variables
  variables["char"] = character.name;
  variables["char.description"] = character.description;
  variables["char.personality"] = character.personality;
  variables["char.scenario"] = character.scenario;
  //persona variables
  variables["user"] = persona.name;
  variables["user.description"] = persona.description;
  //world variables)
  if (world) {
    variables["world"] = world.name;
    variables["world.description"] = world.description;
  }

  variables["last_message"] = lastMessage;
  variables["lorebook"] = lorebook;

  return prompts.map((pmt) => hydratePrompt(pmt, variables));
}

export function hydratePrompt(
  prompt: string,
  variables: Record<string, string>,
): string {
  return prompt.replace(/{{(\w+(?:\.\w+)*)}}/g, (match, key) => {
    if (key in variables) {
      return variables[key];
    } else {
      console.warn(`unreplaced variable:{{${key}}}`);
      return "";
    }
  });
}
