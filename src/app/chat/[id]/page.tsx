import { notFound } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";
import { ChatView } from "@/app/chat/_components/chat-view";
import { getChatSessionDto } from "@/app/chat/_lib/data";

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

  return <ChatView chatSession={chatSession} />;
}
