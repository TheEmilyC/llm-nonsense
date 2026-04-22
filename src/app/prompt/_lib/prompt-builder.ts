import { MessageRole } from "@/app/_shared/schema";
import { LorebookEntryIndex } from "@/app/lorebook/_lib/schema";
import {
  ChatHistoryFragment,
  ContentFragment,
  InjectFragment,
  PromptInjectTag,
} from "@/app/prompt/_lib/schema";

export type BuilderChatMessage = { content: string; role: MessageRole };

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

type Fragment =
  | BuilderChatHistoryFragment
  | BuilderContentFragment
  | BuilderInjectFragment;

type FragmentTokenCount = Fragment & { tokens: number };

export class PromptBuilder {
  chatHistory: BuilderChatMessage[] = [];
  currentTokens: number = 0;
  maxTokens: number;
  prompt: FragmentTokenCount[] = [];
  variables: Record<string, string> = {};

  constructor({
    maxTokens,
    promptSkeleton,
    variables,
  }: {
    maxTokens: number;
    promptSkeleton: Fragment[];
    variables?: Record<string, string>;
  }) {
    this.maxTokens = maxTokens;
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
        const hydreatedContent = hydratePrompt(
          fragment.content,
          this.variables,
        );
        const tokens = estimateTokens(hydreatedContent);
        if (!this.canAffordTokens(tokens))
          throw new Error("Prompt skeleton exceeds token limit");
        this.prompt.push({ ...fragment, content: hydreatedContent, tokens });
        this.currentTokens += tokens;
      }
    }
  }

  addToPrompt(injectTag: PromptInjectTag, content: string) {
    const fragment = this.prompt.find(
      (frag) => frag.type === "INJECT" && frag.injectTag === injectTag,
    );
    if (!fragment || fragment.type !== "INJECT") return;
    const hydreatedContent = hydratePrompt(content, this.variables);
    const tokens = estimateTokens(hydreatedContent);
    if (this.currentTokens + tokens > this.maxTokens)
      throw new Error("Content exceeds token limit");
    fragment.content += `\n${hydreatedContent}`;
    fragment.tokens += tokens;
    this.currentTokens += tokens;
  }

  build(): BuilderChatMessage[] {
    return this.prompt.reduce<BuilderChatMessage[]>((acc, fragment) => {
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
    }, []);
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

export function buildLorePromptTable(entries: LorebookEntryIndex[]): string {
  let entriesPrompt = "";
  if (entries.length > 0) {
    entriesPrompt +=
      "| File Name | Aliases | Relevant Characters | Summary |\n| --- | --- | --- | --- |\n";
    entriesPrompt += entries
      .map(
        (ent) =>
          `| ${ent.filename} | ${ent.aliases?.join(", ")} | ${ent.characters?.join(", ")} | ${ent.summary} |`,
      )
      .join("\n");
  }

  return entriesPrompt;
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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
