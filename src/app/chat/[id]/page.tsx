import { ChatView } from "@/app/chat/_components/chat-view";
import { getMessagesForChat } from "@/app/chat/_lib/data";
import { buildCharacterImageUrl, buildPersonaImageUrl } from "@/lib/image";
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
  const chatDTO = await getMessagesForChat({ id });
  if (!chatDTO) notFound();
  const chat = {
    id: chatDTO.id,
    name: chatDTO.name,
    story: {
      id: chatDTO.story.id,
      name: chatDTO.story.name,
    },
    messages: chatDTO.messages,
  };
  const persona = {
    id: chatDTO.story.persona.id,
    name: chatDTO.story.persona.name,
    avatarSrc: buildPersonaImageUrl({
      id: chatDTO.story.persona.id,
      imgHash: chatDTO.story.persona.imageHash,
    }),
  };

  const character = {
    id: chatDTO.story.character.id,
    name: chatDTO.story.character.name,
    avatarSrc: buildCharacterImageUrl({
      id: chatDTO.story.character.id,
      pngHash: chatDTO.story.character.pngHash,
    }),
  };

  return (
    <Suspense>
      <ChatView chat={chat} persona={persona} character={character} />
    </Suspense>
  );
}

export default function ChatPage({ params }: Props) {
  return (
    <Suspense>
      <ChatPageContent params={params} />
    </Suspense>
  );
}
