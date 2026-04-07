import { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import z from "zod";

import { dbIdValidator } from "@/lib/validators";

import { MessageContent } from "../../../../generated/client";

export enum MessageRole {
  assistant = "assistant",
  system = "system",
  user = "user",
}

export type MessagePart = UIMessagePart<UIDataTypes, UITools>;
export const messagePartSchema = z.custom<MessagePart>();

const profileSchema = z.object({
  avatarSrc: z.string(),
  id: dbIdValidator,
  name: z.string(),
});

export const messageContentDtoSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  parts: z.custom<MessagePart>().array(),
  role: z.enum(MessageRole),
});
export type MessageContentDto = z.infer<typeof messageContentDtoSchema>;

export function messageContentToDto(
  content: MessageContent,
): MessageContentDto {
  return messageContentDtoSchema.parse({
    ...content,
    metadata: content.metadata ?? undefined,
  });
}

export const chatMessageDtoSchema = z.object({
  contents: messageContentDtoSchema.array(),
  id: z.string().min(1, "id is required"), // created by Vercel so doesn't match dbIdValidator pattern
});
export type ChatMessageDto = z.infer<typeof chatMessageDtoSchema>;

export function messageDtoToUIMessage(chatMessage: ChatMessageDto): UIMessage {
  const activeContent =
    chatMessage.contents.find((msg) => msg.isActive) ?? chatMessage.contents[0];
  if (!activeContent)
    throw new Error(`No content for message ${chatMessage.id}`);

  return {
    id: chatMessage.id,
    metadata: activeContent.metadata,
    parts: activeContent.parts,
    role: activeContent.role,
  };
}

export const chatWithMessagesDtoSchema = z.object({
  character: profileSchema,
  id: dbIdValidator,
  lorebookId: dbIdValidator.optional(),
  messages: chatMessageDtoSchema.array(),
  name: z.string().min(1, "Name is required"),
  persona: profileSchema,
  storyId: dbIdValidator,
  storyName: z.string().min(1, "Story Name is required"),
  worldId: dbIdValidator.optional(),
});
export type ChatWithMessagesDto = z.infer<typeof chatWithMessagesDtoSchema>;

export const updateContentActionParamsSchema = z.object({
  id: z.string().min(1),
  update: messageContentDtoSchema
    .pick({
      isActive: true,
      metadata: true,
      parts: true,
      role: true,
    })
    .partial(),
});
export type UpdateContentActionParams = z.infer<
  typeof updateContentActionParamsSchema
>;
