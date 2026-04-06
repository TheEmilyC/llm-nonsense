"use client";

import { useChatMessages } from "@/app/chat/_lib/hooks";
import { ChatWithMessagesDto } from "@/app/chat/_lib/schema";
import {
  ChatContainer,
  ChatHistory,
  ChatInput,
  ChatMessages,
  ChatMessageThinking,
  ChatSwipe,
} from "@/components/chat";
import { Header } from "@/components/header";

export function ChatView({ chat }: { chat: ChatWithMessagesDto }) {
  const { messages, status, input, setInput, handleSubmit, swipe } =
    useChatMessages(chat.id, chat.messages);
  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        pageTitle={chat.name}
        backLinkLabel={chat.storyName}
        backLinkDestination={`/story/${chat.storyId}`}
      />
      <div className="mx-auto max-w-6xl p-6">
        <ChatContainer>
          <ChatHistory>
            <ChatMessages
              messages={messages}
              status={status}
              character={chat.character}
              persona={chat.persona}
            />
            {status === "submitted" && (
              <ChatMessageThinking character={chat.character} />
            )}
            {lastMessage.role === "assistant" && status !== "streaming" && (
              <ChatSwipe swipe={swipe} />
            )}
          </ChatHistory>
          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={status !== "ready"}
          />
        </ChatContainer>
      </div>
    </div>
  );
}
