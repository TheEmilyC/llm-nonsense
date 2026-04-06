// lib/ai/registry.ts
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createProviderRegistry } from "ai";

const openRouterProvider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

const deepseekProvider = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
});

export const registry = createProviderRegistry({
  openrouter: openRouterProvider,
  deepseek: deepseekProvider,
});

// Helper to get specialized models for specific tasks
export const models = {
  chat: registry.languageModel("openrouter:anthropic/claude-sonnet-4.6"),
  deepseek: registry.languageModel("deepseek:deepseek-reasoner"),
};
