"use server";

import { createIdGenerator, stepCountIs, streamText, tool } from "ai";
import z from "zod";

import { getCharacterRecord } from "@/app/character/_lib/data";
import { createChatMessageContent, getChatSession } from "@/app/chat/_lib/data";
import { ChatSession, MessagePart } from "@/app/chat/_lib/schema";
import {
  getLorebookById,
  getLorebookEntryList,
} from "@/app/lorebook/_lib/data";
import { convertFilesToPrompt } from "@/app/lorebook/_lib/lorebook-scanning";
import { LorebookStatus } from "@/app/lorebook/_lib/schema";
import { PromptBuilder } from "@/app/prompt/_lib/prompt-builder";
import { PromptFragmentType, PromptInjectTag } from "@/app/prompt/_lib/schema";
import { models } from "@/lib/ai-registry";
import { NotFoundError } from "@/lib/error";

interface BuildPromptFromChatParams {
  chat: ChatSession;
  regenerate?: boolean;
}

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
        getLorebookEntries: tool({
          description:
            "Retrive lore and character information from the lorebook",
          execute: async ({ entries }) => {
            const files = await getLorebookEntryList({
              files: entries,
              lorebookId: lorebook.id,
            });
            return convertFilesToPrompt({ files });
          },
          inputSchema: z.object({
            entries: z
              .string()
              .array()
              .describe("A list of lorebook entry paths to retrive"),
          }),
        }),
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

async function buildPromptFromChat({
  chat,
  regenerate,
}: BuildPromptFromChatParams) {
  const character = await getCharacterRecord(chat.character.id);
  if (!character) throw new NotFoundError("Character", chat.character.id);
  const lorebook = chat.lorebookId
    ? await getLorebookById(chat.lorebookId)
    : null;

  const promptBuilder = new PromptBuilder({
    characterName: character.card.name,
    maxTokens: chat.prompt.maxTokens,
    personaName: chat.persona?.name ?? "",
    promptSkeleton: chat.prompt.promptFragments.map((frag) =>
      frag.type === PromptFragmentType.chatHistory
        ? { type: PromptFragmentType.chatHistory }
        : frag.type === PromptFragmentType.content
          ? frag
          : {
              content: "",
              injectTag: frag.injectTag,
              role: frag.role,
              type: PromptFragmentType.inject,
            },
    ),
    worldName: chat.world?.name,
  });

  const lastMessage = regenerate ? chat.messages[1] : chat.messages[0];

  const chatHistory = regenerate
    ? chat.messages.slice(2)
    : chat.messages.slice(1);

  promptBuilder.addToPrompt(PromptInjectTag.lastMessage, lastMessage.content);
  promptBuilder.addToPrompt(
    PromptInjectTag.characterDescription,
    character.card.description,
  );
  promptBuilder.addToPrompt(
    PromptInjectTag.characterPersonality,
    character.card.personality,
  );
  promptBuilder.addToPrompt(
    PromptInjectTag.characterScenario,
    character.card.scenario,
  );

  if (chat.persona) {
    promptBuilder.addToPrompt(
      PromptInjectTag.personaDescription,
      chat.persona.description,
    );
  }
  if (chat.world) {
    promptBuilder.addToPrompt(
      PromptInjectTag.worldDescription,
      chat.world.description,
    );
  }
  if (lorebook && lorebook.status === LorebookStatus.Ready) {
    const lorebookPrompt = lorebook.index
      .map((idx) => `${idx.filename}  -  ${idx.summary}`)
      .join("\n");
    promptBuilder.addToPrompt(PromptInjectTag.lorebook, lorebookPrompt);
  }
  promptBuilder.injectChatHistory(chatHistory);

  return promptBuilder.build();
}
