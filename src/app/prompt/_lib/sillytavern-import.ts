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

// Default role per inject tag — LAST_MESSAGE is user, everything else is system
const INJECT_TAG_DEFAULT_ROLE: Record<PromptInjectTag, MessageRole> = {
  CHARACTER_DESCRIPTION: "system",
  CHARACTER_PERSONALITY: "system",
  CHARACTER_SCENARIO: "system",
  LAST_MESSAGE: "user",
  LOREBOOK_CONSTANT: "system",
  LOREBOOK_CONTEXT: "system",
  LOREBOOK_ENTRIES: "system",
  LOREBOOK_MEMORIES: "system",
  PERSONA_DESCRIPTION: "system",
  WORLD_DESCRIPTION: "system",
};

// Human-readable names for inject tags added as fallbacks
const INJECT_TAG_NAME: Record<PromptInjectTag, string> = {
  CHARACTER_DESCRIPTION: "Character Description",
  CHARACTER_PERSONALITY: "Character Personality",
  CHARACTER_SCENARIO: "Character Scenario",
  LAST_MESSAGE: "Last Message",
  LOREBOOK_CONSTANT: "Lorebook Constants",
  LOREBOOK_CONTEXT: "Lorebook Context",
  LOREBOOK_ENTRIES: "Lorebook Entries",
  LOREBOOK_MEMORIES: "Lorebook Memories",
  PERSONA_DESCRIPTION: "Persona Description",
  WORLD_DESCRIPTION: "World Description",
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

  const usedInjectTags = new Set(
    fragments
      .filter((f) => f.type === "INJECT")
      .map((f) => (f as { injectTag: PromptInjectTag }).injectTag),
  );
  const chatHistoryIndex = fragments.findIndex(
    (f) => f.type === "CHAT_HISTORY",
  );

  if (chatHistoryIndex === -1) {
    fragments.push({
      enabled: false,
      name: "Chat History",
      type: "CHAT_HISTORY",
    });
  }

  if (!usedInjectTags.has("LAST_MESSAGE")) {
    const insertAfter =
      chatHistoryIndex === -1 ? fragments.length - 1 : chatHistoryIndex;
    fragments.splice(insertAfter + 1, 0, {
      enabled: true,
      injectTag: "LAST_MESSAGE",
      name: INJECT_TAG_NAME["LAST_MESSAGE"],
      role: INJECT_TAG_DEFAULT_ROLE["LAST_MESSAGE"],
      type: "INJECT",
    });
  }

  for (const tag of Object.keys(INJECT_TAG_NAME) as PromptInjectTag[]) {
    if (tag === "LAST_MESSAGE") continue;
    if (!usedInjectTags.has(tag)) {
      fragments.push({
        enabled: false,
        injectTag: tag,
        name: INJECT_TAG_NAME[tag],
        role: INJECT_TAG_DEFAULT_ROLE[tag],
        type: "INJECT",
      });
    }
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
