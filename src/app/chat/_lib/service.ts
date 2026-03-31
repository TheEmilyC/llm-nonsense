"use server";

import { getCharacterById } from "@/app/character/_lib/data";
import { createChatMessage, getMessagesForChat } from "@/app/chat/_lib/data";
import { MessagePart } from "@/app/chat/_lib/schema";
import { getLorebook, getLorebookEntryList } from "@/app/lorebook/_lib/data";
import { LorebookFile, LorebookStatus } from "@/app/lorebook/_lib/schema";
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

interface ConstructChatResponseParams {
  id: string;
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
  lorebookName?: string | null;
  lorebookScanText?: string;
}

export async function buildPrompt({
  lastMessage,
  character,
  persona,
  world,
  history = [],
  lorebookName,
  lorebookScanText,
}: BuildPromptParams) {
  const [{ systemPrompt, userPrompt }, lorebook] = await Promise.all([
    assemblePrompts(),
    getLorebook(),
  ]);

  let lorebookPrompt: string | undefined;
  let files: LorebookFile[] | undefined;
  if (
    lorebookName &&
    lorebook.status === LorebookStatus.Ready &&
    lorebook.name === lorebookName
  ) {
    const indexList = scanLorebookIndex({
      scanText: lorebookScanText ?? lastMessage,
      index: lorebook.index,
    });
    files = await getLorebookEntryList(indexList);
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

async function buildPromptFromChat({
  id,
  message,
}: ConstructChatResponseParams) {
  const chat = await getMessagesForChat({ id });
  if (!chat) throw new Error("Chat does not exist");
  const character = await getCharacterById(chat.story.character.id);
  if (!character) throw new Error("Character does not exist");
  const persona = chat.story.persona;
  const world = chat.story.world;

  const lastMessage = message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as TextPart).text)
    .join("\n");

  const lorebookScanText = [
    ...chat.messages.slice(
      -Math.min(LOREBOOK_SCAN_DEPTH - 1, chat.messages.length),
    ),
    message,
  ]
    .map(
      (mes) =>
        `${mes.role === "assistant" ? character.card.name : persona.name}: ${mes.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("\n")}`,
    )
    .join("\n");

  return buildPrompt({
    lastMessage,
    character: character.card,
    persona,
    world,
    history: chat.messages ? await convertToModelMessages(chat.messages) : [],
    lorebookName: chat.story.lorebook,
    lorebookScanText,
  });
}

export async function constructChatResponse(
  { id, message }: ConstructChatResponseParams,
  { debug = true } = {},
) {
  await createChatMessage({ newMessage: { ...message, chatId: id } });
  const { prompt } = await buildPromptFromChat({ id, message });
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
      const lastMessage = messages[0];
      await createChatMessage({
        newMessage: {
          id: lastMessage.id,
          chatId: id,
          role: lastMessage.role,
          parts: lastMessage.parts,
        },
      });
    },
  });
}
