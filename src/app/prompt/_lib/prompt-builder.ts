import { MessageRole } from "@/app/chat/_lib/schema";
import { PromptDto } from "@/app/prompt/_lib/schema";

export class PromptBuilder {
  currentTokens: number = 0;
  maxTokens: number;
  skeleton: { role: MessageRole }[];

  constructor(maxTokens: number, promptSkeleton: PromptDto) {
    this.maxTokens = maxTokens;
    
  }
}

function estimateTokensFast(text: string): number {
  return Math.ceil(text.length / 4);
}
