import {
  ChatWithMessagesDto,
  MessageContentDto,
  messageContentToDto,
} from "@/app/chat/_lib/schema";
import { buildCharacterImageUrl, buildPersonaImageUrl } from "@/lib/image";
import { prisma } from "@/lib/prisma";

import { ChatMessage, MessageContent } from "../../../../generated/client";

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

export interface CreateChatMessageParams {
  newMessage: Pick<ChatMessage, "chatId">;
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

export interface CreateChatMessageContentParams {
  chatId: string;
  messageId?: string;
  messageContent: Pick<MessageContent, "isActive" | "parts" | "role" | "id"> & {
    metadata?: unknown;
  };
}

export async function createChatMessageContent({
  chatId,
  messageId,
  messageContent,
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

export interface GetMessagesForChatParams {
  id: string;
  take?: number;
  skip?: number;
}

export async function getMessagesForChat({
  id,
  take = 50,
  skip = 0,
}: GetMessagesForChatParams): Promise<ChatWithMessagesDto | null> {
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: { contents: { where: { isActive: true } } },
      },
      story: {
        include: {
          character: true,
          persona: true,
          world: true,
        },
      },
    },
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
    id: chat.id,
    name: chat.name,
    storyId: chat.storyId,
    storyName: chat.story.name,
    lorebookId: chat.story.lorebookId ?? undefined,
    messages: chat.messages.map((msg) => ({
      id: msg.id,
      contents: msg.contents.map((con) => ({
        id: con.id,
        role: con.role,
        parts: con.parts,
        isActive: con.isActive,
      })),
    })),
    character: {
      id: chat.story.character.id,
      name: chat.story.character.name,
      avatarSrc: buildCharacterImageUrl({
        id: chat.story.character.id,
        pngHash: chat.story.character.pngHash,
      }),
    },
    persona: {
      id: chat.story.persona.id,
      name: chat.story.persona.name,
      avatarSrc: buildPersonaImageUrl({
        id: chat.story.persona.id,
        imgHash: chat.story.persona.imageHash,
      }),
    },
  };
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

export interface UpdateMessageContentParams {
  id: string;
  update: Partial<
    Pick<
      MessageContent,
      "isActive" | "messageId" | "metadata" | "parts" | "role"
    >
  >;
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
        where: { messageId, NOT: { id } },
        data: { isActive: false },
      });
    }

    return tx.messageContent.update({
      where: { id },
      data: {
        isActive: update.isActive,
        messageId: update.messageId,
        metadata: update.metadata,
        parts: update.parts,
        role: update.role,
      },
    });
  });
}
