"use server";

import { createId } from "@paralleldrive/cuid2";
import { generateText, Output, stepCountIs, streamText } from "ai";
import z from "zod";

import { getCharacterRecord } from "@/app/character/_lib/data";
import { createChatMessageContent, getChatSession } from "@/app/chat/_lib/data";
import { ChatForMemoryGen, LlmnUIMessage } from "@/app/chat/_lib/schema";
import {
  getLorebookById,
  getLorebookEntryList,
} from "@/app/lorebook/_lib/data";
import { convertFilesToPrompt } from "@/app/lorebook/_lib/lorebook-scanning";
import { LorebookReady } from "@/app/lorebook/_lib/schema";
import { makeGetLorebookEntriesTool } from "@/app/lorebook/_lib/tools";
import {
  buildLorebookUpdatePrompt,
  buildPromptFromChat,
  buildSummaryPrompt,
} from "@/app/prompt/_lib/prompt-builder";
import { models } from "@/lib/ai-registry";
import { AppError, NotFoundError } from "@/lib/error";
import { logger } from "@/lib/logger";

interface ConstructChatResponseParams {
  chatId: string;
  message: LlmnUIMessage;
  regenerate?: boolean;
}

export async function constructChatResponse({
  chatId,
  message,
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
    const contextFileList = lorebook.context
      .sort((a, b) => a.position - b.position)
      .map((ctx) => ctx.filename);
    const constantFileList = lorebook.constants
      .sort((a, b) => a.position - b.position)
      .map((con) => con.filename);

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
    model: models.chat,
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
          metadata: sentMessage.metadata,
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
    model: models.lorebookUpdate,
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
    model: models.summary,
    onFinish: (result) => {
      logger.info("Memory Generation Result", {
        finishReason: result.finishReason,
        result: result.content,
      });
    },
    output: Output.object({
      schema: z.object({
        content: z.string(),
        synopsis: z
          .string()
          .describe("One or two scentences to describe the scene in an index "),
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
