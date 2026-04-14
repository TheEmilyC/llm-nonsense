"use server";

import { createId } from "@paralleldrive/cuid2";
import { generateText, Output, stepCountIs, streamText } from "ai";
import z from "zod";

import { createChatMessageContent, getChatSession } from "@/app/chat/_lib/data";
import { ChatForMemoryGen, LlmnUIMessage } from "@/app/chat/_lib/schema";
import { getLorebookById } from "@/app/lorebook/_lib/data";
import { LorebookReady, LorebookStatus } from "@/app/lorebook/_lib/schema";
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
  const lorebook = chat.lorebookId
    ? await getLorebookById(chat.lorebookId)
    : undefined;

  const prompt = await buildPromptFromChat({
    chat,
    regenerate,
  });

  const { maxSteps, temperature, topK, topP } = chat.prompt;
  const maxOutputTokens = chat.prompt.maxOutputTokens ?? undefined;

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
      ...(lorebook?.status === LorebookStatus.Ready && {
        getLorebookEntries: makeGetLorebookEntriesTool(lorebook),
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
  const prompt = buildSummaryPrompt(chat.messages, lorebook);
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
