import { MessageRole } from "@/app/chat/_lib/schema";
import { PromptInjectTag } from "@/app/prompt/_lib/schema";

type ChatMessage = { content: string; role: MessageRole };

interface Fragment {
  content: string;
  injectTag?: PromptInjectTag;
  role: MessageRole;
}

type FragmentTokenCount = Fragment & { tokens: number };

export class PromptBuilder {
  chatHistory: ChatMessage[] = [];
  currentTokens: number = 0;
  maxTokens: number;
  prompt: FragmentTokenCount[] = [];

  constructor(maxTokens: number, promptSkeleton: Fragment[]) {
    this.maxTokens = maxTokens;
    for (const fragment of promptSkeleton) {
      const tokens = estimateTokens(fragment.content);
      if (!this.canAffordTokens(tokens))
        throw new Error("Prompt skeleton exceeds token limit");
      this.prompt.push({
        ...fragment,
        tokens,
      });
      this.currentTokens += tokens;
    }
  }

  addToPrompt(injectTag: PromptInjectTag, content: string) {
    const fragment = this.prompt.find((frag) => frag.injectTag === injectTag);
    if (!fragment) return;
    const tokens = estimateTokens(content);
    if (this.currentTokens + tokens > this.maxTokens)
      throw new Error("Content exceeds token limit");
    fragment.content += `\n${content}`;
    fragment.tokens += tokens;
    this.currentTokens += tokens;
  }

  build(): ChatMessage[] {
    return this.prompt.reduce<ChatMessage[]>((acc, fragment) => {
      if (fragment.injectTag === PromptInjectTag.chatHistory) {
        return acc.concat(this.chatHistory ?? []);
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
      (frag) => frag.injectTag === PromptInjectTag.chatHistory,
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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
