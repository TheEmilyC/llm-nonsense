"use client";

import { useChatMessages } from "@/app/chat/hooks";
import { ChatViewParams } from "@/app/chat/schema";
import { Chat } from "@/components/chat";
import { Header } from "@/components/header";

export function ChatView({ chat, character, persona }: ChatViewParams) {
  const { messages, status, input, setInput, handleSubmit } = useChatMessages(
    chat.id,
    chat.messages ?? [],
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
