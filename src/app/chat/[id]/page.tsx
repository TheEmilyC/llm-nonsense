import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";
import { BasicChatView } from "@/app/chat/_components/basic-chat-view";
import { ChatView } from "@/app/chat/_components/chat-view";
import {
  getChatSessionDto,
  getStoryChatSessionDto,
} from "@/app/chat/_lib/data";
import { getLorebookStatusDto } from "@/app/lorebook/_lib/data";
import { LorebookStatusDto } from "@/app/lorebook/_lib/schema";

interface Props {
  params: Promise<{ id: string }>;
}

const chatPageParamsSchema = z.object({
  id: dbIdValidator,
});

export default function ChatPage({ params }: Props) {
  return (
    <Suspense>
      <ChatPageContent params={params} />
    </Suspense>
  );
}

async function ChatPageContent({ params }: Props) {
  await connection();
  const { id } = chatPageParamsSchema.parse(await params);

  const storyChatSession = await getStoryChatSessionDto({ id });
  if (storyChatSession) {
    let lorebook: LorebookStatusDto;
    if (!storyChatSession.story.lorebookId) {
      lorebook = { status: "NONE_SELECTED" };
    } else {
      lorebook = (await getLorebookStatusDto(
        storyChatSession.story.lorebookId,
      )) ?? {
        status: "SERVER_UNAVAILABLE",
      };
    }
    return <ChatView chatSession={storyChatSession} lorebook={lorebook} />;
  }

  const chatSession = await getChatSessionDto({ id });
  if (!chatSession) notFound();
  return <BasicChatView chatSession={chatSession} />;
}
