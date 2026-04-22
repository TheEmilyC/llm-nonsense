import { notFound } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";
import { ChatView } from "@/app/chat/_components/chat-view";
import { getChatSessionDto } from "@/app/chat/_lib/data";
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
  const { id } = chatPageParamsSchema.parse(await params);
  const chatSession = await getChatSessionDto({ id });
  if (!chatSession) notFound();
  let lorebook: LorebookStatusDto | null;
  if (!chatSession.story.lorebookId) {
    lorebook = { status: "NONE_SELECTED" };
  } else {
    lorebook = (await getLorebookStatusDto(chatSession.story.lorebookId)) ?? {
      status: "SERVER_UNAVAILABLE",
    };
  }

  return <ChatView chatSession={chatSession} lorebook={lorebook} />;
}
