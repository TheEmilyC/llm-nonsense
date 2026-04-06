"use server";

import { getCharacterByIdOrFail } from "@/app/character/_lib/data";
import {
  createChatMessageContent,
  getMessagesForChat,
} from "@/app/chat/_lib/data";
import { messageDtoToUIMessage, MessagePart } from "@/app/chat/_lib/schema";
import {
  getLorebookById,
  getLorebookEntryList,
} from "@/app/lorebook/_lib/data";
import { LorebookStatus, ObsidianFile } from "@/app/lorebook/_lib/schema";
import { getPersonaByIdOrFail } from "@/app/persona/_lib/data";
import { getWorldById } from "@/app/world/_lib/data";
import {
  assemblePrompts,
  constructPromptMessages,
} from "@/lib/ai/prompt-manager";
import { models } from "@/lib/ai/registry";
import { LOREBOOK_SCAN_DEPTH } from "@/lib/constants";
import { USE_LOREBOOK_TOOLCALL } from "@/lib/env-variables";
import {
  convertFilesToPrompt,
  IndexEntry,
  scanLorebookIndex,
} from "@/lib/lorebook-scanning";
import {
  convertToModelMessages,
  createIdGenerator,
  ModelMessage,
  stepCountIs,
  streamText,
  TextPart,
  tool,
} from "ai";
import z from "zod";
import { MessageRole } from "../../../../generated/enums";

interface ConstructChatResponseParams {
  chatId: string;
  regenerate?: boolean;
  message: {
    id: string;
    role: "user" | "assistant" | "system";
    parts: MessagePart[];
  };
}

interface BuildPromptParams {
  lastMessage: string;
  character: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
  };
  persona: {
    name: string;
    description: string;
  };
  world: {
    name: string;
    description: string;
  } | null;
  history?: ModelMessage[];
  lorebook?: { id: string; index: IndexEntry[] };
  lorebookScanText?: string;
}

export async function buildPrompt({
  lastMessage,
  character,
  persona,
  world,
  history = [],
  lorebook,
  lorebookScanText,
}: BuildPromptParams) {
  const { systemPrompt, userPrompt } = await assemblePrompts();

  let lorebookPrompt: string | undefined;
  let files: ObsidianFile[] | undefined;
  if (lorebook) {
    if (USE_LOREBOOK_TOOLCALL) {
      lorebookPrompt = lorebook.index
        .map((idx) => `${idx.filename}  -  ${idx.summary}`)
        .join("\n");
    } else {
      const indexList = scanLorebookIndex({
        scanText: lorebookScanText ?? lastMessage,
        index: lorebook.index,
      });
      files = await getLorebookEntryList({
        files: indexList,
        lorebookId: lorebook.id,
      });
      lorebookPrompt = convertFilesToPrompt({ files });
    }
  }

  const [systemMessage, userMessage] = constructPromptMessages({
    prompts: [systemPrompt, userPrompt],
    lastMessage,
    character,
    persona,
    world,
    lorebook: lorebookPrompt,
  });

  return {
    prompt: [
      { role: "system" as const, content: systemMessage },
      ...history,
      { role: "user" as const, content: userMessage },
    ],
    lorebookEntries: files?.map((lb) => ({
      path: lb.path,
      title: lb.frontmatter.title,
    })),
  };
}

interface BuildPromptFromChatParams {
  characterId: string;
  personaId: string;
  worldId?: string;
  lorebook?: { id: string; index: IndexEntry[] };
  messages: {
    role: MessageRole;
    parts: MessagePart[];
  }[];
}

async function buildPromptFromChat({
  characterId,
  personaId,
  worldId,
  lorebook,
  messages,
}: BuildPromptFromChatParams) {
  const [character, persona, world] = await Promise.all([
    getCharacterByIdOrFail(characterId),
    getPersonaByIdOrFail(personaId),
    worldId ? getWorldById(worldId) : null,
  ]);

  const lastMessage =
    messages[messages.length - 1].parts
      .filter((p) => p.type === "text")
      .map((p) => (p as TextPart).text)
      .join("\n") ?? "";

  const lorebookScanText = messages
    .slice(-Math.min(LOREBOOK_SCAN_DEPTH, messages.length))
    .map(
      (mes) =>
        `${mes.role === "assistant" ? character.card.name : persona.name}: ${mes.parts
          .filter((p) => p.type === "text")
          .map((p) => (p as TextPart).text)
          .join("\n")}`,
    )
    .join("\n");

  return buildPrompt({
    lastMessage,
    character: character.card,
    persona,
    world,
    history: messages ? await convertToModelMessages(messages) : [],
    lorebook,
    lorebookScanText,
  });
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
        parts: message.parts,
        role: message.role,
        isActive: true,
      },
    });

  const chat = await getMessagesForChat({ id: chatId });
  if (!chat) throw new Error("Chat does not exist");
  const lorebook = chat.lorebookId
    ? await getLorebookById(chat.lorebookId)
    : undefined;

  const canonicalMessages = chat.messages.map((mes) =>
    messageDtoToUIMessage(mes),
  );

  const { prompt } = await buildPromptFromChat({
    characterId: chat.character.id,
    personaId: chat.persona.id,
    lorebook: lorebook?.status === LorebookStatus.Ready ? lorebook : undefined,
    worldId: chat.worldId,
    messages: regenerate ? canonicalMessages.slice(0, -1) : canonicalMessages,
  });
  if (debug) console.debug("prompt", prompt);

  // --send and stream result--
  return streamText({
    model: models.chat,
    prompt: prompt,
    onFinish: ({ response }) => {
      if (debug)
        console.debug("raw llm response", JSON.stringify(response, null, 2));
    },
    stopWhen: stepCountIs(20),
    tools: {
      ...(lorebook?.status === LorebookStatus.Ready && {
        getLorebookEntries: tool({
          description:
            "Retrive lore and character information from the lorebook",
          inputSchema: z.object({
            entries: z
              .string()
              .array()
              .describe("A list of lorebook entry paths to retrive"),
          }),
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
        messageId = chat.messages[canonicalMessages.length - 1].id;
      await createChatMessageContent({
        chatId,
        messageId,
        messageContent: {
          id: sentMessage.id,
          parts: sentMessage.parts,
          role: sentMessage.role,
          isActive: true,
        },
      });
    },
  });
}
