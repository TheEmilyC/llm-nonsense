import { chatPostRequestBodySchema } from "@/app/chat/_lib/schema";
import { constructChatResponse } from "@/app/chat/_lib/service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const {
    content: message,
    model,
    trigger,
    userContentId,
  } = chatPostRequestBodySchema.parse(body);

  return constructChatResponse({
    chatId: id,
    message: message,
    model,
    regenerate: trigger === "regenerate-message",
    providedUserContentId: userContentId,
  });
}
