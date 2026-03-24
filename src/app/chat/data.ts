import { MessagePart } from "@/app/chat/validators";
import { prisma } from "@/lib/prisma";
import { MessageRole } from "../../../generated/enums";

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
  newMessage: {
    id: string;
    chatId: string;
    role: MessageRole;
    parts: MessagePart[];
  };
}

export async function createChatMessage({
  newMessage,
}: CreateChatMessageParams) {
  const message = await prisma.chatMessage.create({
    data: {
      id: newMessage.id, // created by the Vercel AI SDK
      chatId: newMessage.chatId,
      role: newMessage.role,
      parts: newMessage.parts,
    },
  });
  return message;
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
}: GetMessagesForChatParams) {
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take,
        skip,
      },
      story: {
        include: {
          character: true,
          persona: true,
        },
      },
    },
  });

  if (chat) chat.messages.reverse();

  return chat;
}
