"use server";

import { createIdGenerator, generateText, stepCountIs, streamText } from "ai";

import { createChatMessageContent, getChatSession } from "@/app/chat/_lib/data";
import { ChatForMemoryGen, MessagePart } from "@/app/chat/_lib/schema";
import { getLorebookById } from "@/app/lorebook/_lib/data";
import { LorebookReady, LorebookStatus } from "@/app/lorebook/_lib/schema";
import { makeGetLorebookEntriesTool } from "@/app/lorebook/_lib/tools";
import {
  buildPromptFromChat,
  buildSummaryPrompt,
} from "@/app/prompt/_lib/prompt-builder";
import { models } from "@/lib/ai-registry";
import { NotFoundError } from "@/lib/error";

interface ConstructChatResponseParams {
  chatId: string;
  message: {
    id: string;
    parts: MessagePart[];
    role: "assistant" | "system" | "user";
  };
  regenerate?: boolean;
}

export async function constructChatResponse({
  chatId,
  message,
  regenerate,
}: ConstructChatResponseParams) {
  // the user message will already exist in the DB during regenerate
  if (!regenerate)
    await createChatMessageContent({
      chatId: chatId,
      messageContent: {
        id: message.id,
        isActive: true,
        parts: message.parts,
        role: message.role,
      },
    });

  const chat = await getChatSession({ id: chatId });
  if (!chat) throw new NotFoundError("Chat", chatId);
  const lorebook = chat.lorebookId
    ? await getLorebookById(chat.lorebookId)
    : undefined;

  const prompt = await buildPromptFromChat({
    chat,
    regenerate,
  });

  const { maxOutputTokens, maxSteps, temperature, topK, topP } = chat.prompt;

  // --send and stream result--
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
  }).toUIMessageStreamResponse({
    generateMessageId: createIdGenerator({
      prefix: "msg",
      size: 16,
    }),
    onFinish: async ({ messages }) => {
      const sentMessage = messages[0];
      let messageId = undefined;
      if (regenerate && chat.messages.length > 0)
        messageId = chat.messages[0].id;
      await createChatMessageContent({
        chatId,
        messageContent: {
          id: sentMessage.id,
          isActive: true,
          parts: sentMessage.parts,
          role: sentMessage.role,
        },
        messageId,
      });
    },
  });
}

export async function generateMemorySummary(
  chat: ChatForMemoryGen,
  lorebook?: LorebookReady,
) {
  const prompt = buildSummaryPrompt(chat.messages, lorebook);
  const { finishReason, text } = await generateText({
    model: models.summary,
    onStepFinish: (stepResult) => {
      console.log("Step Result", stepResult.content);
    },
    prompt,
    stopWhen: stepCountIs(20),
    tools: {
      ...(lorebook && {
        getLorebookEntries: makeGetLorebookEntriesTool(lorebook),
      }),
    },
  });
  console.log("finishReason", finishReason);
  return text;
}
