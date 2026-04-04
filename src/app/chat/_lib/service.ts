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
import {
  Lorebook,
  LorebookStatus,
  ObsidianFile,
} from "@/app/lorebook/_lib/schema";
import { getPersonaByIdOrFail } from "@/app/persona/_lib/data";
import { getWorldById } from "@/app/world/_lib/data";
import {
  assemblePrompts,
  constructPromptMessages,
} from "@/lib/ai/prompt-manager";
import { models } from "@/lib/ai/registry";
import { LOREBOOK_SCAN_DEPTH } from "@/lib/constants";
import {
  convertFilesToPrompt,
  scanLorebookIndex,
} from "@/lib/lorebook-scanning";
import {
  convertToModelMessages,
  createIdGenerator,
  ModelMessage,
  streamText,
  TextPart,
} from "ai";
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
  lorebook?: Lorebook | null;
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
  if (lorebook && lorebook.status === LorebookStatus.Ready) {
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
  lorebookId?: string;
  messages: {
    role: MessageRole;
    parts: MessagePart[];
  }[];
}

async function buildPromptFromChat({
  characterId,
  personaId,
  worldId,
  lorebookId,
  messages,
}: BuildPromptFromChatParams) {
  console.log("messages", JSON.stringify(messages, null, 2));
  const [character, lorebook, persona, world] = await Promise.all([
    getCharacterByIdOrFail(characterId),
    lorebookId ? getLorebookById(lorebookId) : null,
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
  const canonicalMessages = chat.messages.map((mes) =>
    messageDtoToUIMessage(mes),
  );

  const { prompt } = await buildPromptFromChat({
    characterId: chat.character.id,
    personaId: chat.persona.id,
    lorebookId: chat.lorebookId,
    worldId: chat.worldId,
    messages: regenerate ? canonicalMessages.slice(0, -1) : canonicalMessages,
  });
  if (debug) console.debug("prompt", prompt);

  // --send and stream result--
  return streamText({
    model: models.deepseek,
    prompt: prompt,
    onFinish: ({ response }) => {
      if (debug)
        console.debug("raw llm response", JSON.stringify(response, null, 2));
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
