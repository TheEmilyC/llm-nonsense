import { WORKING_DIRECTORY } from "@/lib/env-variables";
import fs from "fs/promises";
import path, { join } from "path";

export interface PromptFragment {
  name: string;
  role: "system" | "user";
  defaultEnable: boolean;
  priority: number;
  content: string | string[];
}

const PROMPTS_DIR = path.join(WORKING_DIRECTORY, "data/prompts");

const readPropmptFile = async (
  promptFile: string,
): Promise<PromptFragment[]> => {
  const raw = await fs.readFile(promptFile, "utf8");
  return JSON.parse(raw) as PromptFragment[];
};

export async function assemblePrompts({ debug = false } = {}): Promise<{
  systemPrompt: string;
  userPrompt: string;
}> {
  const promptFragments = await readPropmptFile(
    join(PROMPTS_DIR, "main-prompts/mpv1.json"),
  );

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

interface ConstructPromptMessagesParams {
  prompts: string[];
  character: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
  };
  persona: {
    name: string;
    description: string;
  };
  lastMessage?: string;
}

export function constructPromptMessages({
  prompts,
  lastMessage = "",
  character,
  persona,
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

  variables["last_message"] = lastMessage;

  return prompts.map((pmt) => hydratePrompt(pmt, variables));
}
