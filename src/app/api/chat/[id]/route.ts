import z from "zod";

import { messagePartSchema } from "@/app/chat/_lib/schema";
import { constructChatResponse } from "@/app/chat/_lib/service";

interface Params {
  params: Promise<{ id: string }>;
}

const chatPostRequestBodySchema = z.object({
  content: z.object({
    id: z.string(),
    parts: z.array(messagePartSchema),
    role: z.enum(["user", "system", "assistant"]),
  }),
  id: z.string(),
  trigger: z.enum(["submit-message", "regenerate-message"]),
});

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { content: message, trigger } = chatPostRequestBodySchema.parse(body);
  return constructChatResponse({
    chatId: id,
    message: message,
    regenerate: trigger === "regenerate-message",
  });
}
