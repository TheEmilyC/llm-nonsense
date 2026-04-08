import { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import z from "zod";

import { dbIdValidator } from "@/lib/validators";

export const CHAT_CACHE_KEY = "chat";

export const messagePartSchema = z.custom<MessagePart>();
export type MessagePart = UIMessagePart<UIDataTypes, UITools>;

export const messageRoleSchema = z.enum(["assistant", "system", "user"]);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const chatProfileSchema = z.object({
  avatarSrc: z.string().min(1),
  id: dbIdValidator,
  name: z.string().min(1),
});
export type ChatProfile = z.infer<typeof chatProfileSchema>;

const baseChatSchema = z.object({
  createdAt: z.date(),
  id: dbIdValidator,
  modifiedAt: z.date(),
  name: z.string().min(1),
  storyId: dbIdValidator,
});

const baseChatMessageSchema = z.object({
  chatId: dbIdValidator,
  createdAt: z.date(),
  id: dbIdValidator,
  modifiedAt: z.date(),
});

const baseMessageContentSchema = z.object({
  createdAt: z.date(),
  id: z.string().min(1, "id is required"), // created by Vercel AI SDK so doesn't match dbIdValidator pattern
  isActive: z.boolean(),
  messageId: dbIdValidator,
  metadata: z.record(z.string(), z.unknown()).optional(),
  modifiedAt: z.date(),
  parts: z.custom<MessagePart>().array(),
  role: messageRoleSchema,
});

export const messageContentDtoSchema = baseMessageContentSchema.pick({
  id: true,
  isActive: true,
  metadata: true,
  parts: true,
  role: true,
});
export type MessageContentDto = z.infer<typeof messageContentDtoSchema>;

export const chatMessageDtoSchema = baseChatMessageSchema
  .pick({
    id: true,
  })
  .extend({ contents: messageContentDtoSchema.array() });
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

export const chatSessionDtoSchema = baseChatSchema
  .pick({
    id: true,
    name: true,
  })
  .extend({
    character: z.object({
      id: dbIdValidator,
      name: z.string().min(1),
      pngHash: z.string().min(1),
    }),
    lorebookId: dbIdValidator.optional(),
    messages: chatMessageDtoSchema.array(),
    persona: z.object({
      id: dbIdValidator,
      imageHash: z.string().min(1),
      name: z.string().min(1),
    }),
    prompt: z.object({
      id: dbIdValidator,
      promptFragments: z.object({ id: dbIdValidator }).array(),
    }),
    story: z.object({
      id: dbIdValidator,
      name: z.string().min(1, "Story Name is required"),
    }),
    world: z.object({ id: dbIdValidator }).optional(),
  });
export type ChatSessionDto = z.infer<typeof chatSessionDtoSchema>;

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

export const chatListDtoSchema = baseChatSchema.pick({
  id: true,
  name: true,
});
export type ChatListDto = z.infer<typeof chatListDtoSchema>;
