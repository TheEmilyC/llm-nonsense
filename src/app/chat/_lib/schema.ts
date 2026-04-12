import { UIDataTypes, UIMessagePart, UITools } from "ai";
import z from "zod";

import {
  dbIdValidator,
  entityProfileSchema,
  messageRoleSchema,
} from "@/app/_shared/schema";
import { promptFragmentSchema } from "@/app/prompt/_lib/schema";

export const CHAT_CACHE_KEY = "chat";

// -- Base

// trying to replicate these types DRY is a headache
export const messagePartSchema = z.custom<MessagePart>();
export type MessagePart = UIMessagePart<UIDataTypes, UITools>;

export const chatEntitySchema = z.object({
  createdAt: z.date(),
  id: dbIdValidator,
  modifiedAt: z.date(),
  name: z.string().min(1),
  storyId: dbIdValidator,
});
export type ChatEntity = z.infer<typeof chatEntitySchema>;

export const chatMessageEntitySchema = z.object({
  chatId: dbIdValidator,
  createdAt: z.date(),
  id: dbIdValidator,
  isHidden: z.boolean(),
  modifiedAt: z.date(),
});
export type ChatMessageEntity = z.infer<typeof chatMessageEntitySchema>;

const messageContentEntitySchema = z.object({
  createdAt: z.date(),
  id: z.string().min(1, "id is required"), // created by Vercel AI SDK so doesn't match dbIdValidator pattern
  isActive: z.boolean(),
  messageId: dbIdValidator,
  modifiedAt: z.date(),
  parts: z.custom<MessagePart>().array(),
  role: messageRoleSchema,
});
export type MessageContentEntity = z.infer<typeof messageContentEntitySchema>;

// -- Schemas

export const updateContentActionParamsSchema = z.object({
  id: z.string().min(1),
  update: messageContentEntitySchema
    .pick({
      isActive: true,
      parts: true,
      role: true,
    })
    .partial(),
});
export type UpdateContentActionParams = z.infer<
  typeof updateContentActionParamsSchema
>;

export const updateChatMessageActionParamsSchema = z.object({
  id: dbIdValidator,
  update: chatMessageEntitySchema
    .pick({
      isHidden: true,
    })
    .partial(),
});
export type UpdateChatMessageActionParams = z.infer<
  typeof updateChatMessageActionParamsSchema
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

export const chatListDtoSchema = chatEntitySchema.pick({
  id: true,
  name: true,
});
export type ChatListDto = z.infer<typeof chatListDtoSchema>;

export const chatMessageDtoSchema = chatMessageEntitySchema
  .pick({
    id: true,
    isHidden: true,
  })
  .extend({
    contents: messageContentEntitySchema
      .pick({
        id: true,
        isActive: true,
        parts: true,
        role: true,
      })
      .array(),
  });
export type ChatMessageDto = z.infer<typeof chatMessageDtoSchema>;

export const chatSessionDtoSchema = chatEntitySchema
  .pick({
    id: true,
    name: true,
  })
  .extend({
    character: entityProfileSchema,
    messages: chatMessageDtoSchema.array(),
    persona: entityProfileSchema,
    story: z.object({
      id: dbIdValidator,
      name: z.string().min(1),
    }),
  });
export type ChatSessionDto = z.infer<typeof chatSessionDtoSchema>;

export const chatSessionSchema = chatEntitySchema
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
    messages: chatMessageEntitySchema
      .pick({ id: true })
      .extend(
        messageContentEntitySchema.pick({
          role: true,
        }).shape,
      )
      .extend({
        content: z.string(),
      })
      .array(),
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
      promptFragments: promptFragmentSchema.array(),
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
export type ChatSession = z.infer<typeof chatSessionSchema>;
