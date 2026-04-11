"use server";

import { cacheTag, revalidateTag } from "next/cache";

import {
  CHAT_CACHE_KEY,
  ChatDto,
  chatDtoSchema,
  ChatListDto,
  ChatMessageDto,
  ChatSessionDto,
  chatSessionDtoSchema,
  MessageContentDto,
} from "@/app/chat/_lib/schema";
import { Chat, ChatMessage, MessageContent } from "@/generated/client";
import { NotFoundError } from "@/lib/error";
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

export interface UpdateMessageContentParams {
  id: string;
  update: Partial<
    Pick<MessageContent, "isActive" | "metadata" | "parts" | "role">
  >;
}

export async function createChat({
  newChat,
}: CreateChatParams): Promise<ChatDto> {
  const chat = await prisma.chat.create({
    data: {
      name: newChat.name,
      storyId: newChat.storyId,
    },
  });

  revalidateTag(CHAT_CACHE_KEY, "max");
  return toChatDto(chat);
}

export async function createChatMessage({
  newMessage,
}: CreateChatMessageParams): Promise<ChatMessageDto> {
  const chatMessage = await prisma.chatMessage.create({
    data: {
      chatId: newMessage.chatId,
    },
  });
  return toChatMessageDto(chatMessage);
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

  revalidateTag(`${CHAT_CACHE_KEY}-${chatId}`, "max");
  return toMessageContentDto(result);
}

export async function deleteChat(id: string) {
  await prisma.chat.delete({ where: { id } });
  revalidateTag(CHAT_CACHE_KEY, "max");
  revalidateTag(`${CHAT_CACHE_KEY}-${id}`, "max");
}

export async function deleteChatMessage(id: string) {
  const message = await prisma.chatMessage.findUnique({
    select: { chatId: true },
    where: { id },
  });
  await prisma.chatMessage.delete({ where: { id } });
  if (message) revalidateTag(`${CHAT_CACHE_KEY}-${message.chatId}`, "max");
}

export async function getChatById(id: string): Promise<ChatDto | null> {
  "use cache";
  cacheTag(`${CHAT_CACHE_KEY}-${id}`);

  const chat = await prisma.chat.findUnique({ where: { id } });
  if (!chat) return null;
  return chatDtoSchema.parse(chat);
}

export async function getChatSession({
  id,
  skip = 0,
  take = 50,
}: GetChatSessionParams): Promise<ChatSessionDto | null> {
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

  if (chat.messages.length > 0) {
    // fetch all content for last message
    const lastMessage = chat.messages[0];
    const fullContents = await prisma.messageContent.findMany({
      where: { messageId: lastMessage.id },
    });
    lastMessage.contents = fullContents;
  }

  // Prompt fragment parsing gets complicated, letting zod handle it
  return chatSessionDtoSchema.parse({
    character: chat.story.character,
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
    persona: chat.story.persona,
    prompt: chat.story.prompt,
    story: {
      id: chat.storyId,
      name: chat.story.name,
    },
  } as ChatSessionDto);
}

export async function getChatsForStory(
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

export async function updateMessageContent({
  id,
  update,
}: UpdateMessageContentParams): Promise<MessageContentDto> {
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

  const message = await prisma.chatMessage.findUnique({
    select: { chatId: true },
    where: { id: result.messageId },
  });
  if (message) revalidateTag(`${CHAT_CACHE_KEY}-${message.chatId}`, "max");

  return toMessageContentDto(result);
}

function toChatDto(chat: Chat): ChatDto {
  return {
    createdAt: chat.createdAt,
    id: chat.id,
    modifiedAt: chat.modifiedAt,
    name: chat.name,
    storyId: chat.storyId,
  };
}

function toChatListDto(chatList: Chat[]): ChatListDto[] {
  return chatList.map(({ id, name }) => ({ id, name }));
}

function toChatMessageDto(message: ChatMessage): ChatMessageDto {
  return {
    chatId: message.chatId,
    id: message.id,
  };
}

function toMessageContentDto(content: MessageContent): MessageContentDto {
  return {
    id: content.id,
    isActive: content.isActive,
    parts: content.parts,
    role: content.role,
  };
}
