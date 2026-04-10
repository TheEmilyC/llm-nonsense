"use server";

import { createIdGenerator, stepCountIs, streamText, tool } from "ai";
import z from "zod";

import { getCharacterById } from "@/app/character/_lib/data";
import { createChatMessageContent, getChatSession } from "@/app/chat/_lib/data";
import {
  ChatSessionDto,
  messageDtoToAiMessage,
  MessagePart,
} from "@/app/chat/_lib/schema";
import {
  getLorebookById,
  getLorebookEntryList,
} from "@/app/lorebook/_lib/data";
import { LorebookStatus } from "@/app/lorebook/_lib/schema";
import { getPersonaByIdOrFail } from "@/app/persona/_lib/data";
import { PromptBuilder } from "@/app/prompt/_lib/prompt-builder";
import { PromptFragmentType, PromptInjectTag } from "@/app/prompt/_lib/schema";
import { getWorldById } from "@/app/world/_lib/data";
import { models } from "@/lib/ai/registry";
import { NotFoundError } from "@/lib/error";
import { convertFilesToPrompt } from "@/lib/lorebook-scanning";

interface BuildPromptFromChatParams {
  chat: ChatSessionDto;
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
  const character = await getCharacterById(chat.character.id);
  if (!character) throw new NotFoundError("Character", chat.character.id);
  const lorebook = chat.lorebookId
    ? await getLorebookById(chat.lorebookId)
    : null;
  // TODO: return as part of chatSessionDTO
  const persona = await getPersonaByIdOrFail(chat.persona.id);
  const world = chat.world ? await getWorldById(chat.world.id) : null;

  const promptBuilder = new PromptBuilder({
    characterName: character.name,
    maxTokens: chat.prompt.maxTokens,
    personaName: persona.name,
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
    worldName: world?.name,
  });

  const lastMessage = messageDtoToAiMessage(
    regenerate ? chat.messages[1] : chat.messages[0],
  );
  const chatHistory = regenerate
    ? chat.messages.slice(2)
    : chat.messages.slice(1);

  promptBuilder.addToPrompt(PromptInjectTag.lastMessage, lastMessage.content);
  promptBuilder.addToPrompt(
    PromptInjectTag.characterDescription,
    character.description,
  );
  promptBuilder.addToPrompt(
    PromptInjectTag.characterPersonality,
    character.personality,
  );
  promptBuilder.addToPrompt(
    PromptInjectTag.characterScenario,
    character.scenario,
  );

  promptBuilder.addToPrompt(
    PromptInjectTag.personaDescription,
    persona.description,
  );
  if (world) {
    promptBuilder.addToPrompt(
      PromptInjectTag.worldDescription,
      world.description,
    );
  }
  if (lorebook && lorebook.status === LorebookStatus.Ready) {
    const lorebookPrompt = lorebook.index
      .map((idx) => `${idx.filename}  -  ${idx.summary}`)
      .join("\n");
    promptBuilder.addToPrompt(PromptInjectTag.lorebook, lorebookPrompt);
  }
  const modelMessages = chatHistory.map((msg) => messageDtoToAiMessage(msg));
  promptBuilder.injectChatHistory(modelMessages);

  return promptBuilder.build();
}
