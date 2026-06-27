import { describe, expect, it } from "vitest";

import type { PromptFragmentFormValues } from "@/app/prompt/_lib/schema";

import { parseSillyTavernPreset } from "@/app/prompt/_lib/sillytavern-import";

function findFragment(
  fragments: PromptFragmentFormValues[],
  predicate: (f: PromptFragmentFormValues) => boolean,
) {
  return fragments.find(predicate);
}

function findInject(fragments: PromptFragmentFormValues[], tag: string) {
  return findFragment(
    fragments,
    (f) => f.type === "INJECT" && f.injectTag === tag,
  );
}

function makePreset(
  prompts: Array<{
    content?: string;
    enabled?: boolean;
    identifier: string;
    marker?: boolean;
    name: string;
    role?: string;
  }>,
  promptOrder?: Array<{ enabled: boolean; identifier: string }>,
) {
  return {
    prompt_order: promptOrder ? [{ order: promptOrder }] : undefined,
    prompts,
  };
}

// ---------------------------------------------------------------------------
// parseSillyTavernPreset — validation
// ---------------------------------------------------------------------------

describe("parseSillyTavernPreset — validation", () => {
  it("throws on null input", () => {
    expect(() => parseSillyTavernPreset(null)).toThrow(
      "Not a valid SillyTavern preset file",
    );
  });

  it("throws on non-object input", () => {
    expect(() => parseSillyTavernPreset("string")).toThrow(
      "Not a valid SillyTavern preset file",
    );
  });

  it("throws when prompts key is missing", () => {
    expect(() => parseSillyTavernPreset({ other: 1 })).toThrow(
      "Not a valid SillyTavern preset file",
    );
  });
});

// ---------------------------------------------------------------------------
// parseSillyTavernPreset — defaults
// ---------------------------------------------------------------------------

describe("parseSillyTavernPreset — defaults", () => {
  it("returns expected default settings", () => {
    const result = parseSillyTavernPreset({ prompts: [] });
    expect(result.maxOutputTokens).toBe(0);
    expect(result.maxSteps).toBe(20);
    expect(result.maxTokens).toBe(80000);
    expect(result.name).toBe("Imported Preset");
    expect(result.prefetch).toBe(false);
    expect(result.temperature).toBe(0.75);
    expect(result.topK).toBe(64);
    expect(result.topP).toBe(0.95);
    expect(result.promptRegexes).toEqual([]);
  });

  it("adds a disabled CHAT_HISTORY fragment when none present", () => {
    const result = parseSillyTavernPreset({ prompts: [] });
    const chatHistory = findFragment(
      result.promptFragments,
      (f) => f.type === "CHAT_HISTORY",
    );
    expect(chatHistory).toBeDefined();
    expect(chatHistory!.enabled).toBe(false);
  });

  it("adds a LAST_MESSAGE inject when none present", () => {
    const result = parseSillyTavernPreset({ prompts: [] });
    const lastMsg = findInject(result.promptFragments, "LAST_MESSAGE");
    expect(lastMsg).toBeDefined();
    expect(lastMsg!.enabled).toBe(true);
  });

  it("adds disabled fallback inject fragments for all missing tags", () => {
    const result = parseSillyTavernPreset({ prompts: [] });
    const expectedTags = [
      "CHARACTER_DESCRIPTION",
      "CHARACTER_PERSONALITY",
      "CHARACTER_SCENARIO",
      "GENERATED_FACTS",
      "LOREBOOK_CONSTANT",
      "LOREBOOK_CONTEXT",
      "LOREBOOK_ENTRIES",
      "LOREBOOK_MEMORIES",
      "PERSONA_DESCRIPTION",
      "WORLD_DESCRIPTION",
    ];
    for (const tag of expectedTags) {
      const frag = findInject(result.promptFragments, tag);
      expect(frag, `missing fallback for ${tag}`).toBeDefined();
      expect(frag!.enabled).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// parseSillyTavernPreset — content fragments
// ---------------------------------------------------------------------------

describe("parseSillyTavernPreset — content fragments", () => {
  it("converts a non-marker prompt entry to a CONTENT fragment", () => {
    const preset = makePreset([
      {
        content: "You are a helpful assistant.",
        identifier: "main",
        name: "Main Prompt",
        role: "system",
      },
    ]);
    const result = parseSillyTavernPreset(preset);
    const frag = findFragment(
      result.promptFragments,
      (f) => f.type === "CONTENT" && f.name === "Main Prompt",
    );
    expect(frag).toBeDefined();
    expect(frag!.type).toBe("CONTENT");
    expect(frag!.content).toBe("You are a helpful assistant.");
    expect(frag!.role).toBe("system");
    expect(frag!.enabled).toBe(true);
  });

  it("defaults role to system when not specified", () => {
    const preset = makePreset([
      {
        content: "Hello",
        identifier: "x",
        name: "X",
      },
    ]);
    const result = parseSillyTavernPreset(preset);
    const frag = findFragment(
      result.promptFragments,
      (f) => f.type === "CONTENT" && f.name === "X",
    );
    expect(frag!.role).toBe("system");
  });

  it("skips entries with empty content", () => {
    const preset = makePreset([
      { content: "", identifier: "empty", name: "Empty" },
      { content: "   ", identifier: "whitespace", name: "Whitespace" },
    ]);
    const result = parseSillyTavernPreset(preset);
    const contentFrags = result.promptFragments.filter(
      (f) => f.type === "CONTENT",
    );
    expect(contentFrags).toHaveLength(0);
  });

  it("trims content whitespace", () => {
    const preset = makePreset([
      { content: "  trimmed  ", identifier: "t", name: "Trimmed" },
    ]);
    const result = parseSillyTavernPreset(preset);
    const frag = findFragment(
      result.promptFragments,
      (f) => f.type === "CONTENT",
    );
    expect(frag!.content).toBe("trimmed");
  });
});

// ---------------------------------------------------------------------------
// parseSillyTavernPreset — marker fragments
// ---------------------------------------------------------------------------

describe("parseSillyTavernPreset — marker fragments", () => {
  it("converts chatHistory marker to CHAT_HISTORY fragment", () => {
    const preset = makePreset([
      { identifier: "chatHistory", marker: true, name: "Chat History" },
    ]);
    const result = parseSillyTavernPreset(preset);
    const frag = findFragment(
      result.promptFragments,
      (f) => f.type === "CHAT_HISTORY",
    );
    expect(frag).toBeDefined();
    expect(frag!.enabled).toBe(true);
  });

  it("converts charDescription marker to CHARACTER_DESCRIPTION inject", () => {
    const preset = makePreset([
      { identifier: "charDescription", marker: true, name: "Char Desc" },
    ]);
    const result = parseSillyTavernPreset(preset);
    const frag = findInject(result.promptFragments, "CHARACTER_DESCRIPTION");
    expect(frag).toBeDefined();
    expect(frag!.enabled).toBe(true);
  });

  it("converts charPersonality marker to CHARACTER_PERSONALITY inject", () => {
    const preset = makePreset([
      { identifier: "charPersonality", marker: true, name: "Personality" },
    ]);
    const result = parseSillyTavernPreset(preset);
    expect(
      findInject(result.promptFragments, "CHARACTER_PERSONALITY"),
    ).toBeDefined();
  });

  it("converts scenario marker to CHARACTER_SCENARIO inject", () => {
    const preset = makePreset([
      { identifier: "scenario", marker: true, name: "Scenario" },
    ]);
    const result = parseSillyTavernPreset(preset);
    expect(
      findInject(result.promptFragments, "CHARACTER_SCENARIO"),
    ).toBeDefined();
  });

  it("converts personaDescription marker to PERSONA_DESCRIPTION inject", () => {
    const preset = makePreset([
      {
        identifier: "personaDescription",
        marker: true,
        name: "Persona",
      },
    ]);
    const result = parseSillyTavernPreset(preset);
    expect(
      findInject(result.promptFragments, "PERSONA_DESCRIPTION"),
    ).toBeDefined();
  });

  it("converts worldInfoAfter marker to LOREBOOK_CONTEXT inject", () => {
    const preset = makePreset([
      { identifier: "worldInfoAfter", marker: true, name: "WI After" },
    ]);
    const result = parseSillyTavernPreset(preset);
    expect(
      findInject(result.promptFragments, "LOREBOOK_CONTEXT"),
    ).toBeDefined();
  });

  it("converts worldInfoBefore marker to LOREBOOK_ENTRIES inject", () => {
    const preset = makePreset([
      { identifier: "worldInfoBefore", marker: true, name: "WI Before" },
    ]);
    const result = parseSillyTavernPreset(preset);
    expect(
      findInject(result.promptFragments, "LOREBOOK_ENTRIES"),
    ).toBeDefined();
  });

  it("skips dialogueExamples marker (mapped to null)", () => {
    const preset = makePreset([
      {
        identifier: "dialogueExamples",
        marker: true,
        name: "Dialogue Examples",
      },
    ]);
    const result = parseSillyTavernPreset(preset);
    const contentFrags = result.promptFragments.filter(
      (f) => f.type === "CONTENT",
    );
    expect(contentFrags).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// parseSillyTavernPreset — built-in skips
// ---------------------------------------------------------------------------

describe("parseSillyTavernPreset — built-in skips", () => {
  it.each(["enhanceDefinitions", "jailbreak", "nsfw"])(
    "skips built-in identifier: %s",
    (identifier) => {
      const preset = makePreset([
        {
          content: "should be skipped",
          identifier,
          name: identifier,
        },
      ]);
      const result = parseSillyTavernPreset(preset);
      const frag = findFragment(
        result.promptFragments,
        (f) => f.type === "CONTENT" && f.name === identifier,
      );
      expect(frag).toBeUndefined();
    },
  );
});

// ---------------------------------------------------------------------------
// parseSillyTavernPreset — prompt_order
// ---------------------------------------------------------------------------

describe("parseSillyTavernPreset — prompt_order", () => {
  it("uses prompt_order to determine fragment ordering", () => {
    const preset = makePreset(
      [
        { content: "First", identifier: "a", name: "A" },
        { content: "Second", identifier: "b", name: "B" },
      ],
      [
        { enabled: true, identifier: "b" },
        { enabled: true, identifier: "a" },
      ],
    );
    const result = parseSillyTavernPreset(preset);
    const contentFrags = result.promptFragments.filter(
      (f) => f.type === "CONTENT",
    );
    expect(contentFrags[0].name).toBe("B");
    expect(contentFrags[1].name).toBe("A");
  });

  it("respects enabled flag from prompt_order", () => {
    const preset = makePreset(
      [{ content: "Content", enabled: true, identifier: "a", name: "A" }],
      [{ enabled: false, identifier: "a" }],
    );
    const result = parseSillyTavernPreset(preset);
    const frag = findFragment(
      result.promptFragments,
      (f) => f.type === "CONTENT" && f.name === "A",
    );
    expect(frag!.enabled).toBe(false);
  });

  it("falls back to prompts array order when prompt_order is absent", () => {
    const preset = makePreset([
      { content: "First", identifier: "a", name: "A" },
      { content: "Second", identifier: "b", name: "B" },
    ]);
    const result = parseSillyTavernPreset(preset);
    const contentFrags = result.promptFragments.filter(
      (f) => f.type === "CONTENT",
    );
    expect(contentFrags[0].name).toBe("A");
    expect(contentFrags[1].name).toBe("B");
  });

  it("skips order entries that have no matching prompt", () => {
    const preset = makePreset(
      [{ content: "Only", identifier: "a", name: "A" }],
      [
        { enabled: true, identifier: "missing" },
        { enabled: true, identifier: "a" },
      ],
    );
    const result = parseSillyTavernPreset(preset);
    const contentFrags = result.promptFragments.filter(
      (f) => f.type === "CONTENT",
    );
    expect(contentFrags).toHaveLength(1);
    expect(contentFrags[0].name).toBe("A");
  });
});

// ---------------------------------------------------------------------------
// parseSillyTavernPreset — LAST_MESSAGE placement
// ---------------------------------------------------------------------------

describe("parseSillyTavernPreset — LAST_MESSAGE placement", () => {
  it("inserts LAST_MESSAGE after CHAT_HISTORY when both are missing", () => {
    const result = parseSillyTavernPreset({ prompts: [] });
    const frags = result.promptFragments;
    const chatIdx = frags.findIndex((f) => f.type === "CHAT_HISTORY");
    const lastMsgIdx = frags.findIndex(
      (f) => f.type === "INJECT" && f.injectTag === "LAST_MESSAGE",
    );
    expect(lastMsgIdx).toBe(chatIdx + 1);
  });

  it("inserts LAST_MESSAGE after CHAT_HISTORY marker from preset", () => {
    const preset = makePreset([
      { content: "Before", identifier: "before", name: "Before" },
      { identifier: "chatHistory", marker: true, name: "Chat History" },
      { content: "After", identifier: "after", name: "After" },
    ]);
    const result = parseSillyTavernPreset(preset);
    const frags = result.promptFragments;
    const chatIdx = frags.findIndex((f) => f.type === "CHAT_HISTORY");
    const lastMsgIdx = frags.findIndex(
      (f) => f.type === "INJECT" && f.injectTag === "LAST_MESSAGE",
    );
    expect(lastMsgIdx).toBe(chatIdx + 1);
  });

  it("does not duplicate LAST_MESSAGE when already present via marker", () => {
    const preset = makePreset([
      { identifier: "chatHistory", marker: true, name: "Chat History" },
    ]);
    const result = parseSillyTavernPreset(preset);
    const lastMsgFrags = result.promptFragments.filter(
      (f) => f.type === "INJECT" && f.injectTag === "LAST_MESSAGE",
    );
    expect(lastMsgFrags).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// parseSillyTavernPreset — no duplicate fallbacks
// ---------------------------------------------------------------------------

describe("parseSillyTavernPreset — no duplicate fallbacks", () => {
  it("does not add a fallback inject for a tag already in the preset", () => {
    const preset = makePreset([
      { identifier: "charDescription", marker: true, name: "Char Desc" },
    ]);
    const result = parseSillyTavernPreset(preset);
    const charDescFrags = result.promptFragments.filter(
      (f) => f.type === "INJECT" && f.injectTag === "CHARACTER_DESCRIPTION",
    );
    expect(charDescFrags).toHaveLength(1);
    expect(charDescFrags[0].enabled).toBe(true);
  });

  it("does not add duplicate CHAT_HISTORY when preset already has one", () => {
    const preset = makePreset([
      { identifier: "chatHistory", marker: true, name: "Chat History" },
    ]);
    const result = parseSillyTavernPreset(preset);
    const chatHistoryFrags = result.promptFragments.filter(
      (f) => f.type === "CHAT_HISTORY",
    );
    expect(chatHistoryFrags).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// parseSillyTavernPreset — full preset integration
// ---------------------------------------------------------------------------

describe("parseSillyTavernPreset — full preset", () => {
  it("preserves ordering from a realistic preset", () => {
    const preset = makePreset(
      [
        { content: "System prompt", identifier: "main", name: "Main" },
        {
          identifier: "charDescription",
          marker: true,
          name: "Char Desc",
        },
        {
          identifier: "charPersonality",
          marker: true,
          name: "Char Personality",
        },
        {
          identifier: "scenario",
          marker: true,
          name: "Scenario",
        },
        {
          identifier: "worldInfoBefore",
          marker: true,
          name: "WI Before",
        },
        {
          identifier: "chatHistory",
          marker: true,
          name: "Chat History",
        },
        {
          identifier: "worldInfoAfter",
          marker: true,
          name: "WI After",
        },
        {
          content: "Remember to stay in character.",
          identifier: "reminder",
          name: "Reminder",
        },
      ],
      [
        { enabled: true, identifier: "main" },
        { enabled: true, identifier: "charDescription" },
        { enabled: true, identifier: "charPersonality" },
        { enabled: true, identifier: "scenario" },
        { enabled: true, identifier: "worldInfoBefore" },
        { enabled: true, identifier: "chatHistory" },
        { enabled: true, identifier: "worldInfoAfter" },
        { enabled: true, identifier: "reminder" },
      ],
    );
    const result = parseSillyTavernPreset(preset);
    const names = result.promptFragments
      .filter((f) => f.enabled)
      .map((f) => f.name);

    expect(names.indexOf("Main")).toBeLessThan(names.indexOf("Char Desc"));
    expect(names.indexOf("Char Desc")).toBeLessThan(
      names.indexOf("Chat History"),
    );
    expect(names.indexOf("Chat History")).toBeLessThan(
      names.indexOf("Last Message"),
    );
    expect(names.indexOf("Last Message")).toBeLessThan(
      names.indexOf("WI After"),
    );
    expect(names.indexOf("WI After")).toBeLessThan(names.indexOf("Reminder"));
  });
});
