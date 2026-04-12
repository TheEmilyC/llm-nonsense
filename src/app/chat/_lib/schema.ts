import { UIDataTypes, UIMessagePart, UITools } from "ai";
import z from "zod";

import { messageRoleSchema } from "@/app/_shared/schema";
import { promptFragmentDtoSchema } from "@/app/prompt/_lib/schema";
import { dbIdValidator } from "@/lib/validators";

export const CHAT_CACHE_KEY = "chat";

// -- Base

// trying to replicate these types DRY is a headache
export const messagePartSchema = z.custom<MessagePart>();
export type MessagePart = UIMessagePart<UIDataTypes, UITools>;

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

// -- Schemas

export const updateContentActionParamsSchema = z.object({
  id: z.string().min(1),
  update: baseMessageContentSchema
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

export const chatPostRequestBodySchema = z.object({
  content: z.object({
    id: z.string(),
    parts: z.array(messagePartSchema),
    role: z.enum(["user", "system", "assistant"]),
  }),
  id: z.string(),
  trigger: z.enum(["submit-message", "regenerate-message"]),
});
export type ChatPostRequestBody = z.infer<typeof chatPostRequestBodySchema>;

// -- DTOs

export const chatListDtoSchema = baseChatSchema.pick({
  id: true,
  name: true,
});
export type ChatListDto = z.infer<typeof chatListDtoSchema>;

export const chatDtoSchema = baseChatSchema.pick({
  createdAt: true,
  id: true,
  modifiedAt: true,
  name: true,
  storyId: true,
});
export type ChatDto = z.infer<typeof chatDtoSchema>;

export const messageContentDtoSchema = baseMessageContentSchema.pick({
  id: true,
  isActive: true,
  messageId: true,
  metadata: true,
  parts: true,
  role: true,
});
export type MessageContentDto = z.infer<typeof messageContentDtoSchema>;

export const chatMessageDtoSchema = baseChatMessageSchema.pick({
  chatId: true,
  id: true,
});
export type ChatMessageDto = z.infer<typeof chatMessageDtoSchema>;

export const chatMessageWithContentDtoSchema = baseChatMessageSchema
  .pick({
    id: true,
  })
  .extend({
    contents: baseMessageContentSchema
      .pick({
        id: true,
        isActive: true,
        metadata: true,
        parts: true,
        role: true,
      })
      .array(),
  });
export type ChatMessageWithContentDto = z.infer<
  typeof chatMessageWithContentDtoSchema
>;

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
    messages: chatMessageWithContentDtoSchema.array(),
    persona: z.object({
      id: dbIdValidator,
      imageHash: z.string().min(1),
      name: z.string().min(1),
    }),
    prompt: z.object({
      id: dbIdValidator,
      maxOutputTokens: z.number().int().positive(),
      maxSteps: z.number().int().positive(),
      maxTokens: z.number(),
      promptFragments: promptFragmentDtoSchema.array(),
      temperature: z.number(),
      topK: z.number().int().positive(),
      topP: z.number(),
    }),
    story: z.object({
      id: dbIdValidator,
      name: z.string().min(1, "Story Name is required"),
    }),
    world: z.object({ id: dbIdValidator }).optional(),
  });
export type ChatSessionDto = z.infer<typeof chatSessionDtoSchema>;
