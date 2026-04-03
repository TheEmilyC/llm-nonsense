import { ChatWithMessagesDto, MessagePart } from "@/app/chat/_lib/schema";
import { buildCharacterImageUrl, buildPersonaImageUrl } from "@/lib/image";
import { prisma } from "@/lib/prisma";
import { MessageRole } from "../../../../generated/enums";

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
      contents: {
        create: {
          role: newMessage.role,
          parts: newMessage.parts,
          isActive: true,
        },
      },
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
}: GetMessagesForChatParams): Promise<ChatWithMessagesDto | null> {
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: { contents: true },
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
        metadata: con.metadata,
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

export async function getMessageById(id: string) {
  return await prisma.chatMessage.findUnique({ where: { id } });
}
