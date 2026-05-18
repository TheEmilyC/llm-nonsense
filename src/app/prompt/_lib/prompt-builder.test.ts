import { describe, expect, it } from "vitest";

import type { MessageRole } from "@/app/_shared/schema";
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

function regexFrag(pattern: string, target: BuilderRegex["target"]): BuilderRegex {
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
    expect(built.find((m) => m.role === "assistant")?.content).toBe("no STRIP change");
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
    expect(built.find((m) => m.role === "user")?.content).toBe("no STRIP change");
    expect(built.find((m) => m.role === "assistant")?.content).toBe("hello  world");
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
    expect(built.find((m) => m.role === "assistant")?.content).toBe("asst  msg");
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
    expect(builder.build().find((m) => m.role === "user")?.content).toBe("  baz");
  });

  it("silently ignores invalid regex patterns", () => {
    const builder = new PromptBuilder({
      maxTokens: 100,
      promptSkeleton: [chatHistoryFrag()],
      regexes: [regexFrag("[invalid(", "BOTH")],
    });
    builder.injectChatHistory([{ content: "hello", role: "user" }]);
    expect(() => builder.build()).not.toThrow();
    expect(builder.build().find((m) => m.role === "user")?.content).toBe("hello");
  });
});
