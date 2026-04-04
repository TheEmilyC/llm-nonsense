"use server";

import { getCharacterByIdOrFail } from "@/app/character/_lib/data";
import {
  createChat,
  createChatMessageContent,
  updateMessageContent,
} from "@/app/chat/_lib/data";
import {
  MessageContentDto,
  messageContentToDto,
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
import { createIdGenerator } from "ai";
import { MessageRole } from "../../../../generated/enums";

export async function createChatFromStoryAction(
  storyId: string,
): Promise<ActionResponse<{ id: string }>> {
  const idParseResult = dbIdValidator.safeParse(storyId);
  if (!idParseResult.success) {
    console.error(idParseResult.error);
    return { success: false, error: "Malformed chat data" };
  }

  let story;
  try {
    story = await getStoryById(storyId);
  } catch (err) {
    console.error(err);
  }
  if (!story)
    return { success: false, error: "not found", status: HttpStatus.NOT_FOUND };

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
        prompts: [character.card.first_mes],
        character: character.card,
        world,
        persona,
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
          role: MessageRole.assistant,
          parts: [
            {
              type: "text",
              text: message,
            },
          ],
        },
      });
    }
    chat = newChat;
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to create chat" };
  }
  return { success: true, data: { id: chat.id } };
}

export async function updateMessageContentAction(
  params: UpdateContentActionParams,
): Promise<ActionResponse<MessageContentDto>> {
  const parseResult = updateContentActionParamsSchema.safeParse(params);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { success: false, error: "Malfored chat data" };
  }
  const { id, update } = parseResult.data;

  try {
    const messageContent = await updateMessageContent({
      id,
      update,
    });
    return { success: true, data: messageContentToDto(messageContent) };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to update chat" };
  }
}
