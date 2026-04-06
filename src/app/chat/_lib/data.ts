import {
  ChatWithMessagesDto,
  MessageContentDto,
  messageContentToDto,
} from "@/app/chat/_lib/schema";
import { buildCharacterImageUrl, buildPersonaImageUrl } from "@/lib/image";
import { prisma } from "@/lib/prisma";

import { ChatMessage, MessageContent } from "../../../../generated/client";

export interface CreateChatMessageContentParams {
  chatId: string;
  messageContent: Pick<MessageContent, "id" | "isActive" | "parts" | "role"> & {
    metadata?: unknown;
  };
  messageId?: string;
}

export interface CreateChatMessageParams {
  newMessage: Pick<ChatMessage, "chatId">;
}

export interface GetMessagesForChatParams {
  id: string;
  skip?: number;
  take?: number;
}

export interface UpdateMessageContentParams {
  id: string;
  update: Partial<
    Pick<
      MessageContent,
      "isActive" | "messageId" | "metadata" | "parts" | "role"
    >
  >;
}

interface CreateChatParams {
  newChat: {
    name: string;
    storyId: string;
  };
}

export async function createChat({ newChat }: CreateChatParams) {
  const chat = await prisma.chat.create({
    data: {
      name: newChat.name,
      storyId: newChat.storyId,
    },
  });

  return chat;
}

export async function createChatMessage({
  newMessage,
}: CreateChatMessageParams) {
  const message = await prisma.chatMessage.create({
    data: {
      chatId: newMessage.chatId,
    },
  });
  return message;
}

export async function createChatMessageContent({
  chatId,
  messageContent,
  messageId,
}: CreateChatMessageContentParams): Promise<MessageContentDto> {
  const result = await prisma.$transaction(async (tx) => {
    let contentMsgId: string;
    if (messageId) {
      const existingMsg = await tx.chatMessage.findUnique({
        where: { id: messageId },
      });
      if (!existingMsg) throw new Error(`Message does not exist`);
      contentMsgId = existingMsg.id;
      if (messageContent.isActive) {
        // only one message may be active at a time
        await tx.messageContent.updateMany({
          data: { isActive: false },
          where: { messageId },
        });
      }
    } else {
      const message = await tx.chatMessage.create({
        data: { chatId },
      });
      contentMsgId = message.id;
    }

    return tx.messageContent.create({
      data: {
        ...messageContent,
        id: messageContent.id, // Vercel AI SDK Generated
        messageId: contentMsgId,
      },
    });
  });

  return messageContentToDto(result);
}

export async function deleteChat(id: string) {
  return prisma.chat.delete({ where: { id } });
}

export async function getChatsForStory(storyId: string) {
  return prisma.chat.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
    where: { storyId },
  });
}

export async function getMessageById(id: string): Promise<ChatMessage | null> {
  return await prisma.chatMessage.findUnique({ where: { id } });
}

export async function getMessageByIdOrFail(id: string): Promise<ChatMessage> {
  const result = await getMessageById(id);
  if (!result) throw new Error(`Message does not exist`);
  return result;
}

export async function getMessageContentById(
  id: string,
): Promise<MessageContent | null> {
  return prisma.messageContent.findUnique({ where: { id } });
}

export async function getMessageContentByIdOrFail(id: string) {
  const result = await getMessageContentById(id);
  if (!result) throw new Error("Message content does not exist");
  return result;
}

export async function getMessagesForChat({
  id,
  skip = 0,
  take = 50,
}: GetMessagesForChatParams): Promise<ChatWithMessagesDto | null> {
  const chat = await prisma.chat.findUnique({
    include: {
      messages: {
        include: { contents: { where: { isActive: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      },
      story: {
        include: {
          character: true,
          persona: true,
          world: true,
        },
      },
    },
    where: { id },
  });

  if (!chat) return null;

  chat.messages.reverse();
  if (chat.messages.length > 0) {
    // fetch all content for last message
    const lastMessage = chat.messages[chat.messages.length - 1];
    const fullContents = await prisma.messageContent.findMany({
      where: { messageId: lastMessage.id },
    });
    lastMessage.contents = fullContents;
  }

  return {
    character: {
      avatarSrc: buildCharacterImageUrl({
        id: chat.story.character.id,
        pngHash: chat.story.character.pngHash,
      }),
      id: chat.story.character.id,
      name: chat.story.character.name,
    },
    id: chat.id,
    lorebookId: chat.story.lorebookId ?? undefined,
    messages: chat.messages.map((msg) => ({
      contents: msg.contents.map((con) => ({
        id: con.id,
        isActive: con.isActive,
        parts: con.parts,
        role: con.role,
      })),
      id: msg.id,
    })),
    name: chat.name,
    persona: {
      avatarSrc: buildPersonaImageUrl({
        id: chat.story.persona.id,
        imgHash: chat.story.persona.imageHash,
      }),
      id: chat.story.persona.id,
      name: chat.story.persona.name,
    },
    storyId: chat.storyId,
    storyName: chat.story.name,
  };
}

export async function updateMessageContent({
  id,
  update,
}: UpdateMessageContentParams): Promise<MessageContent> {
  return prisma.$transaction(async (tx) => {
    if (update.isActive) {
      const messageId =
        update.messageId ??
        (await tx.messageContent.findUniqueOrThrow({ where: { id } }))
          .messageId;

      await tx.messageContent.updateMany({
        data: { isActive: false },
        where: { messageId, NOT: { id } },
      });
    }

    return tx.messageContent.update({
      data: {
        isActive: update.isActive,
        messageId: update.messageId,
        metadata: update.metadata,
        parts: update.parts,
        role: update.role,
      },
      where: { id },
    });
  });
}
