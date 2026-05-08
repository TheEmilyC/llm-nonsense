import { getChatById } from "@/app/chat/_lib/data";
import { chatPostRequestBodySchema } from "@/app/chat/_lib/schema";
import {
  constructBasicChatResponse,
  constructChatResponse,
} from "@/app/chat/_lib/service";

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

  const chat = await getChatById(id);
  const handler = chat?.storyId ? constructChatResponse : constructBasicChatResponse;

  return handler({
    chatId: id,
    message,
    model,
    providedUserContentId: userContentId,
    regenerate: trigger === "regenerate-message",
  });
}
