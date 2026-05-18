import { MessageRole } from "@/app/_shared/schema";
import { getLorebookEntryList } from "@/app/lorebook/_lib/data";
import { convertFilesToPrompt } from "@/app/lorebook/_lib/lorebook-scanning";
import { LorebookEntryIndex, LorebookReady } from "@/app/lorebook/_lib/schema";
import {
  ChatHistoryFragment,
  ContentFragment,
  InjectFragment,
  PromptInjectTag,
} from "@/app/prompt/_lib/schema";

export type BuilderChatMessage = { content: string; role: MessageRole };

export type BuilderFragment =
  | BuilderChatHistoryFragment
  | BuilderContentFragment
  | BuilderInjectFragment;

export type BuilderRegex = {
  pattern: string;
  target: "ASSISTANT" | "BOTH" | "USER";
};

type BuilderChatHistoryFragment = Pick<ChatHistoryFragment, "type">;

type BuilderContentFragment = Pick<
  ContentFragment,
  "content" | "role" | "type"
>;

type BuilderInjectFragment = Pick<
  InjectFragment,
  "injectTag" | "role" | "type"
> & {
  content: string;
};

type FragmentTokenCount = BuilderFragment & { tokens: number };

export class PromptBuilder {
  chatHistory: BuilderChatMessage[] = [];
  currentTokens: number = 0;
  maxTokens: number;
  prompt: FragmentTokenCount[] = [];
  regexes: BuilderRegex[] = [];
  variables: Record<string, string> = {};

  constructor({
    maxTokens,
    promptSkeleton,
    regexes,
    variables,
  }: {
    maxTokens: number;
    promptSkeleton: BuilderFragment[];
    regexes?: BuilderRegex[];
    variables?: Record<string, string>;
  }) {
    this.maxTokens = maxTokens;
    if (regexes) this.regexes = regexes;
    if (variables) this.variables = variables;
    for (const fragment of promptSkeleton) {
      if (fragment.type === "CHAT_HISTORY") {
        this.prompt.push({ ...fragment, tokens: 0 });
      }
      if (fragment.type === "INJECT") {
        this.prompt.push({
          ...fragment,
          content: "",
          injectTag: fragment.injectTag,
          tokens: 0,
        });
      }
      if (fragment.type === "CONTENT") {
        const hydratedContent = hydratePrompt(fragment.content, this.variables);
        const tokens = estimateTokens(hydratedContent);
        if (!this.canAffordTokens(tokens))
          throw new Error("Prompt skeleton exceeds token limit");
        this.prompt.push({ ...fragment, content: hydratedContent, tokens });
        this.currentTokens += tokens;
      }
    }
  }

  async addLorebookToPrompt(lorebook: LorebookReady) {
    const contextFileList = lorebook.context.map((ctx) => ctx.filename);
    const constantFileList = lorebook.constants.map((con) => con.filename);

    const [contextFiles, constantFiles] = await Promise.all([
      getLorebookEntryList({ files: contextFileList, lorebookId: lorebook.id }),
      getLorebookEntryList({
        files: constantFileList,
        lorebookId: lorebook.id,
      }),
    ]);
    const lorebookContext = convertFilesToPrompt(contextFiles);
    const lorebookConstants = convertFilesToPrompt(constantFiles);

    if (lorebookContext) this.addToPrompt("LOREBOOK_CONTEXT", lorebookContext);
    if (lorebookConstants)
      this.addToPrompt("LOREBOOK_CONSTANT", lorebookConstants);
    const entriesPrompt = buildLorePromptTable(lorebook.entries);
    this.addToPrompt("LOREBOOK_ENTRIES", entriesPrompt);
    const memoryPrompt = buildLorePromptTable(lorebook.memories);
    this.addToPrompt("LOREBOOK_MEMORIES", memoryPrompt);
  }

  addToPrompt(injectTag: PromptInjectTag, content: string) {
    const fragment = this.prompt.find(
      (frag) => frag.type === "INJECT" && frag.injectTag === injectTag,
    );
    if (!fragment || fragment.type !== "INJECT") return;
    const hydratedContent = hydratePrompt(content, this.variables);
    const tokens = estimateTokens(hydratedContent);
    if (this.currentTokens + tokens > this.maxTokens)
      throw new Error("Content exceeds token limit");
    fragment.content += `\n${hydratedContent}`;
    fragment.tokens += tokens;
    this.currentTokens += tokens;
  }

  build(): BuilderChatMessage[] {
    const messages = this.prompt.reduce<BuilderChatMessage[]>(
      (acc, fragment) => {
        if (fragment.type === "CHAT_HISTORY") {
          return acc.concat(this.chatHistory.reverse() ?? []);
        }

        const last = acc[acc.length - 1];
        if (last && last.role === fragment.role) {
          last.content += `\n${fragment.content}`;
        } else {
          acc.push({ content: fragment.content, role: fragment.role });
        }
        return acc;
      },
      [],
    );

    if (this.regexes.length === 0) return messages;

    return messages.map((msg) => {
      if (msg.role === "system") return msg;
      const content = this.regexes.reduce((text, { pattern, target }) => {
        if (target === "USER" && msg.role !== "user") return text;
        if (target === "ASSISTANT" && msg.role !== "assistant") return text;
        try {
          return text.replace(new RegExp(pattern, "g"), "");
        } catch {
          return text;
        }
      }, msg.content);
      return content === msg.content ? msg : { ...msg, content };
    });
  }

  canAfford(text: string): boolean {
    const tokens = estimateTokens(text);
    return this.canAffordTokens(tokens);
  }

  canAffordTokens(tokens: number): boolean {
    return this.currentTokens + tokens <= this.maxTokens;
  }

  injectChatHistory(messages: BuilderChatMessage[]) {
    const fragment = this.prompt.find((frag) => frag.type === "CHAT_HISTORY");
    if (!fragment) return;
    for (const message of messages) {
      const tokens = estimateTokens(message.content);
      if (!this.canAffordTokens(tokens)) return;
      this.chatHistory.push(message);
      fragment.tokens += tokens;
      this.currentTokens += tokens;
    }
  }
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

function buildLorePromptTable(entries: LorebookEntryIndex[]): string {
  if (entries.length === 0) return "";

  const rows = entries.map((ent) => {
    const alias = ent.aliases?.[0] ?? "—";
    const characters =
      ent.characters && ent.characters.length > 0
        ? ent.characters.join(", ")
        : "(none)";
    return `| ${ent.filename} | ${alias} | ${characters} |`;
  });

  const table =
    "| Filename | Alias | Characters |\n|----------|-------|------------|\n" +
    rows.join("\n");

  const details = entries
    .map((ent) => `### ${ent.filename}\n${ent.summary}`)
    .join("\n\n");

  return table + "\n\n" + details;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
