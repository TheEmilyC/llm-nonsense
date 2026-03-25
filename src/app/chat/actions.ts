"use server";

import { getCharacterByIdOrFail } from "@/app/character/data";
import { createChat, createChatMessage } from "@/app/chat/data";
import { getPersonaByIdOrFail } from "@/app/persona/data";
import { getStoryById } from "@/app/story/data";
import { ActionResponse } from "@/lib/action-utils";
import { constructPromptMessages } from "@/lib/ai/prompt-manager";
import { dbIdValidator } from "@/lib/validators";
import { createIdGenerator } from "ai";
import { notFound, redirect } from "next/navigation";

export async function createChatFromStoryAction(
  storyId: string,
): Promise<ActionResponse<void>> {
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
  if (!story) return notFound();

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

  redirect(`/chat/${chat.id}`);
}
