"use server";

import { createIdGenerator } from "ai";

import { getCharacterByIdOrFail } from "@/app/character/_lib/data";
import {
  createChat,
  createChatMessageContent,
  deleteChat,
  updateMessageContent,
} from "@/app/chat/_lib/data";
import {
  MessageContentDto,
  UpdateContentActionParams,
  updateContentActionParamsSchema,
} from "@/app/chat/_lib/schema";
import { getPersonaByIdOrFail } from "@/app/persona/_lib/data";
import { getStoryById } from "@/app/story/_lib/data";
import { getWorldByIdOrFail } from "@/app/world/_lib/data";
import { ActionResponse } from "@/lib/action-utils";
import { constructPromptMessages } from "@/lib/ai/prompt-manager";
import { HttpStatus } from "@/lib/http";
import { dbIdValidator } from "@/lib/validators";

export async function createChatFromStoryAction(
  storyId: string,
): Promise<ActionResponse<{ id: string }>> {
  const idParseResult = dbIdValidator.safeParse(storyId);
  if (!idParseResult.success) {
    console.error(idParseResult.error);
    return { error: "Malformed chat data", success: false };
  }

  let story;
  try {
    story = await getStoryById(storyId);
  } catch (err) {
    console.error(err);
  }
  if (!story)
    return { error: "not found", status: HttpStatus.NOT_FOUND, success: false };

  let chat;
  try {
    const [character, persona, world, newChat] = await Promise.all([
      getCharacterByIdOrFail(story.characterId),
      getPersonaByIdOrFail(story.personaId),
      story.worldId ? getWorldByIdOrFail(story.worldId) : null,
      createChat({
        newChat: { name: new Date().toLocaleString(), storyId },
      }),
    ]);

    // preload character first message
    if (character.card.first_mes.length > 0) {
      const [message] = constructPromptMessages({
        character: character.card,
        persona,
        prompts: [character.card.first_mes],
        world,
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
    console.error(err);
    return { error: "Failed to create chat", success: false };
  }
  return { data: { id: chat.id }, success: true };
}

export async function deleteChatAction(
  chatId: string,
): Promise<ActionResponse<void>> {
  const parseResult = dbIdValidator.safeParse(chatId);
  if (!parseResult.success) {
    return { error: "Malformed chat id", success: false };
  }
  try {
    await deleteChat(chatId);
    return { data: undefined, success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete chat", success: false };
  }
}

export async function updateMessageContentAction(
  params: UpdateContentActionParams,
): Promise<ActionResponse<MessageContentDto>> {
  const parseResult = updateContentActionParamsSchema.safeParse(params);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { error: "Malfored chat data", success: false };
  }
  const { id, update } = parseResult.data;

  try {
    const messageContent = await updateMessageContent({
      id,
      update,
    });
    return { data: messageContent, success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update chat", success: false };
  }
}
