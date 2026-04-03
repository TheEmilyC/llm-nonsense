import { ChatView } from "@/app/chat/_components/chat-view";
import { getMessagesForChat } from "@/app/chat/_lib/data";
import { dbIdValidator } from "@/lib/validators";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

interface Props {
  params: Promise<{ id: string }>;
}

const chatPageParamsSchema = z.object({
  id: dbIdValidator,
});

async function ChatPageContent({ params }: Props) {
  const { id } = chatPageParamsSchema.parse(await params);
  const chatDto = await getMessagesForChat({ id });
  if (!chatDto) notFound();

  return <ChatView chat={chatDto} />;
}

export default function ChatPage({ params }: Props) {
  return (
    <Suspense>
      <ChatPageContent params={params} />
    </Suspense>
  );
}
