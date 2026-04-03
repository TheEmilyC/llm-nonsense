import { dbIdValidator } from "@/lib/validators";
import { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import z from "zod";
import { MessageRole } from "../../../../generated/enums";

export type MessagePart = UIMessagePart<UIDataTypes, UITools>;
export const messagePartSchema = z.custom<MessagePart>();

const profileSchema = z.object({
  id: dbIdValidator,
  name: z.string(),
  avatarSrc: z.string(),
});

export const messageContentDtoSchema = z.object({
  id: dbIdValidator,
  role: z.enum(MessageRole),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  parts: z.custom<MessagePart>().array(),
  isActive: z.boolean(),
});

export const chatMessageDtoSchema = z.object({
  id: z.string().min(1, "id is required"), // created by Vercel so doesn't match dbIdValidator pattern
  contents: messageContentDtoSchema.array(),
});
export type ChatMessageDto = z.infer<typeof chatMessageDtoSchema>;

export function messageDtoToUIMessage(chatMessage: ChatMessageDto): UIMessage {
  let activeContent = chatMessage.contents.find((msg) => msg.isActive);
  if (!activeContent && chatMessage.contents.length > 0) {
    activeContent = chatMessage.contents[0];
  }
  if (!activeContent) throw new Error(`No content for message ${chatMessage.id}`);
  return {
    id: chatMessage.id,
    role: activeContent.role,
    parts: activeContent.parts,
    metadata: activeContent.metadata,
  };
}

export const chatWithMessagesDtoSchema = z.object({
  id: dbIdValidator,
  name: z.string().min(1, "Name is required"),
  storyId: dbIdValidator,
  storyName: z.string().min(1, "Story Name is required"),
  lorebookId: dbIdValidator.optional(),
  worldId: dbIdValidator.optional(),
  messages: chatMessageDtoSchema.array(),
  character: profileSchema,
  persona: profileSchema,
});
export type ChatWithMessagesDto = z.infer<typeof chatWithMessagesDtoSchema>;

// export const chatViewParamsSchema = z.object({
//   chat: z.object({
//     id: z.string(),
//     name: z.string(),
//     story: z.object({
//       id: z.string(),
//       name: z.string(),
//     }),
//     messages: chatMessageSchema.array().optional(),
//   }),
//   character: profileSchema,
//   persona: profileSchema,
// });
// export type ChatViewParams = z.infer<typeof chatViewParamsSchema>;
