import { messagePartSchema } from "@/app/chat/_lib/schema";
import { constructChatResponse } from "@/app/chat/_lib/service";
import z from "zod";

interface Params {
  params: Promise<{ id: string }>;
}

const chatPostRequestBodySchema = z.object({
  id: z.string(),
  message: z.object({
    id: z.string(),
    role: z.enum(["user", "system", "assistant"]),
    parts: z.array(messagePartSchema),
  }),
  trigger: z.string().optional(),
});

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { message } = chatPostRequestBodySchema.parse(body);
  return constructChatResponse({ id, message: message });
}
