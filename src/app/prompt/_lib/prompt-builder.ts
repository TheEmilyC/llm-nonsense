import { MessageRole } from "@/app/_shared/schema";
import { PromptFragmentType, PromptInjectTag } from "@/app/prompt/_lib/schema";

type ChatHistoryFragment = {
  type: PromptFragmentType.chatHistory;
};

type ChatMessage = { content: string; role: MessageRole };

type ContentFragment = {
  content: string;
  role: MessageRole;
  type: PromptFragmentType.content;
};

type Fragment = ChatHistoryFragment | ContentFragment | InjectFragment;

type FragmentTokenCount = Fragment & { tokens: number };

type InjectFragment = {
  content: string;
  injectTag: PromptInjectTag;
  role: MessageRole;
  type: PromptFragmentType.inject;
};

export class PromptBuilder {
  chatHistory: ChatMessage[] = [];
  currentTokens: number = 0;
  maxTokens: number;
  prompt: FragmentTokenCount[] = [];
  variables: Record<string, string> = {};

  constructor({
    characterName,
    maxTokens,
    personaName,
    promptSkeleton,
    worldName,
  }: {
    characterName?: string;
    maxTokens: number;
    personaName?: string;
    promptSkeleton: Fragment[];
    worldName?: string;
  }) {
    this.maxTokens = maxTokens;
    this.variables["char"] = characterName ?? "";
    this.variables["user"] = personaName ?? "";
    this.variables["world"] = worldName ?? "";
    for (const fragment of promptSkeleton) {
      if (fragment.type === PromptFragmentType.chatHistory) {
        this.prompt.push({ ...fragment, tokens: 0 });
      }
      if (fragment.type === PromptFragmentType.inject) {
        this.prompt.push({
          ...fragment,
          content: "",
          injectTag: fragment.injectTag,
          tokens: 0,
        });
      }
      if (fragment.type === PromptFragmentType.content) {
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
      (frag) =>
        frag.type === PromptFragmentType.inject && frag.injectTag === injectTag,
    );
    if (!fragment || fragment.type !== PromptFragmentType.inject) return;
    const hydreatedContent = hydratePrompt(content, this.variables);
    const tokens = estimateTokens(hydreatedContent);
    if (this.currentTokens + tokens > this.maxTokens)
      throw new Error("Content exceeds token limit");
    fragment.content += `\n${hydreatedContent}`;
    fragment.tokens += tokens;
    this.currentTokens += tokens;
  }

  build(): ChatMessage[] {
    return this.prompt.reduce<ChatMessage[]>((acc, fragment) => {
      if (fragment.type === PromptFragmentType.chatHistory) {
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

  injectChatHistory(messages: ChatMessage[]) {
    const fragment = this.prompt.find(
      (frag) => frag.type === PromptFragmentType.chatHistory,
    );
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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
