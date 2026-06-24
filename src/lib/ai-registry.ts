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
  fable: registry.languageModel("openrouter:anthropic/claude-fable-5"),
  gemini: registry.languageModel("openrouter:google/gemini-3.1-pro-preview"),
  glm: registry.languageModel("openrouter:z-ai/glm-5"),
  glm5_2: registry.languageModel("openrouter:z-ai/glm-5.2"),
  kimi: registry.languageModel("openrouter:moonshotai/kimi-k2.6"),
  opus4_6: registry.languageModel("openrouter:anthropic/claude-opus-4.6"),
  opus4_7: registry.languageModel("openrouter:anthropic/claude-opus-4.7"),
};

export const taskModels = {
  castOfCharacters: registry.languageModel("deepseek:deepseek-v4-pro"),
  lorebookFactExtraction: registry.languageModel("deepseek:deepseek-v4-pro"),
  lorebookPrefetch: registry.languageModel(
    "openrouter:~anthropic/claude-haiku-latest",
  ),
  lorebookUpdateDiscovery: registry.languageModel("deepseek:deepseek-v4-flash"),
  lorebookUpdateSuggestion: registry.languageModel("deepseek:deepseek-v4-pro"),
  summary: registry.languageModel("deepseek:deepseek-v4-pro"),
};
