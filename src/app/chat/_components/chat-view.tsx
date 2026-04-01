"use client";

import { useChatMessages } from "@/app/chat/_lib/hooks";
import { ChatViewParams } from "@/app/chat/_lib/schema";
import { Chat } from "@/components/chat";
import { Header } from "@/components/header";

export function ChatView({ chat, character, persona }: ChatViewParams) {
  const initialMessages = (chat.messages ?? []).map((msg) => ({
    ...msg,
    parts: msg.contents[0]?.parts ?? [],
  }));
  const { messages, status, input, setInput, handleSubmit } = useChatMessages(
    chat.id,
    initialMessages,
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        pageTitle={chat.name}
        backLinkLabel={chat.story.name}
        backLinkDestination={`/story/${chat.story.id}`}
      />
      <div className="mx-auto max-w-6xl p-6">
        <Chat
          messages={messages}
          status={status}
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          character={character}
          persona={persona}
        />
      </div>
    </div>
  );
}
