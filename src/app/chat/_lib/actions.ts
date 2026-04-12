"use server";

import { createIdGenerator } from "ai";
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
  updateChatMessage,
  updateMessageContent,
} from "@/app/chat/_lib/data";
import {
  CHAT_CACHE_KEY,
  ChatEntity,
  ChatMessageEntity,
  UpdateChatMessageActionParams,
  updateChatMessageActionParamsSchema,
  UpdateContentActionParams,
  updateContentActionParamsSchema,
} from "@/app/chat/_lib/schema";
import { getPersonaById } from "@/app/persona/_lib/data";
import { hydratePrompt } from "@/app/prompt/_lib/prompt-builder";
import { getStoryById } from "@/app/story/_lib/data";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { NotFoundError } from "@/lib/error";
import { logger, parseError } from "@/lib/logger";

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
      const idGenerator = createIdGenerator({
        prefix: "msg",
        size: 16,
      });

      await createChatMessageContent({
        chatId: newChat.id,
        messageContent: {
          id: idGenerator(),
          isActive: true,
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
  redirect(`/story/${chat.storyId}`);
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
