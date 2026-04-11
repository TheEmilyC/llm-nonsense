"use server";

import { createIdGenerator } from "ai";
import { redirect } from "next/navigation";

import { getCharacterById } from "@/app/character/_lib/data";
import {
  createChat,
  createChatMessageContent,
  deleteChat,
  deleteChatMessage,
  getChatById,
  updateMessageContent,
} from "@/app/chat/_lib/data";
import {
  ChatDto,
  UpdateContentActionParams,
  updateContentActionParamsSchema,
} from "@/app/chat/_lib/schema";
import { getPersonaById } from "@/app/persona/_lib/data";
import { hydratePrompt } from "@/app/prompt/_lib/prompt-builder";
import { getStoryById } from "@/app/story/_lib/data";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { NotFoundError } from "@/lib/error";
import { logger, parseError } from "@/lib/logger";
import { dbIdValidator } from "@/lib/validators";

export async function createChatFromStoryAction(
  storyId: string,
): Promise<ActionResponse> {
  const idParseResult = dbIdValidator.safeParse(storyId);
  if (!idParseResult.success) {
    toActionResponseError(idParseResult.error);
  }

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
      getCharacterById(story.characterId),
      getPersonaById(story.personaId),
      createChat({
        newChat: { name: new Date().toLocaleString(), storyId },
      }),
    ]);

    // preload character first message
    if (character && character.first_mes.length > 0) {
      const message = hydratePrompt(character.first_mes, {
        char: character.name,
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
  redirect(`/chat/${chat.id}`);
}

export async function deleteChatAction(id: string): Promise<ActionResponse> {
  const parseResult = dbIdValidator.safeParse(id);
  if (!parseResult.success) {
    return toActionResponseError(parseResult.error);
  }

  let chat: ChatDto | null;
  try {
    chat = await getChatById(id);
    if (!chat) return toActionResponseError(new NotFoundError("Chat", id));
    await deleteChat(id);
  } catch (err) {
    logger.error("Failed to delete chat", { id, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Chat deleted", { id });

  redirect(`/story/${chat.storyId}`);
}

export async function deleteMessageAction(
  messageId: string,
): Promise<ActionResponse> {
  const parseResult = dbIdValidator.safeParse(messageId);
  if (!parseResult.success) {
    return toActionResponseError(parseResult.error);
  }
  try {
    await deleteChatMessage(messageId);
  } catch (err) {
    logger.error("Failed to delete message", { messageId, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Message deleted", { id: messageId });

  return { success: true };
}

export async function updateMessageContentAction(
  params: UpdateContentActionParams,
): Promise<ActionResponse> {
  const parseResult = updateContentActionParamsSchema.safeParse(params);
  if (!parseResult.success) {
    return toActionResponseError(parseResult.error);
  }
  const { id, update } = parseResult.data;

  try {
    await updateMessageContent({
      id,
      update,
    });
  } catch (err) {
    logger.error("Failed to update message content", {
      id,
      update,
      ...parseError(err),
    });
  }
  logger.info("Message content update", { id });

  return { success: true };
}
