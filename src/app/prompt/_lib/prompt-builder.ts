import { MessageRole } from "@/app/chat/_lib/schema";
import { PromptInjectTag } from "@/app/prompt/_lib/schema";

interface Fragment {
  role: MessageRole;
  injectTag?: PromptInjectTag;
  content: string;
}

type FragmentTokenCount = Fragment & { tokens: number };

export class PromptBuilder {
  currentTokens: number = 0;
  maxTokens: number;
  prompt: FragmentTokenCount[] = [];

  constructor(maxTokens: number, promptSkeleton: Fragment[]) {
    this.maxTokens = maxTokens;
    for (let fragment of promptSkeleton) {
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

  canAfford(text: string): boolean {
    const tokens = estimateTokens(text);
    return this.canAffordTokens(tokens);
  }

  canAffordTokens(tokens: number): boolean {
    return this.currentTokens + tokens <= this.maxTokens;
  }

  build(): { content: string; role: MessageRole }[] {
    return this.prompt.reduce<{ content: string; role: MessageRole }[]>(
      (acc, fragment) => {
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
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
