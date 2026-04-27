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
  deepseek: deepseekProvider,
  openrouter: openRouterProvider,
});

export const chatModels = {
  deepseek: registry.languageModel("deepseek:deepseek-v4-pro"),
  gemini: registry.languageModel("openrouter:google/gemini-3.1-pro-preview"),
  glm: registry.languageModel("openrouter:z-ai/glm-5"),
  opus: registry.languageModel("openrouter:anthropic/claude-opus-4.7"),
};

export const taskModels = {
  castofCharacters: registry.languageModel("deepseek:deepseek-v4-pro"),
  lorebookPrefetch: registry.languageModel("deepseek:deepseek-v4-flash"),
  lorebookUpdate: registry.languageModel(
    "openrouter:anthropic/claude-sonnet-4.6",
  ),
  summary: registry.languageModel("deepseek:deepseek-v4-pro"),
};
