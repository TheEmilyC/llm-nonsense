import { UIDataTypes, UIMessagePart, UITools } from "ai";
import z from "zod";

export type MessagePart = UIMessagePart<UIDataTypes, UITools>;
export const messagePartSchema = z.custom<MessagePart>();

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarSrc: z.string(),
});

export const chatViewParamsSchema = z.object({
  chat: z.object({
    id: z.string(),
    name: z.string(),
    story: z.object({
      id: z.string(),
      name: z.string(),
    }),
    messages: z
      .object({
        id: z.string(),
        chatId: z.string(),
        metadata: z.record(z.string(), z.unknown()).nullable(),
        role: z.enum(["user", "assistant", "system"]),
        parts: z.custom<MessagePart>().array(),
        createdAt: z.date(),
      })
      .array()
      .optional(),
  }),
  character: profileSchema,
  persona: profileSchema,
});
export type ChatViewParams = z.infer<typeof chatViewParamsSchema>;
