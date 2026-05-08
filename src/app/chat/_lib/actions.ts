"use server";

import { createId } from "@paralleldrive/cuid2";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { dbIdValidator } from "@/app/_shared/schema";
import { getCharacterRecord } from "@/app/character/_lib/data";
import {
  createChat,
  createChatMessageContent,
  deleteChat,
  deleteChatMessage,
  getChatById,
  getChatMessageById,
  updateChat,
  updateChatMessage,
  updateMessageContent,
} from "@/app/chat/_lib/data";
import {
  CHAT_CACHE_KEY,
  ChatEntity,
  ChatMessageEntity,
  GenerateSummariesActionParams,
  generateSummariesActionParamsSchema,
  GenerateSummariesActionResponse,
  SaveChatFactsActionParams,
  saveChatFactsActionParamsSchema,
  UpdateChatMessageActionParams,
  updateChatMessageActionParamsSchema,
  UpdateContentActionParams,
  updateContentActionParamsSchema,
} from "@/app/chat/_lib/schema";
import { generateSummaries } from "@/app/chat/_lib/service";
import { getPersonaById } from "@/app/persona/_lib/data";
import { hydratePrompt } from "@/app/prompt/_lib/prompt-builder";
import { getStoryById } from "@/app/story/_lib/data";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { NotFoundError } from "@/lib/error";
import { logger, parseError } from "@/lib/logger";

export async function createBasicChatAction(): Promise<ActionResponse> {
  let chat: ChatEntity;
  try {
    chat = await createChat({ newChat: { name: new Date().toLocaleString() } });
  } catch (err) {
    logger.error("Failed to create basic chat", { ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Basic chat created", { chatId: chat.id });
  updateTag(CHAT_CACHE_KEY);
  redirect(`/chat/${chat.id}`);
}

export async function createChatFromStoryAction(
  storyId: string,
): Promise<ActionResponse> {
  const idParseResult = dbIdValidator.safeParse(storyId);
  if (!idParseResult.success) toActionResponseError(idParseResult.error);

  let story;
  try {
    story = await getStoryById(storyId);
  } catch (err) {
    logger.error("Error fetching story", { id: storyId, ...parseError(err) });
    toActionResponseError(err);
  }
  if (!story) return toActionResponseError(new NotFoundError("Story", storyId));

  let chat;
  try {
    const [character, persona, newChat] = await Promise.all([
      getCharacterRecord(story.characterId),
      getPersonaById(story.personaId),
      createChat({
        newChat: { name: new Date().toLocaleString(), storyId },
      }),
    ]);

    // preload character first message
    if (character && character.card.first_mes.length > 0) {
      const message = hydratePrompt(character.card.first_mes, {
        char: character.card.name,
        user: persona ? persona.name : "",
      });

      const contentId = createId();
      await createChatMessageContent({
        chatId: newChat.id,
        messageContent: {
          id: contentId,
          isActive: true,
          metadata: { contentId },
          parts: [
            {
              text: message,
              type: "text",
            },
          ],
          role: "assistant",
        },
      });
    }
    chat = newChat;
  } catch (err) {
    logger.error("Failed to create chat from story", {
      storyId,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
  logger.info("Chat created from story", { chatId: chat.id, storyId });
  updateTag(CHAT_CACHE_KEY);
  redirect(`/chat/${chat.id}`);
}

export async function deleteChatAction(id: string): Promise<ActionResponse> {
  const parseResult = dbIdValidator.safeParse(id);
  if (!parseResult.success) return toActionResponseError(parseResult.error);

  let chat: ChatEntity | null;
  try {
    chat = await getChatById(id);
    if (!chat) return toActionResponseError(new NotFoundError("Chat", id));
    await deleteChat(id);
  } catch (err) {
    logger.error("Failed to delete chat", { id, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Chat deleted", { id });

  updateTag(CHAT_CACHE_KEY);
  updateTag(`${CHAT_CACHE_KEY}-${id}`);
  redirect(chat.storyId ? `/story/${chat.storyId}` : `/`);
}

export async function deleteMessageAction(
  messageId: string,
): Promise<ActionResponse> {
  const parseResult = dbIdValidator.safeParse(messageId);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const id = parseResult.data;

  let deletedMessage: ChatMessageEntity;
  try {
    deletedMessage = await deleteChatMessage(id);
  } catch (err) {
    logger.error("Failed to delete message", { id, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Message deleted", { id });

  updateTag(`${CHAT_CACHE_KEY}-${deletedMessage.chatId}`);
  return { success: true };
}

export async function generateSummariesAction(
  params: GenerateSummariesActionParams,
): Promise<ActionResponse<GenerateSummariesActionResponse>> {
  const parseResult = generateSummariesActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { chatId, messageIds } = parseResult.data;

  let cast: string | undefined;
  let memory: undefined | { content: string; synopsis: string };
  let facts:
    | undefined
    | { claim: string; confidence: "explicit" | "implied" }[];
  try {
    const result = await generateSummaries({ chatId, messageIds });
    cast = result.cast;
    memory = result.memory;
    facts = result.facts;
  } catch (err) {
    logger.error("Failed to generate summaries", {
      chatId,
      messageIds,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
  updateTag(`${CHAT_CACHE_KEY}-${chatId}`);
  return {
    data: {
      cast: cast ? cast : "Failed to generate",
      content: memory ? memory.content : "Failed to generate",
      facts,
      summary: memory ? memory.synopsis : "Failed to generate",
    },
    success: true,
  };
}

export async function insertBlankAssistantMessageAction(
  chatId: string,
): Promise<ActionResponse<{ contentId: string; id: string }>> {
  const parseResult = dbIdValidator.safeParse(chatId);
  if (!parseResult.success) return toActionResponseError(parseResult.error);

  try {
    const contentId = createId();
    const content = await createChatMessageContent({
      chatId,
      messageContent: {
        id: contentId,
        isActive: true,
        metadata: { contentId },
        parts: [{ text: "", type: "text" }],
        role: "assistant",
      },
    });
    updateTag(`${CHAT_CACHE_KEY}-${chatId}`);
    return { data: { contentId, id: content.messageId }, success: true };
  } catch (err) {
    logger.error("Failed to insert blank assistant message", {
      chatId,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
}

export async function replaceChatFactsAction(
  params: SaveChatFactsActionParams,
): Promise<ActionResponse> {
  const parseResult = saveChatFactsActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { chatId, facts } = parseResult.data;

  try {
    await updateChat({ id: chatId, update: { facts } });
  } catch (err) {
    logger.error("Failed to replace chat facts", { chatId, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Chat facts replaced", { chatId });
  updateTag(`${CHAT_CACHE_KEY}-${chatId}`);
  return { success: true };
}

export async function saveChatFactsAction(
  params: SaveChatFactsActionParams,
): Promise<ActionResponse> {
  const parseResult = saveChatFactsActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { chatId, facts } = parseResult.data;

  try {
    const chat = await getChatById(chatId);
    const existing = chat?.facts ?? [];
    await updateChat({ id: chatId, update: { facts: [...existing, ...facts] } });
  } catch (err) {
    logger.error("Failed to save chat facts", { chatId, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Chat facts saved", { chatId });
  updateTag(`${CHAT_CACHE_KEY}-${chatId}`);
  return { success: true };
}

export async function updateChatMessageAction(
  params: UpdateChatMessageActionParams,
): Promise<ActionResponse> {
  const parseResult = updateChatMessageActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { id, update } = parseResult.data;

  let message: ChatMessageEntity | undefined;
  try {
    message = await updateChatMessage({ id, update });
  } catch (err) {
    logger.error("Failed to update chat message", {
      id,
      update,
      ...parseError(err),
    });
    toActionResponseError(err);
  }
  logger.info("Chat message updated", { id });
  if (message) updateTag(`${CHAT_CACHE_KEY}-${message.chatId}`);
  return { success: true };
}

export async function updateMessageContentAction(
  params: UpdateContentActionParams,
): Promise<ActionResponse> {
  const parseResult = updateContentActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);

  const { id, update } = parseResult.data;

  let message: ChatMessageEntity | null = null;
  try {
    const updatedContent = await updateMessageContent({
      id,
      update,
    });
    message = await getChatMessageById(updatedContent.messageId);
  } catch (err) {
    logger.error("Failed to update message content", {
      id,
      update,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
  logger.info("Message content update", { id });
  if (message) updateTag(`${CHAT_CACHE_KEY}-${message.chatId}`);
  updateTag(CHAT_CACHE_KEY);

  return { success: true };
}
