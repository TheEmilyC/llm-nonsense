"use server";

import { cacheTag, revalidateTag } from "next/cache";

import {
  CHAT_CACHE_KEY,
  ChatListDto,
  chatListDtoSchema,
  ChatSessionDto,
  chatSessionDtoSchema,
  MessageContentDto,
  messageContentDtoSchema,
} from "@/app/chat/_lib/schema";
import { Chat, ChatMessage, MessageContent } from "@/generated/client";
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

export interface GetChatSessionParams {
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

  revalidateTag(CHAT_CACHE_KEY, "max");
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

  revalidateTag(`${CHAT_CACHE_KEY}-${chatId}`, "max");
  return messageContentToDto(result);
}

export async function deleteChat(id: string) {
  const result = await prisma.chat.delete({ where: { id } });
  revalidateTag(CHAT_CACHE_KEY, "max");
  revalidateTag(`${CHAT_CACHE_KEY}-${id}`, "max");
  return result;
}

export async function getChatSession({
  id,
  skip = 0,
  take = 50,
}: GetChatSessionParams): Promise<ChatSessionDto> {
  "use cache";
  cacheTag(CHAT_CACHE_KEY, `${CHAT_CACHE_KEY}-${id}`);

  const chat = await prisma.chat.findUniqueOrThrow({
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

  if (chat.messages.length > 0) {
    // fetch all content for last message
    const lastMessage = chat.messages[0];
    const fullContents = await prisma.messageContent.findMany({
      where: { messageId: lastMessage.id },
    });
    lastMessage.contents = fullContents;
  }

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
    select: { id: true, name: true },
    where: { storyId },
  });

  return chatListToDto(result);
}

export async function updateMessageContent({
  id,
  update,
}: UpdateMessageContentParams): Promise<MessageContentDto> {
  const result = await prisma.$transaction(async (tx) => {
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
      data: update,
      where: { id },
    });
  });

  const message = await prisma.chatMessage.findUnique({
    select: { chatId: true },
    where: { id: result.messageId },
  });
  if (message) revalidateTag(`${CHAT_CACHE_KEY}-${message.chatId}`, "max");

  return messageContentToDto(result);
}

function chatListToDto(chatList: Partial<Chat>[]): ChatListDto[] {
  return chatListDtoSchema.array().parse(chatList);
}

function messageContentToDto(content: MessageContent): MessageContentDto {
  return messageContentDtoSchema.parse({
    ...content,
    metadata: content.metadata ?? undefined,
  });
}
