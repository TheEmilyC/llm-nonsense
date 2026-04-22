"use server";

import { createId } from "@paralleldrive/cuid2";
import { generateText, Output, stepCountIs, streamText } from "ai";
import z from "zod";

import { getCharacterRecord } from "@/app/character/_lib/data";
import { CharacterRecord } from "@/app/character/_lib/schema";
import { createChatMessageContent, getChatSession } from "@/app/chat/_lib/data";
import {
  lorebookUpdatePrompt,
  summaryInstructions,
} from "@/app/chat/_lib/prompts";
import {
  ChatForMemoryGen,
  ChatModelKey,
  ChatSession,
  LlmnUIMessage,
} from "@/app/chat/_lib/schema";
import {
  getLorebookById,
  getLorebookEntryList,
} from "@/app/lorebook/_lib/data";
import { convertFilesToPrompt } from "@/app/lorebook/_lib/lorebook-scanning";
import { LorebookReady } from "@/app/lorebook/_lib/schema";
import { makeGetLorebookEntriesTool } from "@/app/lorebook/_lib/tools";
import {
  BuilderChatMessage,
  buildLorePromptTable,
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
  lorebookConstants?: string;
  lorebookContext?: string;
  regenerate?: boolean;
}

interface BuildSummaryPromptParams {
  lorebook?: LorebookReady;
  lorebookConstants?: string;
  lorebookContext?: string;
  messages: BuilderChatMessage[];
}

interface BuildSummaryPromptParams {
  lorebook?: LorebookReady;
  lorebookConstants?: string;
  lorebookContext?: string;
  messages: BuilderChatMessage[];
}

interface ConstructChatResponseParams {
  chatId: string;
  message: LlmnUIMessage;
  model: ChatModelKey;
  regenerate?: boolean;
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

  // get lorebook context and constants
  let lorebookConstants: string | undefined;
  let lorebookContext: string | undefined;
  if (lorebook) {
    const contextFileList = lorebook.context.map((ctx) => ctx.filename);
    const constantFileList = lorebook.constants.map((con) => con.filename);

    const [contextFiles, constantFiles] = await Promise.all([
      getLorebookEntryList({ files: contextFileList, lorebookId: lorebook.id }),
      getLorebookEntryList({
        files: constantFileList,
        lorebookId: lorebook.id,
      }),
    ]);
    lorebookContext = convertFilesToPrompt(contextFiles);
    lorebookConstants = convertFilesToPrompt(constantFiles);
  }

  const prompt = await buildPromptFromChat({
    character,
    chat,
    lorebook,
    lorebookConstants,
    lorebookContext,
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

export async function generateLorebookUpdates(
  chat: ChatForMemoryGen,
  lorebook: LorebookReady,
) {
  const prompt = buildLorebookUpdatePrompt(chat.messages, lorebook);
  logger.info("Lorebook update request", { prompt });
  const { output } = await generateText({
    model: taskModels.lorebookUpdate,
    onFinish: (result) => {
      logger.info("Memory Generation Result", {
        finishReason: result.finishReason,
        result: result.content,
      });
    },
    output: Output.object({
      schema: z
        .object({
          content: z.string().describe("Lorebook update suggestions"),
          file: z
            .string()
            .optional()
            .describe("The path to an existing lorebook entry if updating"),
          synopsis: z
            .string()
            .optional()
            .describe(
              "One or two scentences to describe the entry if it is new or should change",
            ),
        })
        .array(),
    }),
    prompt,
    providerOptions: {
      openrouter: {
        reasoning: { effort: "medium" },
      },
    },
    stopWhen: stepCountIs(20),
    tools: {
      ...(lorebook && {
        getLorebookEntries: makeGetLorebookEntriesTool(lorebook),
      }),
    },
  });
  return output;
}

export async function generateMemorySummary(
  chat: ChatForMemoryGen,
  lorebook?: LorebookReady,
) {
  const prompt = buildSummaryPrompt({ lorebook, messages: chat.messages });
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

function buildLorebookUpdatePrompt(
  messages: BuilderChatMessage[],
  lorebook: LorebookReady,
) {
  const promptBuilder = new PromptBuilder({
    maxTokens: SIDE_PROMPT_TOKEN_LIMIT,
    promptSkeleton: [
      {
        content: lorebookUpdatePrompt,
        role: "system",
        type: "CONTENT",
      },
      {
        content: `<lore>`,
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
        content: "</lore>\n<scene>",
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
    ],
  });

  const lorebookPrompt = lorebook.entries
    .map((idx) => `${idx.filename}  -  ${idx.summary}`)
    .join("\n");
  promptBuilder.addToPrompt("LOREBOOK_ENTRIES", lorebookPrompt);

  promptBuilder.injectChatHistory(messages);
  return promptBuilder.build();
}

async function buildPromptFromChat({
  character,
  chat,
  lorebook,
  lorebookConstants,
  lorebookContext,
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
    if (lorebookContext)
      promptBuilder.addToPrompt("LOREBOOK_CONTEXT", lorebookContext);
    if (lorebookConstants)
      promptBuilder.addToPrompt("LOREBOOK_CONSTANT", lorebookConstants);
    const entriesPrompt = buildLorePromptTable(lorebook.entries);
    promptBuilder.addToPrompt("LOREBOOK_ENTRIES", entriesPrompt);
    const memoryPrompt = buildLorePromptTable(lorebook.memories);
    promptBuilder.addToPrompt("LOREBOOK_MEMORIES", memoryPrompt);
  }
  promptBuilder.injectChatHistory(chatHistory);

  return promptBuilder.build();
}

function buildSummaryPrompt({
  lorebook,
  lorebookConstants,
  lorebookContext,
  messages,
}: BuildSummaryPromptParams): BuilderChatMessage[] {
  // TODO: Remove hardcoded prompt
  const promptBuilder = new PromptBuilder({
    maxTokens: SIDE_PROMPT_TOKEN_LIMIT,
    promptSkeleton: [
      {
        content: summaryInstructions,
        role: "system",
        type: "CONTENT",
      },
      {
        content: `<lore>`,
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
        content: "</lore>\n<scene>",
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
    ],
  });

  if (lorebook) {
    if (lorebookContext)
      promptBuilder.addToPrompt("LOREBOOK_CONTEXT", lorebookContext);
    if (lorebookConstants)
      promptBuilder.addToPrompt("LOREBOOK_CONSTANT", lorebookConstants);
    const entriesPrompt = buildLorePromptTable(lorebook.entries);
    promptBuilder.addToPrompt("LOREBOOK_ENTRIES", entriesPrompt);
    const memoryPrompt = buildLorePromptTable(lorebook.memories);
    promptBuilder.addToPrompt("LOREBOOK_MEMORIES", memoryPrompt);
  }

  promptBuilder.injectChatHistory(messages);
  return promptBuilder.build();
}
