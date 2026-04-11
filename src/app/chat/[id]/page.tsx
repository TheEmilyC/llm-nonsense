import { notFound } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

import { ChatView } from "@/app/chat/_components/chat-view";
import { getChatSession } from "@/app/chat/_lib/data";
import { ChatProfile } from "@/app/chat/_lib/schema";
import { buildCharacterImageUrl, buildPersonaImageUrl } from "@/lib/image";
import { dbIdValidator } from "@/lib/validators";

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
  const chatSession = await getChatSession({ id });
  if (!chatSession) notFound();

  const characterProfile: ChatProfile = {
    avatarSrc: buildCharacterImageUrl({
      id: chatSession.character.id,
      pngHash: chatSession.character.pngHash,
    }),
    id: chatSession.character.id,
    name: chatSession.character.name,
  };
  const personaProfile: ChatProfile = {
    avatarSrc: buildPersonaImageUrl({
      id: chatSession.persona.id,
      imageHash: chatSession.persona.imageHash,
    }),
    id: chatSession.persona.id,
    name: chatSession.persona.name,
  };
  const chat = {
    id: chatSession.id,
    messages: chatSession.messages.reverse(),
    name: chatSession.name,
  };

  return (
    <ChatView
      character={characterProfile}
      chat={chat}
      persona={personaProfile}
      story={chatSession.story}
    />
  );
}
