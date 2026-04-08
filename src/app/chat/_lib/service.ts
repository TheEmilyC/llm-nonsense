"use server";

import { createIdGenerator, stepCountIs, streamText, tool } from "ai";
import z from "zod";

import { getCharacterByIdOrFail } from "@/app/character/_lib/data";
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
import { convertFilesToPrompt } from "@/lib/lorebook-scanning";

interface BuildPromptFromChatParams {
  chat: ChatSessionDto;
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

export async function constructChatResponse(
  { chatId, message, regenerate }: ConstructChatResponseParams,
  { debug = false } = {},
) {
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
  if (!chat) throw new Error("Chat does not exist");
  const lorebook = chat.lorebookId
    ? await getLorebookById(chat.lorebookId)
    : undefined;

  const prompt = await buildPromptFromChat({
    chat,
  });
  if (debug) console.debug("prompt", prompt);

  // --send and stream result--
  return streamText({
    model: models.chat,
    onFinish: ({ response }) => {
      if (debug)
        console.debug("raw llm response", JSON.stringify(response, null, 2));
    },
    prompt: prompt,
    stopWhen: stepCountIs(20),
    tools: {
      ...(lorebook?.status === LorebookStatus.Ready && {
        getLorebookEntries: tool({
          description:
            "Retrive lore and character information from the lorebook",
          execute: async ({ entries }) => {
            if (debug)
              console.debug(
                `getLorebookEntries tool call, requesting: ${entries}`,
              );
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

async function buildPromptFromChat({ chat }: BuildPromptFromChatParams) {
  const character = await getCharacterByIdOrFail(chat.character.id);
  const lorebook = chat.lorebookId
    ? await getLorebookById(chat.lorebookId)
    : null;
  // TODO: return as part of chatSessionDTO
  const persona = await getPersonaByIdOrFail(chat.persona.id);
  const world = chat.world ? await getWorldById(chat.world.id) : null;

  const promptBuilder = new PromptBuilder({
    characterName: character.card.name,
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

  const lastMessage = messageDtoToAiMessage(chat.messages[0]);
  const chatHistory = chat.messages.slice(1);

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
