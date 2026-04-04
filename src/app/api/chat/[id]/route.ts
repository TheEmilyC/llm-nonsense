import { messagePartSchema } from "@/app/chat/_lib/schema";
import { constructChatResponse } from "@/app/chat/_lib/service";
import z from "zod";

interface Params {
  params: Promise<{ id: string }>;
}

const chatPostRequestBodySchema = z.object({
  id: z.string(),
  content: z.object({
    id: z.string(),
    role: z.enum(["user", "system", "assistant"]),
    parts: z.array(messagePartSchema),
  }),
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
