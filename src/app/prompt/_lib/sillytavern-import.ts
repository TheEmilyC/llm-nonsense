import { MessageRole } from "@/app/_shared/schema";
import {
  PromptFormValues,
  PromptFragmentFormValues,
  PromptInjectTag,
} from "@/app/prompt/_lib/schema";

type STPreset = {
  prompt_order?: Array<{
    order: Array<{ enabled: boolean; identifier: string }>;
  }>;
  prompts: STPromptEntry[];
};

type STPromptEntry = {
  content?: string;
  enabled?: boolean;
  identifier: string;
  marker?: boolean;
  name: string;
  role?: string;
};

// Marker identifiers that map to inject tags
const MARKER_TO_TAG: Record<string, "CHAT_HISTORY" | null | PromptInjectTag> = {
  charDescription: "CHARACTER_DESCRIPTION",
  charPersonality: "CHARACTER_PERSONALITY",
  chatHistory: "CHAT_HISTORY",
  dialogueExamples: null,
  personaDescription: "PERSONA_DESCRIPTION",
  scenario: "CHARACTER_SCENARIO",
  worldInfoAfter: "LOREBOOK_CONTEXT",
  worldInfoBefore: "LOREBOOK_ENTRIES",
};

// Built-in ST slots that are always empty placeholders
const EMPTY_BUILTIN_IDS = new Set(["enhanceDefinitions", "jailbreak", "nsfw"]);

export function parseSillyTavernPreset(json: unknown): PromptFormValues {
  if (!json || typeof json !== "object" || !("prompts" in json)) {
    throw new Error("Not a valid SillyTavern preset file");
  }
  const preset = json as STPreset;

  const promptMap = new Map<string, STPromptEntry>();
  for (const entry of preset.prompts) {
    promptMap.set(entry.identifier, entry);
  }

  const orderList =
    preset.prompt_order?.[0]?.order ??
    preset.prompts.map((p) => ({
      enabled: p.enabled ?? true,
      identifier: p.identifier,
    }));

  const fragments: PromptFragmentFormValues[] = [];

  for (const { enabled, identifier } of orderList) {
    const entry = promptMap.get(identifier);
    if (!entry) continue;
    if (EMPTY_BUILTIN_IDS.has(identifier)) continue;

    if (entry.marker) {
      const tag = MARKER_TO_TAG[identifier];
      if (tag === undefined || tag === null) continue;
      if (tag === "CHAT_HISTORY") {
        fragments.push({ enabled, name: entry.name, type: "CHAT_HISTORY" });
      } else {
        fragments.push({
          enabled,
          injectTag: tag,
          name: entry.name,
          role: (entry.role as MessageRole) ?? "system",
          type: "INJECT",
        });
      }
      continue;
    }

    const content = entry.content?.trim() ?? "";
    if (!content) continue;

    fragments.push({
      content,
      enabled,
      name: entry.name,
      role: (entry.role as MessageRole) ?? "system",
      type: "CONTENT",
    });
  }

  return {
    maxOutputTokens: 0,
    maxSteps: 20,
    maxTokens: 80000,
    name: "Imported Preset",
    prefetch: false,
    promptFragments: fragments,
    promptRegexes: [],
    temperature: 0.75,
    topK: 64,
    topP: 0.95,
  };
}
