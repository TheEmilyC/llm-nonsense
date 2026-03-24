import { getCharacterById } from "@/app/character/data";
import { createChatMessage, getMessagesForChat } from "@/app/chat/data";
import { MessagePart } from "@/app/chat/validators";
import {
  assemblePrompts,
  constructPromptMessages,
} from "@/lib/ai/prompt-manager";
import { models } from "@/lib/ai/registry";
import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  TextPart,
} from "ai";

interface ConstructChatResponseProperties {
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
  { id, message }: ConstructChatResponseProperties,
  { debug = false } = {},
) {
  // --fetch data--
  const [{ systemPrompt, userPrompt }, chat] = await Promise.all([
    assemblePrompts(),
    getMessagesForChat({ id }),
    createChatMessage({
      newMessage: { ...message, chatId: id },
    }), // add user message to history
  ]);
  if (!chat) throw "Chat does not exist";
  const character = await getCharacterById(chat.story.character.id);
  if (!character) throw "Character does not exist";
  const persona = chat.story.persona;

  const lastMessageContent = message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as TextPart).text)
    .join("\n");

  const [systemMessage, userMessage] = constructPromptMessages({
    prompts: [systemPrompt, userPrompt],
    lastMessage: lastMessageContent,
    character: character.card,
    persona,
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
