import { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import z from "zod";

import {
  dbIdValidator,
  entityProfileSchema,
  messageRoleSchema,
} from "@/app/_shared/schema";
import { characterEntitySchema } from "@/app/character/_lib/schema";
import { lorebookFactSchema } from "@/app/lorebook/_lib/schema";
import { personaEntitySchema } from "@/app/persona/_lib/schema";
import { promptWithFragmentsSchema } from "@/app/prompt/_lib/schema";
import { storyEntitySchema } from "@/app/story/_lib/schema";
import { worldEntitySchema } from "@/app/world/_lib/schema";

export const CHAT_CACHE_KEY = "chat";

// -- Base

export const chatModelKeySchema = z.enum([
  "deepseek",
  "gemini",
  "glm",
  "kimi",
  "opus4_6",
  "opus4_7",
  "fable",
]);
export type ChatModelKey = z.infer<typeof chatModelKeySchema>;

export const messageMetadataSchema = z.object({
  contentId: dbIdValidator,
  model: chatModelKeySchema.optional(),
});
export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// trying to replicate these types in Adapter Pattern is a headache
export const messagePartSchema = z.custom<MessagePart>();
export type LlmnUIMessage = UIMessage<MessageMetadata>;
export type MessagePart = UIMessagePart<UIDataTypes, UITools>;

export const chatEntitySchema = z.object({
  createdAt: z.date(),
  facts: lorebookFactSchema.array(),
  id: dbIdValidator,
  modifiedAt: z.date(),
  name: z.string().min(1),
  storyId: dbIdValidator.optional(),
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
  id: dbIdValidator,
  isActive: z.boolean(),
  messageId: dbIdValidator,
  metadata: messageMetadataSchema,
  modifiedAt: z.date(),
  parts: z.custom<MessagePart>().array(),
  role: messageRoleSchema,
});
export type MessageContentEntity = z.infer<typeof messageContentEntitySchema>;

const chatMessageForLLMSchema = chatMessageEntitySchema
  .pick({ id: true })
  .extend(
    messageContentEntitySchema.pick({
      role: true,
    }).shape,
  )
  .extend({
    content: z.string(),
  });

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
  model: chatModelKeySchema,
  trigger: z.enum(["submit-message", "regenerate-message"]),
  userContentId: dbIdValidator.optional(),
});
export type ChatPostRequestBody = z.infer<typeof chatPostRequestBodySchema>;

export const generateSummariesActionParamsSchema = z.object({
  chatId: dbIdValidator,
  messageIds: dbIdValidator.array(),
});
export type GenerateSummariesActionParams = z.infer<
  typeof generateSummariesActionParamsSchema
>;

export const saveChatFactsActionParamsSchema = z.object({
  chatId: dbIdValidator,
  facts: lorebookFactSchema.array(),
});
export type SaveChatFactsActionParams = z.infer<
  typeof saveChatFactsActionParamsSchema
>;

export const storyChatSessionSchema = chatEntitySchema
  .pick({
    id: true,
    name: true,
  })
  .extend({
    character: characterEntitySchema,
    lorebookId: dbIdValidator.optional(),
    messages: chatMessageForLLMSchema.array(),
    persona: personaEntitySchema,
    prompt: promptWithFragmentsSchema,
    story: storyEntitySchema,
    world: worldEntitySchema.optional(),
  });
export type StoryChatSession = z.infer<typeof storyChatSessionSchema>;

export const chatSessionSchema = chatEntitySchema
  .pick({
    id: true,
    name: true,
  })
  .extend({
    messages: chatMessageForLLMSchema.array(),
  });
export type ChatSession = z.infer<typeof chatSessionSchema>;

const memoryGenMessageTextPartSchema = z.object({
  content: z.string(),
  type: z.literal("text"),
});

const memoryGenMessageToolPartSchema = z.object({
  entries: z.string().array(),
  type: z.literal("tool"),
});

export const memoryGenMessagePartSchema = z.discriminatedUnion("type", [
  memoryGenMessageTextPartSchema,
  memoryGenMessageToolPartSchema,
]);
export type MemoryGenMessagePart = z.infer<typeof memoryGenMessagePartSchema>;

const memoryGenMessageSchema = chatMessageEntitySchema
  .pick({ id: true })
  .extend(messageContentEntitySchema.pick({ role: true }).shape)
  .extend({
    parts: memoryGenMessagePartSchema.array(),
  });
export type MemoryGenMessage = z.infer<typeof memoryGenMessageSchema>;

export const chatForMemoryGenSchema = chatEntitySchema
  .pick({
    id: true,
  })
  .extend({
    facts: lorebookFactSchema.array().optional(),
    lorebookId: dbIdValidator.optional(),
    messages: memoryGenMessageSchema.array(),
  });
export type ChatForMemoryGen = z.infer<typeof chatForMemoryGenSchema>;

export const generateSummariesActionResponseSchema = z.object({
  cast: z.string().optional(),
  content: z.string(),
  facts: lorebookFactSchema.array().optional(),
  summary: z.string(),
});
export type GenerateSummariesActionResponse = z.infer<
  typeof generateSummariesActionResponseSchema
>;

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
        metadata: true,
        parts: true,
        role: true,
      })
      .array(),
  });
export type ChatMessageDto = z.infer<typeof chatMessageDtoSchema>;

export const storyChatSessionDtoSchema = chatEntitySchema
  .pick({
    facts: true,
    id: true,
    name: true,
  })
  .extend({
    character: entityProfileSchema,
    messages: chatMessageDtoSchema.array(),
    persona: entityProfileSchema,
    story: storyEntitySchema.pick({ id: true, lorebookId: true, name: true }),
  });
export type StoryChatSessionDto = z.infer<typeof storyChatSessionDtoSchema>;

export const chatSessionDtoSchema = chatEntitySchema
  .pick({
    facts: true,
    id: true,
    name: true,
  })
  .extend({
    messages: chatMessageDtoSchema.array(),
  });
export type ChatSessionDto = z.infer<typeof chatSessionDtoSchema>;
