"use server";

import { createId } from "@paralleldrive/cuid2";
import { generateText, Output, stepCountIs, streamText } from "ai";
import z from "zod";

import { getCharacterRecord } from "@/app/character/_lib/data";
import { CharacterRecord } from "@/app/character/_lib/schema";
import {
  createChatMessageContent,
  getChatForMemoryGen,
  getChatSession,
  hideChatMessages,
} from "@/app/chat/_lib/data";
import {
  ChatForMemoryGen,
  ChatModelKey,
  ChatSession,
  LlmnUIMessage,
} from "@/app/chat/_lib/schema";
import { getLorebookById, getLorebookEntry } from "@/app/lorebook/_lib/data";
import { convertFilesToPrompt } from "@/app/lorebook/_lib/lorebook-scanning";
import {
  castOfCharactersPrompt,
  summaryInstructions,
} from "@/app/lorebook/_lib/promps";
import { Lorebook, LorebookReady } from "@/app/lorebook/_lib/schema";
import { makeGetLorebookEntriesTool } from "@/app/lorebook/_lib/tools";
import {
  BuilderChatMessage,
  BuilderFragment,
  PromptBuilder,
} from "@/app/prompt/_lib/prompt-builder";
import { chatModels, taskModels } from "@/lib/ai-registry";
import { SIDE_PROMPT_TOKEN_LIMIT } from "@/lib/env-variables";
import { AppError, NotFoundError } from "@/lib/error";
import { logger } from "@/lib/logger";

interface BuildPromptFromChatParams {
  character: CharacterRecord;
  chat: ChatSession;
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

export async function constructChatResponse({
  chatId,
  message,
  model,
  regenerate,
}: ConstructChatResponseParams) {
  // the user message will already exist in the DB during regenerate
  if (!regenerate) {
    const userContentId = createId();
    await createChatMessageContent({
      chatId: chatId,
      messageContent: {
        id: userContentId,
        isActive: true,
        metadata: { contentId: userContentId },
        parts: message.parts,
        role: message.role,
      },
    });
  }

  const chat = await getChatSession({ id: chatId });
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
      content: previousCast,
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
  const { output } = await generateText({
    model: taskModels.summary,
    onFinish: (result) => {
      logger.info("Cast of characters result", {
        finishReason: result.finishReason,
        result: result.content,
      });
    },
    prompt,
  });
  return output;
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
          .describe("One or two scentences to describe the scene in an index"),
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
}

export async function generateSummaries({
  chatId,
  messageIds,
}: GenerateSummariesParams) {
  const chat = await getChatForMemoryGen(chatId, messageIds);
  if (!chat) throw new NotFoundError("Chat", chatId);

  let lorebook: Lorebook | null = null;
  let castContent: string | undefined;
  if (chat.lorebookId) {
    lorebook = await getLorebookById(chat.lorebookId);
    if (!lorebook) {
      throw new NotFoundError("Lorebook", chat.lorebookId);
    }
    if (lorebook.status !== "READY") {
      lorebook = null;
    }
    if (lorebook && lorebook.cast) {
      const castEntity = await getLorebookEntry({
        fileName: lorebook.cast.filename,
        lorebookId: lorebook.id,
      });
      castContent = convertFilesToPrompt([
        { ...castEntity, title: "previous_cast_of_characters" },
      ]);
    }
  }

  const [memory, cast] = await Promise.all([
    generateMemorySummary(chat, lorebook ?? undefined),
    generateCastOfCharacters({
      messages: chat.messages,
      previousCast: castContent,
    }),
  ]);
  await hideChatMessages(messageIds);
  return { cast, memory };
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
    await promptBuilder.addLorebookToPrompt(lorebook);
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
    { content: summaryInstructions, role: "system", type: "CONTENT" },
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
