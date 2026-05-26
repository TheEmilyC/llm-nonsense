import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/app/lorebook/_lib/data", () => ({
  getLorebookEntryList: vi.fn(),
}));

import type { MessageRole } from "@/app/_shared/schema";
import { getLorebookEntryList } from "@/app/lorebook/_lib/data";
import type {
  LorebookEntryIndex,
  LorebookIndex,
  LorebookReady,
  ObsidianFile,
} from "@/app/lorebook/_lib/schema";
import type { PromptInjectTag } from "@/app/prompt/_lib/schema";

import {
  BuilderFragment,
  BuilderRegex,
  hydratePrompt,
  PromptBuilder,
} from "@/app/prompt/_lib/prompt-builder";

// estimateTokens = Math.ceil(text.length / 4)
// Use repeat(n * 4) to produce exactly n tokens
const tokens = (n: number) => "x".repeat(n * 4);

function contentFrag(
  content: string,
  role: MessageRole = "system",
): BuilderFragment {
  return { content, role, type: "CONTENT" };
}

function injectFrag(
  injectTag: PromptInjectTag,
  role: MessageRole = "system",
): BuilderFragment {
  return { content: "", injectTag, role, type: "INJECT" };
}

const chatHistoryFrag = (): BuilderFragment => ({ type: "CHAT_HISTORY" });

// ---------------------------------------------------------------------------
// hydratePrompt
// ---------------------------------------------------------------------------

describe("hydratePrompt", () => {
  it("replaces a single variable", () => {
    expect(hydratePrompt("Hello {{name}}", { name: "Alice" })).toBe(
      "Hello Alice",
    );
  });

  it("replaces multiple variables", () => {
    expect(hydratePrompt("{{a}} and {{b}}", { a: "foo", b: "bar" })).toBe(
      "foo and bar",
    );
  });

  it("replaces the same variable used twice", () => {
    expect(hydratePrompt("{{x}} {{x}}", { x: "hi" })).toBe("hi hi");
  });

  it("leaves text untouched when there are no variables", () => {
    expect(hydratePrompt("plain text", {})).toBe("plain text");
  });

  it("replaces missing variables with empty string", () => {
    expect(hydratePrompt("hello {{missing}}", {})).toBe("hello ");
  });

  it("supports dot-notation keys like {{user.name}}", () => {
    expect(hydratePrompt("Hi {{user.name}}", { "user.name": "Bob" })).toBe(
      "Hi Bob",
    );
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder — constructor
// ---------------------------------------------------------------------------

describe("PromptBuilder constructor", () => {
  it("initializes with zero tokens and empty chat history", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [],
    });
    expect(builder.currentTokens).toBe(0);
    expect(builder.chatHistory).toEqual([]);
  });

  it("counts tokens for CONTENT fragments", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [contentFrag(tokens(10))],
    });
    expect(builder.currentTokens).toBe(10);
  });

  it("hydrates variables in CONTENT fragments at construction", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [contentFrag("Hello {{name}}")],
      variables: { name: "World" },
    });
    const built = builder.build();
    expect(built[0].content).toBe("Hello World");
  });

  it("throws when CONTENT fragments exceed maxTokens", () => {
    expect(
      () =>
        new PromptBuilder({
          maxTokens: 5,
          promptSkeleton: [contentFrag(tokens(10))],
        }),
    ).toThrow("Prompt skeleton exceeds token limit");
  });

  it("does not charge tokens for INJECT fragments", () => {
    const builder = new PromptBuilder({
      maxTokens: 10,
      promptSkeleton: [injectFrag("CHARACTER_DESCRIPTION")],
    });
    expect(builder.currentTokens).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder — canAfford / canAffordTokens
// ---------------------------------------------------------------------------

describe("canAfford / canAffordTokens", () => {
  it("returns true when under the limit", () => {
    const builder = new PromptBuilder({ maxTokens: 100, promptSkeleton: [] });
    expect(builder.canAfford(tokens(50))).toBe(true);
    expect(builder.canAffordTokens(50)).toBe(true);
  });

  it("returns true at exactly the limit", () => {
    const builder = new PromptBuilder({ maxTokens: 100, promptSkeleton: [] });
    expect(builder.canAffordTokens(100)).toBe(true);
  });

  it("returns false when over the limit", () => {
    const builder = new PromptBuilder({ maxTokens: 10, promptSkeleton: [] });
    expect(builder.canAfford(tokens(11))).toBe(false);
    expect(builder.canAffordTokens(11)).toBe(false);
  });

  it("accounts for already-spent tokens", () => {
    const builder = new PromptBuilder({
      maxTokens: 10,
      promptSkeleton: [contentFrag(tokens(8))],
    });
    expect(builder.canAffordTokens(3)).toBe(false);
    expect(builder.canAffordTokens(2)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder — addToPrompt
// ---------------------------------------------------------------------------

describe("addToPrompt", () => {
  it("adds content to a matching inject tag", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [injectFrag("CHARACTER_DESCRIPTION")],
    });
    builder.addToPrompt("CHARACTER_DESCRIPTION", "She is tall.");
    const built = builder.build();
    expect(built[0].content).toContain("She is tall.");
  });

  it("appends on successive calls", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [injectFrag("CHARACTER_DESCRIPTION")],
    });
    builder.addToPrompt("CHARACTER_DESCRIPTION", "Line one.");
    builder.addToPrompt("CHARACTER_DESCRIPTION", "Line two.");
    const built = builder.build();
    expect(built[0].content).toContain("Line one.");
    expect(built[0].content).toContain("Line two.");
  });

  it("tracks tokens added via addToPrompt", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [injectFrag("CHARACTER_DESCRIPTION")],
    });
    builder.addToPrompt("CHARACTER_DESCRIPTION", tokens(20));
    expect(builder.currentTokens).toBe(20);
  });

  it("throws when content would exceed maxTokens", () => {
    const builder = new PromptBuilder({
      maxTokens: 5,
      promptSkeleton: [injectFrag("CHARACTER_DESCRIPTION")],
    });
    expect(() =>
      builder.addToPrompt("CHARACTER_DESCRIPTION", tokens(10)),
    ).toThrow("Content exceeds token limit");
  });

  it("does nothing when inject tag is not in the skeleton", () => {
    const builder = new PromptBuilder({ maxTokens: 100, promptSkeleton: [] });
    expect(() =>
      builder.addToPrompt("CHARACTER_DESCRIPTION", "ignored"),
    ).not.toThrow();
    expect(builder.currentTokens).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder — injectChatHistory
// ---------------------------------------------------------------------------

describe("injectChatHistory", () => {
  it("adds messages to chatHistory", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [chatHistoryFrag()],
    });
    builder.injectChatHistory([{ content: "hello", role: "user" }]);
    expect(builder.chatHistory).toHaveLength(1);
  });

  it("stops adding messages when the token limit would be exceeded", () => {
    const builder = new PromptBuilder({
      maxTokens: 7,
      promptSkeleton: [chatHistoryFrag()],
    });
    const messages = [
      { content: tokens(5), role: "user" as MessageRole },
      { content: tokens(5), role: "assistant" as MessageRole },
    ];
    builder.injectChatHistory(messages);
    expect(builder.chatHistory).toHaveLength(1);
  });

  it("does nothing when there is no CHAT_HISTORY fragment", () => {
    const builder = new PromptBuilder({ maxTokens: 100, promptSkeleton: [] });
    builder.injectChatHistory([{ content: "hello", role: "user" }]);
    expect(builder.chatHistory).toHaveLength(0);
    expect(builder.currentTokens).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder — build
// ---------------------------------------------------------------------------

describe("build", () => {
  it("returns empty array for an empty skeleton", () => {
    const builder = new PromptBuilder({ maxTokens: 100, promptSkeleton: [] });
    expect(builder.build()).toEqual([]);
  });

  it("returns a message for each fragment role", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [
        contentFrag("system text", "system"),
        contentFrag("user text", "user"),
      ],
    });
    const built = builder.build();
    expect(built).toHaveLength(2);
    expect(built[0]).toEqual({ content: "system text", role: "system" });
    expect(built[1]).toEqual({ content: "user text", role: "user" });
  });

  it("merges adjacent same-role fragments", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [
        contentFrag("part one", "system"),
        contentFrag("part two", "system"),
      ],
    });
    const built = builder.build();
    expect(built).toHaveLength(1);
    expect(built[0].content).toContain("part one");
    expect(built[0].content).toContain("part two");
  });

  it("does not merge fragments with different roles", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [
        contentFrag("system msg", "system"),
        contentFrag("user msg", "user"),
        contentFrag("assistant msg", "assistant"),
      ],
    });
    expect(builder.build()).toHaveLength(3);
  });

  it("inserts chat history at the CHAT_HISTORY position", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [
        contentFrag("before", "system"),
        chatHistoryFrag(),
        // Use a different role so it doesn't merge with the injected user message
        contentFrag("after", "assistant"),
      ],
    });
    builder.injectChatHistory([{ content: "chat msg", role: "user" }]);
    const built = builder.build();
    const idx = (s: string) => built.findIndex((m) => m.content.includes(s));
    expect(idx("before")).toBeLessThan(idx("chat msg"));
    expect(idx("chat msg")).toBeLessThan(idx("after"));
  });

  it("skips empty INJECT fragments", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [
        contentFrag("real content", "system"),
        injectFrag("CHARACTER_DESCRIPTION", "system"),
      ],
    });
    const built = builder.build();
    expect(built.some((m) => m.content.includes("real content"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder — build with regexes
// ---------------------------------------------------------------------------

function regexFrag(
  pattern: string,
  target: BuilderRegex["target"],
): BuilderRegex {
  return { pattern, target };
}

describe("build — regexes", () => {
  it("strips matching text from user messages for USER target", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [chatHistoryFrag()],
      regexes: [regexFrag("STRIP", "USER")],
    });
    builder.injectChatHistory([
      { content: "hello STRIP world", role: "user" },
      { content: "no STRIP change", role: "assistant" },
    ]);
    const built = builder.build();
    expect(built.find((m) => m.role === "user")?.content).toBe("hello  world");
    expect(built.find((m) => m.role === "assistant")?.content).toBe(
      "no STRIP change",
    );
  });

  it("strips matching text from assistant messages for ASSISTANT target", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [chatHistoryFrag()],
      regexes: [regexFrag("STRIP", "ASSISTANT")],
    });
    builder.injectChatHistory([
      { content: "no STRIP change", role: "user" },
      { content: "hello STRIP world", role: "assistant" },
    ]);
    const built = builder.build();
    expect(built.find((m) => m.role === "user")?.content).toBe(
      "no STRIP change",
    );
    expect(built.find((m) => m.role === "assistant")?.content).toBe(
      "hello  world",
    );
  });

  it("strips matching text from both roles for BOTH target", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [chatHistoryFrag()],
      regexes: [regexFrag("STRIP", "BOTH")],
    });
    builder.injectChatHistory([
      { content: "user STRIP msg", role: "user" },
      { content: "asst STRIP msg", role: "assistant" },
    ]);
    const built = builder.build();
    expect(built.find((m) => m.role === "user")?.content).toBe("user  msg");
    expect(built.find((m) => m.role === "assistant")?.content).toBe(
      "asst  msg",
    );
  });

  it("does not modify system messages", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [contentFrag("STRIP me", "system")],
      regexes: [regexFrag("STRIP", "BOTH")],
    });
    expect(builder.build()[0].content).toBe("STRIP me");
  });

  it("applies multiple regexes in order", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [chatHistoryFrag()],
      regexes: [regexFrag("foo", "USER"), regexFrag("bar", "USER")],
    });
    builder.injectChatHistory([{ content: "foo bar baz", role: "user" }]);
    expect(builder.build().find((m) => m.role === "user")?.content).toBe(
      "  baz",
    );
  });

  it("silently ignores invalid regex patterns", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [chatHistoryFrag()],
      regexes: [regexFrag("[invalid(", "BOTH")],
    });
    builder.injectChatHistory([{ content: "hello", role: "user" }]);
    expect(() => builder.build()).not.toThrow();
    expect(builder.build().find((m) => m.role === "user")?.content).toBe(
      "hello",
    );
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder — build with minDepth
// ---------------------------------------------------------------------------

describe("build — minDepth", () => {
  it("applies regex to all messages when minDepth is not set", () => {
    const builder = new PromptBuilder({
      maxTokens: 200,
      promptSkeleton: [injectFrag("LAST_MESSAGE", "user"), chatHistoryFrag()],
      regexes: [{ pattern: "STRIP", target: "BOTH" }],
    });
    builder.addToPrompt("LAST_MESSAGE", "last STRIP msg");
    builder.injectChatHistory([{ content: "history STRIP msg", role: "user" }]);
    const built = builder.build();
    expect(
      built.find((m) => m.role === "user" && m.content.includes("last"))
        ?.content,
    ).toBe("\nlast  msg");
    expect(built.find((m) => m.content.includes("history"))?.content).toBe(
      "history  msg",
    );
  });

  it("skips last message (depth 0) when minDepth is 1", () => {
    const builder = new PromptBuilder({
      maxTokens: 200,
      promptSkeleton: [injectFrag("LAST_MESSAGE", "user"), chatHistoryFrag()],
      regexes: [{ minDepth: 1, pattern: "STRIP", target: "BOTH" }],
    });
    builder.addToPrompt("LAST_MESSAGE", "last STRIP msg");
    builder.injectChatHistory([{ content: "history STRIP msg", role: "user" }]);
    const built = builder.build();
    expect(built.find((m) => m.content.includes("last"))?.content).toBe(
      "\nlast STRIP msg",
    );
    expect(built.find((m) => m.content.includes("history"))?.content).toBe(
      "history  msg",
    );
  });

  it("applies regex only to messages at or beyond minDepth", () => {
    const builder = new PromptBuilder({
      maxTokens: 400,
      promptSkeleton: [chatHistoryFrag()],
      regexes: [{ minDepth: 2, pattern: "STRIP", target: "BOTH" }],
    });
    // injectChatHistory receives newest-first; depth 1 = most recent
    builder.injectChatHistory([
      { content: "depth1 STRIP msg", role: "user" },
      { content: "depth2 STRIP msg", role: "assistant" },
      { content: "depth3 STRIP msg", role: "user" },
    ]);
    const built = builder.build();
    expect(built.find((m) => m.content.includes("depth1"))?.content).toBe(
      "depth1 STRIP msg",
    );
    expect(built.find((m) => m.content.includes("depth2"))?.content).toBe(
      "depth2  msg",
    );
    expect(built.find((m) => m.content.includes("depth3"))?.content).toBe(
      "depth3  msg",
    );
  });

  it("treats null minDepth as no depth filter", () => {
    const builder = new PromptBuilder({
      maxTokens: 200,
      promptSkeleton: [chatHistoryFrag()],
      regexes: [{ minDepth: null, pattern: "STRIP", target: "BOTH" }],
    });
    builder.injectChatHistory([{ content: "msg STRIP here", role: "user" }]);
    expect(builder.build().find((m) => m.role === "user")?.content).toBe(
      "msg  here",
    );
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder — addLorebookToPrompt
// ---------------------------------------------------------------------------

function makeLorebookIndex(overrides: Partial<LorebookIndex> = {}): LorebookIndex {
  return {
    createdAt: new Date(),
    filename: "entry.md",
    name: "Entry",
    order: 0,
    tags: [],
    ...overrides,
  };
}

function makeEntryIndex(
  overrides: Partial<LorebookEntryIndex> = {},
): LorebookEntryIndex {
  return {
    ...makeLorebookIndex(),
    aliases: [],
    characters: [],
    summary: "",
    ...overrides,
  };
}

function makeLorebookReady(overrides: Partial<LorebookReady> = {}): LorebookReady {
  return {
    constants: [],
    context: [],
    entries: [],
    id: "lb-1",
    memories: [],
    name: "Test Lorebook",
    status: "READY",
    ...overrides,
  };
}

function makeObsidianFile(overrides: Partial<ObsidianFile> = {}): ObsidianFile {
  return {
    backlinks: [],
    content: "File content",
    frontmatter: { tags: [] },
    links: [],
    path: "notes/entry.md",
    stat: { ctime: new Date(), mtime: new Date(), size: 0 },
    tags: [],
    ...overrides,
  };
}

describe("addLorebookToPrompt", () => {
  beforeEach(() => vi.resetAllMocks());

  // Returns the content string of a named INJECT fragment directly from the prompt
  // array, bypassing build() to avoid same-role fragment merging.
  function getInjectContent(builder: PromptBuilder, tag: PromptInjectTag): string {
    const frag = builder.prompt.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f) => f.type === "INJECT" && (f as any).injectTag === tag,
    ) as { content: string } | undefined;
    return frag?.content ?? "";
  }

  function makeBuilder() {
    return new PromptBuilder({
      maxTokens: 100_000,
      promptSkeleton: [
        injectFrag("LOREBOOK_CONTEXT"),
        injectFrag("LOREBOOK_CONSTANT"),
        injectFrag("LOREBOOK_ENTRIES"),
        injectFrag("LOREBOOK_MEMORIES"),
      ],
    });
  }

  it("injects context file content into LOREBOOK_CONTEXT", async () => {
    vi.mocked(getLorebookEntryList)
      .mockResolvedValueOnce([makeObsidianFile({ content: "# Dragon\nA fearsome beast" })])
      .mockResolvedValueOnce([]);

    const lorebook = makeLorebookReady({
      context: [makeLorebookIndex({ filename: "dragon.md" })],
    });
    const builder = makeBuilder();
    await builder.addLorebookToPrompt(lorebook);

    expect(getInjectContent(builder, "LOREBOOK_CONTEXT")).toContain("A fearsome beast");
  });

  it("injects constant file content into LOREBOOK_CONSTANT", async () => {
    vi.mocked(getLorebookEntryList)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([makeObsidianFile({ content: "# Rules\nAlways speak in riddles" })]);

    const lorebook = makeLorebookReady({
      constants: [makeEntryIndex({ filename: "rules.md" })],
    });
    const builder = makeBuilder();
    await builder.addLorebookToPrompt(lorebook);

    expect(getInjectContent(builder, "LOREBOOK_CONSTANT")).toContain("Always speak in riddles");
  });

  it("skips LOREBOOK_CONTEXT injection when context files yield empty content", async () => {
    vi.mocked(getLorebookEntryList).mockResolvedValue([]);

    const lorebook = makeLorebookReady({
      context: [makeLorebookIndex({ filename: "ctx.md" })],
    });
    const builder = makeBuilder();
    await builder.addLorebookToPrompt(lorebook);

    expect(getInjectContent(builder, "LOREBOOK_CONTEXT")).toBe("");
  });

  it("skips LOREBOOK_CONSTANT injection when constant files yield empty content", async () => {
    vi.mocked(getLorebookEntryList).mockResolvedValue([]);

    const lorebook = makeLorebookReady({
      constants: [makeEntryIndex({ filename: "const.md" })],
    });
    const builder = makeBuilder();
    await builder.addLorebookToPrompt(lorebook);

    expect(getInjectContent(builder, "LOREBOOK_CONSTANT")).toBe("");
  });

  it("injects the entries table into LOREBOOK_ENTRIES", async () => {
    vi.mocked(getLorebookEntryList).mockResolvedValue([]);

    const lorebook = makeLorebookReady({
      entries: [makeEntryIndex({ aliases: ["TheAlias"], filename: "ent.md" })],
    });
    const builder = makeBuilder();
    await builder.addLorebookToPrompt(lorebook);

    const content = getInjectContent(builder, "LOREBOOK_ENTRIES");
    expect(content).toContain("ent.md");
    expect(content).toContain("TheAlias");
  });

  it("injects the memories table into LOREBOOK_MEMORIES", async () => {
    vi.mocked(getLorebookEntryList).mockResolvedValue([]);

    const lorebook = makeLorebookReady({
      memories: [makeEntryIndex({ aliases: ["MemAlias"], filename: "mem.md" })],
    });
    const builder = makeBuilder();
    await builder.addLorebookToPrompt(lorebook);

    const content = getInjectContent(builder, "LOREBOOK_MEMORIES");
    expect(content).toContain("mem.md");
    expect(content).toContain("MemAlias");
  });

  it("calls getLorebookEntryList with the context filenames and lorebook id", async () => {
    vi.mocked(getLorebookEntryList).mockResolvedValue([]);

    const lorebook = makeLorebookReady({
      context: [makeLorebookIndex({ filename: "ctx.md" })],
      id: "lb-42",
    });
    await makeBuilder().addLorebookToPrompt(lorebook);

    expect(getLorebookEntryList).toHaveBeenCalledWith({
      files: ["ctx.md"],
      lorebookId: "lb-42",
    });
  });

  it("calls getLorebookEntryList with the constant filenames and lorebook id", async () => {
    vi.mocked(getLorebookEntryList).mockResolvedValue([]);

    const lorebook = makeLorebookReady({
      constants: [makeEntryIndex({ filename: "const.md" })],
      id: "lb-42",
    });
    await makeBuilder().addLorebookToPrompt(lorebook);

    expect(getLorebookEntryList).toHaveBeenCalledWith({
      files: ["const.md"],
      lorebookId: "lb-42",
    });
  });
});
