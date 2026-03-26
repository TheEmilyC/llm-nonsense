"use server";

import { getCharacterById } from "@/app/character/data";
import { createChatMessage, getMessagesForChat } from "@/app/chat/data";
import { MessagePart } from "@/app/chat/schema";
import { getLorebook, getLorebookEntryList } from "@/app/lorebook/data";
import { LorebookStatus } from "@/app/lorebook/schema";
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

/**
 * Builds and streams a character chat response for a given chat session.
 *
 * Fetches the chat's associated story and character, hydrates the system and
 * user prompts with character card variables, prepends conversation history,
 * and streams the LLM response back as a UI message stream.
 *
 * @param id - The chat session ID
 * @param message - The latest user message
 * @param debug - When true, logs the constructed prompt and raw LLM response
 * @returns A streaming UI message response
 */
export async function constructChatResponse(
  { id, message }: ConstructChatResponseParams,
  { debug = true } = {},
) {
  // --fetch data--
  const [{ systemPrompt, userPrompt }, chat, lorebook] = await Promise.all([
    assemblePrompts(),
    getMessagesForChat({ id }),
    getLorebook(),
    createChatMessage({
      newMessage: { ...message, chatId: id },
    }), // add user message to history
  ]);
  if (!chat) throw new Error("Chat does not exist");
  const character = await getCharacterById(chat.story.character.id);
  if (!character) throw new Error("Character does not exist");
  const persona = chat.story.persona;

  const lastMessageContent = message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as TextPart).text)
    .join("\n");

  // Get lorebook entries
  let lorebookPrompt: string | undefined;
  if (
    lorebook.status === LorebookStatus.Ready &&
    lorebook.name === chat.story.lorebook
  ) {
    const recentMessages = [
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

    const indexList = scanLorebookIndex({
      scanText: recentMessages,
      index: lorebook.index,
    });
    const files = await getLorebookEntryList(indexList);

    lorebookPrompt = convertFilesToPrompt({ files });
  }

  const [systemMessage, userMessage] = constructPromptMessages({
    prompts: [systemPrompt, userPrompt],
    lastMessage: lastMessageContent,
    character: character.card,
    persona,
    lorebook: lorebookPrompt,
  });

  // --construct final prompt--
  const prompt = [
    {
      role: "system" as const,
      content: systemMessage,
    },
    ...(chat.messages ? await convertToModelMessages(chat.messages) : []),
    {
      role: "user" as const,
      content: userMessage,
    },
  ];
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
