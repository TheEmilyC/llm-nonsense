"use server";

import { cacheTag } from "next/cache";

import {
  CHAT_CACHE_KEY,
  ChatEntity,
  ChatForMemoryGen,
  ChatListDto,
  ChatMessageEntity,
  ChatSession,
  ChatSessionDto,
  chatSessionSchema,
  MessageContentEntity,
} from "@/app/chat/_lib/schema";
import { Chat, ChatMessage, MessageContent } from "@/generated/client";
import { NotFoundError } from "@/lib/error";
import { buildCharacterImageUrl, buildPersonaImageUrl } from "@/lib/image";
import { prisma } from "@/lib/prisma";

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

export interface CreateChatParams {
  newChat: {
    name: string;
    storyId: string;
  };
}

export interface GetChatSessionParams {
  id: string;
  skip?: number;
  take?: number;
}

export interface GetChatSessionViewParams {
  id: string;
  skip?: number;
  take?: number;
}

export interface UpdateChatMessageParams {
  id: string;
  update: Partial<Pick<ChatMessage, "isHidden">>;
}

export interface UpdateMessageContentParams {
  id: string;
  update: Partial<
    Pick<MessageContent, "isActive" | "metadata" | "parts" | "role">
  >;
}

export async function createChat({
  newChat,
}: CreateChatParams): Promise<ChatEntity> {
  const chat = await prisma.chat.create({
    data: {
      name: newChat.name,
      storyId: newChat.storyId,
    },
  });

  return chat;
}

export async function createChatMessageContent({
  chatId,
  messageContent,
  messageId,
}: CreateChatMessageContentParams): Promise<MessageContentEntity> {
  const result = await prisma.$transaction(async (tx) => {
    let contentMsgId: string;
    if (messageId) {
      const existingMsg = await tx.chatMessage.findUnique({
        where: { id: messageId },
      });
      if (!existingMsg) throw new NotFoundError("ChatMessage", messageId);
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

  return result;
}

export async function deleteChat(id: string) {
  await prisma.chat.delete({ where: { id } });
}

export async function deleteChatMessage(
  id: string,
): Promise<ChatMessageEntity> {
  const result = await prisma.chatMessage.delete({ where: { id } });
  return result;
}

export async function getChatById(id: string): Promise<ChatEntity | null> {
  "use cache";
  cacheTag(`${CHAT_CACHE_KEY}-${id}`);

  const chat = await prisma.chat.findUnique({ where: { id } });
  if (!chat) return null;
  return chat;
}

export async function getChatForMemoryGen(
  id: string,
  messageIds: string[],
): Promise<ChatForMemoryGen | null> {
  "use cache";
  cacheTag(`${CHAT_CACHE_KEY}-${id}`);

  const chat = await prisma.chat.findUnique({
    include: {
      messages: {
        include: { contents: { where: { isActive: true } } },
        orderBy: { createdAt: "desc" },
        where: { id: { in: messageIds }, isHidden: false },
      },
      story: true,
    },
    where: { id },
  });
  if (!chat) return null;

  return {
    id: chat.id,
    lorebookId: chat.story.lorebookId ?? undefined,
    messages: chat.messages.map((msg) => ({
      content: msg.contents[0].parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n"),
      id: msg.id,
      role: msg.contents[0].role,
    })),
  };
}

export async function getChatMessageById(
  id: string,
): Promise<ChatMessageEntity | null> {
  "use cache";

  const result = await prisma.chatMessage.findUnique({ where: { id } });
  if (!result) return null;

  cacheTag(`${CHAT_CACHE_KEY}-${result.chatId}`);
  return result;
}

export async function getChatSession({
  id,
  skip = 0,
  take = 50,
}: GetChatSessionParams): Promise<ChatSession | null> {
  // Itentionally not cached, serves old messages to the chat service if it is

  const chat = await prisma.chat.findUnique({
    include: {
      messages: {
        include: { contents: { where: { isActive: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        where: { isHidden: false },
      },
      story: {
        include: {
          character: true,
          persona: true,
          prompt: {
            include: {
              promptFragments: {
                orderBy: { order: "asc" },
                where: { enabled: true },
              },
            },
          },
          world: true,
        },
      },
    },
    where: { id },
  });
  if (!chat) return null;

  // Prompt fragment parsing gets complicated, letting zod handle it
  return chatSessionSchema.parse({
    character: chat.story.character,
    id: chat.id,
    lorebookId: chat.story.lorebookId ?? undefined,
    messages: chat.messages.map((msg) => ({
      content: msg.contents[0].parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n"),
      id: msg.id,
      role: msg.contents[0].role,
    })),
    name: chat.name,
    persona: chat.story.persona,
    prompt: chat.story.prompt,
    story: chat.story,
    world: chat.story.world,
  } as ChatSession);
}

export async function getChatSessionDto({
  id,
  skip,
  take,
}: GetChatSessionViewParams): Promise<ChatSessionDto | null> {
  "use cache";
  cacheTag(`${CHAT_CACHE_KEY}-${id}`);
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
        },
      },
    },
    where: { id },
  });
  if (!chat) return null;

  if (chat.messages.length > 0) {
    // fetch all content for last message
    const lastMessage = chat.messages[0];
    const fullContents = await prisma.messageContent.findMany({
      where: { messageId: lastMessage.id },
    });
    lastMessage.contents = fullContents;
  }
  const character = chat.story.character;
  const persona = chat.story.persona;

  return {
    character: {
      id: character.id,
      imageSrc: buildCharacterImageUrl(character.id, character.pngHash),
      name: character.name,
    },
    id: chat.id,
    messages: chat.messages.reverse().map((msg) => ({
      contents: msg.contents.map((con) => ({
        id: con.id,
        isActive: con.isActive,
        parts: con.parts,
        role: con.role,
      })),
      id: msg.id,
      isHidden: msg.isHidden,
    })),
    name: chat.name,
    persona: {
      id: persona.id,
      imageSrc: buildPersonaImageUrl(persona.id, persona.imageHash),
      name: persona.name,
    },
    story: {
      id: chat.story.id,
      name: chat.story.name,
    },
  };
}

export async function getChatsForStoryDto(
  storyId: string,
): Promise<ChatListDto[]> {
  "use cache";
  cacheTag(CHAT_CACHE_KEY);

  const result = await prisma.chat.findMany({
    orderBy: { createdAt: "desc" },
    where: { storyId },
  });

  return toChatListDto(result);
}

export async function getMessagesByIdList(
  chatId: string,
  idList: string[],
  options?: {
    isHidden: boolean;
  },
): Promise<ChatMessageEntity[]> {
  "use cache";
  cacheTag(`${CHAT_CACHE_KEY}-${chatId}`);

  return prisma.chatMessage.findMany({
    where: { chatId, id: { in: idList }, isHidden: options?.isHidden },
  });
}

export async function updateChatMessage({
  id,
  update,
}: UpdateChatMessageParams): Promise<ChatMessageEntity> {
  const result = await prisma.chatMessage.update({
    data: { isHidden: update.isHidden },
    where: { id },
  });

  return result;
}

export async function updateMessageContent({
  id,
  update,
}: UpdateMessageContentParams): Promise<MessageContentEntity> {
  const result = await prisma.$transaction(async (tx) => {
    if (update.isActive) {
      const message = await tx.messageContent.findUniqueOrThrow({
        where: { id },
      });

      await tx.messageContent.updateMany({
        data: { isActive: false },
        where: { messageId: message.messageId, NOT: { id } },
      });
    }

    return tx.messageContent.update({
      data: {
        isActive: update.isActive,
        metadata: update.metadata,
        parts: update.parts,
        role: update.role,
      },
      where: { id },
    });
  });

  return result;
}

function toChatListDto(chatList: Chat[]): ChatListDto[] {
  return chatList.map(({ id, name }) => ({ id, name }));
}
