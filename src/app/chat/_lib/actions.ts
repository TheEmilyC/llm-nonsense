"use server";

import { getCharacterByIdOrFail } from "@/app/character/_lib/data";
import { createChat, createChatMessage } from "@/app/chat/_lib/data";
import { getPersonaByIdOrFail } from "@/app/persona/data";
import { getStoryById } from "@/app/story/data";
import { ActionResponse } from "@/lib/action-utils";
import { constructPromptMessages } from "@/lib/ai/prompt-manager";
import { HttpStatus } from "@/lib/http";
import { dbIdValidator } from "@/lib/validators";
import { createIdGenerator } from "ai";

export async function createChatFromStoryAction(
  storyId: string,
): Promise<ActionResponse<{ id: string }>> {
  const idParseResult = dbIdValidator.safeParse(storyId);
  if (!idParseResult.success) {
    console.error(idParseResult.error);
    return { success: false, error: "Malformed persona data" };
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
    const [character, persona, newChat] = await Promise.all([
      getCharacterByIdOrFail(story.characterId),
      getPersonaByIdOrFail(story.personaId),
      createChat({
        newChat: { name: new Date().toLocaleString(), storyId },
      }),
    ]);

    // preload character first message
    if (character.card.first_mes.length > 0) {
      const [message] = constructPromptMessages({
        prompts: [character.card.first_mes],
        character: character.card,
        persona,
      });
      const idGenerator = createIdGenerator({
        prefix: "msg",
        size: 16,
      });

      await createChatMessage({
        newMessage: {
          id: idGenerator(),
          chatId: newChat.id,
          role: "assistant",
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
