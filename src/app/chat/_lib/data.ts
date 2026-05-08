"use server";

import { cacheTag } from "next/cache";

import {
  CHAT_CACHE_KEY,
  ChatEntity,
  ChatForMemoryGen,
  ChatListDto,
  ChatMessageEntity,
  MessageContentEntity,
  MessageMetadata,
  StoryChatSession,
  StoryChatSessionDto,
} from "@/app/chat/_lib/schema";
import { promptWithFragmentsSchema } from "@/app/prompt/_lib/schema";
import { Chat, ChatMessage, MessageContent, Prisma } from "@/generated/client";
import { buildCharacterImageUrl, buildPersonaImageUrl } from "@/lib/image";
import { prisma } from "@/lib/prisma";

export interface CreateChatMessageContentParams {
  chatId: string;
  messageContent: Pick<
    MessageContent,
    "isActive" | "metadata" | "parts" | "role"
  > & {
    id?: string;
    metadata?: MessageMetadata;
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

export interface UpdateChatParams {
  id: string;
  update: Prisma.ChatUpdateInput;
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

  return {
    ...chat,
    facts: chat.facts ?? [],
    storyId: chat.storyId ?? undefined,
  };
}

export async function createChatMessageContent({
  chatId,
  messageContent,
  messageId,
}: CreateChatMessageContentParams): Promise<MessageContentEntity> {
  const result = await prisma.$transaction(async (tx) => {
    let contentMsgId: string | undefined;
    if (messageId) {
      const existingMsg = await tx.chatMessage.findUnique({
        where: { id: messageId },
      });
      if (existingMsg) {
        contentMsgId = existingMsg.id;
        if (messageContent.isActive) {
          // only one message may be active at a time
          await tx.messageContent.updateMany({
            data: { isActive: false },
            where: { messageId },
          });
        }
      }
    }

    if (!contentMsgId) {
      const message = await tx.chatMessage.create({
        data: { chatId, id: messageId },
      });
      contentMsgId = message.id;
    }

    return tx.messageContent.create({
      data: {
        ...messageContent,
        messageId: contentMsgId,
        metadata: messageContent.metadata ?? undefined,
      },
    });
  });

  return { ...result, metadata: result.metadata ?? { contentId: result.id } };
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
  return {
    ...chat,
    facts: chat.facts ?? [],
    storyId: chat.storyId ?? undefined,
  };
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
  if (!chat?.story) return null;

  return {
    facts: chat.facts ?? undefined,
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

export async function getStoryChatSession({
  id,
  skip = 0,
  take = 50,
}: GetChatSessionParams): Promise<null | StoryChatSession> {
  // Intentionally not cached, serves old messages to the chat service if it is

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
  if (!chat?.story) return null;

  return {
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
    // Prompt fragment parsing gets complicated, letting zod handle it
    prompt: promptWithFragmentsSchema.parse(chat.story.prompt),
    story: {
      ...chat.story,
      lorebookId: chat.story.lorebookId ?? undefined,
      worldId: chat.story.worldId ?? undefined,
    },
    world: chat.story.world ?? undefined,
  };
}

export async function getStoryChatSessionDto({
  id,
  skip,
  take,
}: GetChatSessionViewParams): Promise<null | StoryChatSessionDto> {
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
  if (!chat?.story) return null;

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
    facts: chat.facts ?? [],
    id: chat.id,
    messages: chat.messages.reverse().map((msg) => ({
      contents: msg.contents.map((con) => ({
        id: con.id,
        isActive: con.isActive,
        metadata: con.metadata ?? { contentId: con.id },
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
      lorebookId: chat.story.lorebookId ?? undefined,
      name: chat.story.name,
    },
  };
}

export async function hideChatMessages(ids: string[]): Promise<void> {
  await prisma.chatMessage.updateMany({
    data: { isHidden: true },
    where: { id: { in: ids } },
  });
}

export async function updateChat({
  id,
  update,
}: UpdateChatParams): Promise<void> {
  await prisma.chat.update({ data: update, where: { id } });
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
        metadata: update.metadata ?? undefined,
        parts: update.parts,
        role: update.role,
      },
      where: { id },
    });
  });

  return { ...result, metadata: result.metadata ?? { contentId: id } };
}

function toChatListDto(chatList: Chat[]): ChatListDto[] {
  return chatList.map(({ id, name }) => ({ id, name }));
}
