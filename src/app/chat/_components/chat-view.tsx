"use client";

import { useChatMessages } from "@/app/chat/_lib/hooks";
import { ChatWithMessagesDto } from "@/app/chat/_lib/schema";
import { Chat } from "@/components/chat";
import { Header } from "@/components/header";

export function ChatView({ chat }: { chat: ChatWithMessagesDto }) {
  const { messages, status, input, setInput, handleSubmit, swipe } =
    useChatMessages(chat.id, chat.messages);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        pageTitle={chat.name}
        backLinkLabel={chat.storyName}
        backLinkDestination={`/story/${chat.storyId}`}
      />
      <div className="mx-auto max-w-6xl p-6">
        <Chat
          messages={messages}
          status={status}
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          character={chat.character}
          persona={chat.persona}
          currentSwipe={swipe.swipeIndex + 1}
          swipeCount={swipe.length}
          onSwipeNext={swipe.nextSwipe}
          onSwipePrev={swipe.prevSwipe}
        />
      </div>
    </div>
  );
}
