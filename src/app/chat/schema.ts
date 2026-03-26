import { UIDataTypes, UIMessagePart, UITools } from "ai";
import z from "zod";
import { MessageRole } from "../../../generated/enums";

export type MessagePart = UIMessagePart<UIDataTypes, UITools>;
export const messagePartSchema = z.custom<MessagePart>();

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarSrc: z.string(),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  role: z.enum(MessageRole),
  parts: z.custom<MessagePart>().array(),
  createdAt: z.date(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatViewParamsSchema = z.object({
  chat: z.object({
    id: z.string(),
    name: z.string(),
    story: z.object({
      id: z.string(),
      name: z.string(),
    }),
    messages: chatMessageSchema.array().optional(),
  }),
  character: profileSchema,
  persona: profileSchema,
});
export type ChatViewParams = z.infer<typeof chatViewParamsSchema>;
