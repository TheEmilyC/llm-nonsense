"use server";

import { createId } from "@paralleldrive/cuid2";
import { generateText, Output, stepCountIs, streamText } from "ai";
import z from "zod";

import { getCharacterRecord } from "@/app/character/_lib/data";
import { CharacterRecord } from "@/app/character/_lib/schema";
import {
  createChatMessageContent,
  getBasicChatSession,
  getChatForMemoryGen,
  getStoryChatSession,
  hideChatMessages,
} from "@/app/chat/_lib/data";
import {
  chatSummaryInstructions,
  lorebookFactExtractionPrompt,
  lorebookSummaryTask,
} from "@/app/chat/_lib/prompts";
import {
  ChatForMemoryGen,
  ChatModelKey,
  LlmnUIMessage,
  StoryChatSession,
} from "@/app/chat/_lib/schema";
import {
  getLorebookById,
  getLorebookEntry,
  getLorebookEntryList,
} from "@/app/lorebook/_lib/data";
import { convertFilesToPrompt } from "@/app/lorebook/_lib/lorebook-scanning";
import {
  castOfCharactersPrompt,
  lorebookEntriesContextPrompt,
  lorebookMemoriesContextPrompt,
  prefetchPrompt,
  prefetchTaskPrompt,
} from "@/app/lorebook/_lib/prompts";
import { LorebookFact, LorebookReady } from "@/app/lorebook/_lib/schema";
import { makeGetLorebookEntriesTool } from "@/app/lorebook/_lib/tools";
import {
  BuilderChatMessage,
  BuilderFragment,
  BuilderRegex,
  PromptBuilder,
} from "@/app/prompt/_lib/prompt-builder";
import { chatModels, taskModels } from "@/lib/ai-registry";
import { SIDE_PROMPT_TOKEN_LIMIT } from "@/lib/env-variables";
import { AppError, LlmError, NotFoundError } from "@/lib/error";
import { logger } from "@/lib/logger";

export interface GenerateLorebookFactsParams {
  existingFacts?: LorebookFact[];
  messages: BuilderChatMessage[];
  previousScene: string;
}

interface BuildPromptFromChatParams {
  character: CharacterRecord;
  chat: StoryChatSession;
  lorebook?: LorebookReady;
  regenerate?: boolean;
}

interface BuildSummaryPromptParams {
  lastMemoryContent?: string;
  lorebook?: LorebookReady;
  messages: BuilderChatMessage[];
}

interface ConstructChatResponseParams {
  chatId: string;
  message: LlmnUIMessage;
  model: ChatModelKey;
  providedUserContentId?: string;
  regenerate?: boolean;
}

interface GenerateCastOfCharactersParams {
  messages: BuilderChatMessage[];
  previousCast?: string;
}

interface GenerateSummariesParams {
  chatId: string;
  messageIds: string[];
}

export async function constructBasicChatResponse({
  chatId,
  message,
  model,
  providedUserContentId,
  regenerate,
}: ConstructChatResponseParams) {
  if (!regenerate) {
    const userContentId = providedUserContentId ?? createId();
    await createChatMessageContent({
      chatId,
      messageContent: {
        id: userContentId,
        isActive: true,
        metadata: { contentId: userContentId },
        parts: message.parts,
        role: message.role,
      },
      messageId: message.id,
    });
  }

  const chat = await getBasicChatSession({ id: chatId });
  if (!chat) throw new NotFoundError("Chat", chatId);

  // messages are in desc order; for regenerate, drop the stale assistant response at index 0
  const historySlice = regenerate ? chat.messages.slice(1) : chat.messages;
  const messagesForLlm = [...historySlice].reverse().map((msg) => ({
    content: msg.content,
    role: msg.role as "assistant" | "system" | "user",
  }));

  const messageId =
    regenerate && chat.messages.length > 0 ? chat.messages[0].id : createId();
  const contentId = createId();

  logger.info("Basic chat generation request", { chatId, regenerate });
  return streamText({
    messages: messagesForLlm,
    model: chatModels[model],
  }).toUIMessageStreamResponse<LlmnUIMessage>({
    generateMessageId: () => messageId,
    messageMetadata: ({ part }) => {
      if (part.type === "start") return { contentId };
    },
    onFinish: async ({ messages: finished }) => {
      const sentMessage = finished[0];
      logger.info("Basic chat completion response", {
        chatId,
        regenerate,
        response: sentMessage,
      });
      if (!sentMessage.metadata) {
        throw new AppError("Sent message missing metadata", "INTERNAL_ERROR");
      }
      await createChatMessageContent({
        chatId,
        messageContent: {
          id: contentId,
          isActive: true,
          metadata: { ...sentMessage.metadata, model },
          parts: sentMessage.parts,
          role: sentMessage.role,
        },
        messageId,
      });
    },
  });
}

export async function constructChatResponse({
  chatId,
  message,
  model,
  providedUserContentId,
  regenerate,
}: ConstructChatResponseParams) {
  // the user message will already exist in the DB during regenerate
  if (!regenerate) {
    const userContentId = providedUserContentId ?? createId();
    await createChatMessageContent({
      chatId: chatId,
      messageContent: {
        id: userContentId,
        isActive: true,
        metadata: { contentId: userContentId },
        parts: message.parts,
        role: message.role,
      },
      messageId: message.id,
    });
  }

  const chat = await getStoryChatSession({ id: chatId });
  if (!chat) throw new NotFoundError("Chat", chatId);
  const lorebookRaw = chat.lorebookId
    ? await getLorebookById(chat.lorebookId)
    : undefined;
  const character = await getCharacterRecord(chat.character.id);
  if (!character) throw new NotFoundError("Character", chat.character.id);

  const lorebook = lorebookRaw?.status === "READY" ? lorebookRaw : undefined;

  const prompt = await buildPromptFromChat({
    character,
    chat,
    lorebook,
    regenerate,
  });

  const { maxSteps, temperature, topK, topP } = chat.prompt;
  const maxOutputTokens =
    chat.prompt.maxOutputTokens === 0 ? undefined : chat.prompt.maxOutputTokens;

  // create IDs ahead of time to support multiple content generations per message cleanly
  const messageId =
    regenerate && chat.messages.length > 0 ? chat.messages[0].id : createId();
  const contentId = createId();
  // --send and stream result--
  logger.info("Chat generation request", { chatId, prompt, regenerate });
  return streamText({
    maxOutputTokens,
    model: chatModels[model],
    prompt,
    providerOptions: {
      deepseek: {
        thinking: { enabled: true },
      },
      openrouter: {
        reasoning: { effort: "high" },
      },
    },
    stopWhen: stepCountIs(maxSteps),
    temperature,
    tools: {
      ...(lorebookRaw?.status === "READY" && {
        getLorebookEntries: makeGetLorebookEntriesTool(lorebookRaw),
      }),
    },
    topK,
    topP,
  }).toUIMessageStreamResponse<LlmnUIMessage>({
    generateMessageId: () => messageId,
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return { contentId };
      }
    },
    onFinish: async ({ messages }) => {
      const sentMessage = messages[0];
      logger.info("Chat completion response", {
        chatId,
        regenerate,
        response: sentMessage,
      });
      if (!sentMessage.metadata) {
        throw new AppError("Sent message missing metadata", "INTERNAL_ERROR");
      }
      await createChatMessageContent({
        chatId,
        messageContent: {
          id: contentId,
          isActive: true,
          metadata: { ...sentMessage.metadata, model },
          parts: sentMessage.parts,
          role: sentMessage.role,
        },
        messageId,
      });
    },
  });
}

export async function generateCastOfCharacters({
  messages,
  previousCast,
}: GenerateCastOfCharactersParams) {
  const promptSkeleton: BuilderFragment[] = [
    {
      content: castOfCharactersPrompt,
      role: "system",
      type: "CONTENT",
    },
  ];
  if (previousCast) {
    promptSkeleton.push({
      content: `<previous_cast>\n${previousCast}\n</previous_cast>`,
      role: "system",
      type: "CONTENT",
    });
  }

  promptSkeleton.push(
    {
      content: "<scene>",
      role: "system",
      type: "CONTENT",
    },
    {
      type: "CHAT_HISTORY",
    },
    {
      content: "</scene>",
      role: "user",
      type: "CONTENT",
    },
  );

  const promptBuilder = new PromptBuilder({
    maxTokens: SIDE_PROMPT_TOKEN_LIMIT,
    promptSkeleton,
  });

  promptBuilder.injectChatHistory(messages);

  const prompt = promptBuilder.build();
  logger.info("Cast of characters request", { prompt });
  try {
    const { output } = await generateText({
      model: taskModels.castOfCharacters,
      onFinish: (result) => {
        logger.info("Cast of characters result", {
          finishReason: result.finishReason,
          result: result.content,
        });
      },
      prompt,
    });
    return output;
  } catch (err) {
    throw new LlmError((err as Error).message);
  }
}

export async function generateLorebookFacts({
  existingFacts,
  messages,
  previousScene,
}: GenerateLorebookFactsParams) {
  const existingFactsBlock: BuilderFragment[] =
    existingFacts && existingFacts.length > 0
      ? [
          { content: `<existing_facts>`, role: "system", type: "CONTENT" },
          {
            content: existingFacts
              .map((f, i) => `${i + 1}. [${f.confidence}] ${f.claim}`)
              .join("\n"),
            role: "system",
            type: "CONTENT",
          },
          { content: `</existing_facts>`, role: "system", type: "CONTENT" },
        ]
      : [];

  const promptBuilder = new PromptBuilder({
    maxTokens: SIDE_PROMPT_TOKEN_LIMIT,
    promptSkeleton: [
      {
        content: lorebookFactExtractionPrompt,
        role: "system",
        type: "CONTENT",
      },
      { content: `<previous_scene_summary>`, role: "system", type: "CONTENT" },
      { content: previousScene, role: "system", type: "CONTENT" },
      { content: `</previous_scene_summary>`, role: "system", type: "CONTENT" },
      ...existingFactsBlock,
      { content: `<scene>`, role: "system", type: "CONTENT" },
      { type: "CHAT_HISTORY" },
      { content: `</scene>`, role: "user", type: "CONTENT" },
    ],
  });
  promptBuilder.injectChatHistory(messages);
  const prompt = promptBuilder.build();
  logger.info("Lorebook facts request", { prompt });
  try {
    const { output } = await generateText({
      model: taskModels.lorebookFactExtraction,
      onFinish: (result) => {
        logger.info("Lorebook facts response", {
          finishReason: result.finishReason,
          result: result.content,
        });
      },
      output: Output.object({
        schema: z.object({
          facts: z
            .object({
              claim: z.string(),
              confidence: z.enum(["explicit", "implied"]),
            })
            .array(),
        }),
      }),
      prompt,
    });
    return output?.facts;
  } catch (err) {
    throw new LlmError((err as Error).message);
  }
}

export async function generateMemorySummary(
  chat: ChatForMemoryGen,
  lorebook?: LorebookReady,
) {
  let lastMemoryContent: string | undefined;
  let lorebookForPrompt = lorebook;

  if (lorebook && lorebook.memories.length > 0) {
    const lastMemory = lorebook.memories[lorebook.memories.length - 1];
    lorebookForPrompt = {
      ...lorebook,
      memories: lorebook.memories.slice(0, -1),
    };
    const file = await getLorebookEntry({
      fileName: lastMemory.filename,
      lorebookId: lorebook.id,
    });
    lastMemoryContent = convertFilesToPrompt([file]);
  }

  const prompt = await buildSummaryPrompt({
    lastMemoryContent,
    lorebook: lorebookForPrompt,
    messages: chat.messages,
  });
  logger.info("Memory generation request", { prompt });

  try {
    const { output } = await generateText({
      model: taskModels.summary,
      onFinish: (result) => {
        logger.info("Memory generation result", {
          finishReason: result.finishReason,
          result: result.content,
        });
      },
      output: Output.object({
        schema: z.object({
          content: z.string(),
          synopsis: z
            .string()
            .describe("One or two sentences to describe the scene in an index"),
        }),
      }),
      prompt,
      stopWhen: stepCountIs(20),
      tools: {
        ...(lorebook && {
          getLorebookEntries: makeGetLorebookEntriesTool(lorebook),
        }),
      },
    });
    return output;
  } catch (err) {
    throw new LlmError((err as Error).message);
  }
}

export async function generateSummaries({
  chatId,
  messageIds,
}: GenerateSummariesParams) {
  const chat = await getChatForMemoryGen(chatId, messageIds);
  if (!chat) throw new NotFoundError("Chat", chatId);

  let lorebook: LorebookReady | undefined;
  let castContent: string | undefined;
  let previousScene: string | undefined;
  if (chat.lorebookId) {
    const lb = await getLorebookById(chat.lorebookId);
    if (!lb) {
      throw new NotFoundError("Lorebook", chat.lorebookId);
    }
    if (lb.status !== "READY") {
      lorebook = undefined;
    } else {
      lorebook = lb;
      if (lorebook) {
        if (lorebook.cast) {
          const castEntity = await getLorebookEntry({
            fileName: lorebook.cast.filename,
            lorebookId: lorebook.id,
          });
          castContent = convertFilesToPrompt([castEntity]);
        }
        if (lorebook.memories.length > 0) {
          const previousSceneEntry = await getLorebookEntry({
            fileName: lorebook.memories[lorebook.memories.length - 1].filename,
            lorebookId: lorebook.id,
          });
          previousScene = convertFilesToPrompt([previousSceneEntry]);
        }
      }
    }
  }

  const [memoryResult, castResult, factsResult] = await Promise.allSettled([
    generateMemorySummary(chat, lorebook),
    generateCastOfCharacters({
      messages: chat.messages,
      previousCast: castContent,
    }),
    generateLorebookFacts({
      existingFacts: chat.facts,
      messages: chat.messages,
      previousScene: previousScene ?? "No previous scene available",
    }),
  ]);
  await hideChatMessages(messageIds);
  return {
    cast: castResult.status === "fulfilled" ? castResult.value : undefined,
    facts: factsResult.status === "fulfilled" ? factsResult.value : undefined,
    memory:
      memoryResult.status === "fulfilled" ? memoryResult.value : undefined,
  };
}

async function buildPromptFromChat({
  character,
  chat,
  lorebook,
  regenerate,
}: BuildPromptFromChatParams): Promise<BuilderChatMessage[]> {
  const promptBuilder = new PromptBuilder({
    maxTokens: chat.prompt.maxTokens,
    promptSkeleton: chat.prompt.promptFragments.map((frag) =>
      frag.type === "INJECT" ? { ...frag, content: "" } : frag,
    ),
    regexes: chat.prompt.promptRegexes as BuilderRegex[],
    variables: {
      char: character.card.name,
      user: chat.persona?.name ?? "",
      world: chat.world?.name ?? "",
    },
  });

  const lastMessage = regenerate ? chat.messages[1] : chat.messages[0];

  const chatHistory = regenerate
    ? chat.messages.slice(2)
    : chat.messages.slice(1);

  promptBuilder.addToPrompt("LAST_MESSAGE", lastMessage.content);
  promptBuilder.addToPrompt(
    "CHARACTER_DESCRIPTION",
    character.card.description,
  );
  promptBuilder.addToPrompt(
    "CHARACTER_PERSONALITY",
    character.card.personality,
  );
  promptBuilder.addToPrompt("CHARACTER_SCENARIO", character.card.scenario);

  if (chat.persona) {
    promptBuilder.addToPrompt("PERSONA_DESCRIPTION", chat.persona.description);
  }
  if (chat.world) {
    promptBuilder.addToPrompt("WORLD_DESCRIPTION", chat.world.description);
  }
  if (lorebook) {
    if (chat.prompt.prefetch) {
      const entriesToFetch = await prefetchLorebook(lorebook, [
        lastMessage,
        ...chatHistory,
      ]);
      const fetchedFilenames = new Set(
        entriesToFetch?.map((e) => e.file) ?? [],
      );
      if (entriesToFetch && entriesToFetch.length > 0) {
        const entryFilenames = entriesToFetch
          .filter((e) => e.type === "entry")
          .map((e) => e.file);
        const memoryFilenames = entriesToFetch
          .filter((e) => e.type === "memory")
          .map((e) => e.file);
        const [entryFiles, memoryFiles] = await Promise.all([
          entryFilenames.length > 0
            ? getLorebookEntryList({
                files: entryFilenames,
                lorebookId: lorebook.id,
              })
            : [],
          memoryFilenames.length > 0
            ? getLorebookEntryList({
                files: memoryFilenames,
                lorebookId: lorebook.id,
              })
            : [],
        ]);
        const entryContent = convertFilesToPrompt(entryFiles);
        const memoryContent = convertFilesToPrompt(memoryFiles);
        if (entryContent)
          promptBuilder.addToPrompt("LOREBOOK_ENTRIES", entryContent);
        if (memoryContent)
          promptBuilder.addToPrompt("LOREBOOK_MEMORIES", memoryContent);
      }
      const filteredLorebook: LorebookReady = {
        ...lorebook,
        entries: lorebook.entries.filter(
          (e) => !fetchedFilenames.has(e.filename),
        ),
        memories: lorebook.memories.filter(
          (m) => !fetchedFilenames.has(m.filename),
        ),
      };
      await promptBuilder.addLorebookToPrompt(filteredLorebook);
    } else {
      await promptBuilder.addLorebookToPrompt(lorebook);
    }
  }
  promptBuilder.injectChatHistory(chatHistory);

  return promptBuilder.build();
}

async function buildSummaryPrompt({
  lastMemoryContent,
  lorebook,
  messages,
}: BuildSummaryPromptParams): Promise<BuilderChatMessage[]> {
  const promptSkeleton: BuilderFragment[] = [
    { content: chatSummaryInstructions, role: "system", type: "CONTENT" },
    { content: `<lore>`, role: "system", type: "CONTENT" },
    {
      content: "",
      injectTag: "LOREBOOK_ENTRIES",
      role: "system",
      type: "INJECT",
    },
    ...(lastMemoryContent
      ? [
          {
            content: lastMemoryContent,
            role: "system" as const,
            type: "CONTENT" as const,
          },
        ]
      : []),
    { content: "</lore>\n<scene>", role: "system", type: "CONTENT" },
    { type: "CHAT_HISTORY" },
    { content: "</scene>", role: "user", type: "CONTENT" },
    { content: lorebookSummaryTask, role: "user", type: "CONTENT" },
  ];

  const promptBuilder = new PromptBuilder({
    maxTokens: SIDE_PROMPT_TOKEN_LIMIT,
    promptSkeleton,
  });

  if (lorebook) {
    await promptBuilder.addLorebookToPrompt(lorebook);
  }

  promptBuilder.injectChatHistory(messages);
  return promptBuilder.build();
}

async function prefetchLorebook(
  lorebook: LorebookReady,
  messages: BuilderChatMessage[],
) {
  const promptBuilder = new PromptBuilder({
    maxTokens: SIDE_PROMPT_TOKEN_LIMIT,
    promptSkeleton: [
      {
        content: prefetchPrompt,
        role: "system",
        type: "CONTENT",
      },
      { content: `<lore>`, role: "system", type: "CONTENT" },
      {
        content: `<lorebook_entries>`,
        role: "system",
        type: "CONTENT",
      },
      {
        content: lorebookEntriesContextPrompt,
        role: "system",
        type: "CONTENT",
      },
      {
        content: "",
        injectTag: "LOREBOOK_ENTRIES",
        role: "system",
        type: "INJECT",
      },
      {
        content: `</lorebook_entries>`,
        role: "system",
        type: "CONTENT",
      },
      {
        content: `<lorebook_memories>`,
        role: "system",
        type: "CONTENT",
      },
      {
        content: lorebookMemoriesContextPrompt,
        role: "system",
        type: "CONTENT",
      },
      {
        content: "",
        injectTag: "LOREBOOK_MEMORIES",
        role: "system",
        type: "INJECT",
      },
      {
        content: `</lorebook_memories>`,
        role: "system",
        type: "CONTENT",
      },
      { content: "</lore>\n<scene>", role: "system", type: "CONTENT" },
      { type: "CHAT_HISTORY" },
      { content: "</scene>", role: "user", type: "CONTENT" },
      { content: prefetchTaskPrompt, role: "user", type: "CONTENT" },
    ],
  });
  await promptBuilder.addLorebookToPrompt(lorebook);
  promptBuilder.injectChatHistory(messages);
  const prompt = promptBuilder.build();

  logger.info("Prefetch lorebook entries request", { prompt });
  const { output } = await generateText({
    model: taskModels.lorebookPrefetch,
    onFinish: (result) => {
      logger.info("Prefetch lorebook entries result", {
        finishReason: result.finishReason,
        result: result.content,
      });
    },
    output: Output.object({
      schema: z
        .object({
          file: z.string().describe("The lorebook entry or memory file"),
          reason: z.string().describe("The reason this file was chosen"),
          type: z.enum(["entry", "memory"]),
        })
        .array(),
    }),
    prompt,
  });
  return output;
}
