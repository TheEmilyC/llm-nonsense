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
  const {
    editMessage,
    handleSubmit,
    input,
    messages,
    setInput,
    status,
    swipe,
  } = useChatMessages(chat.id, chat.messages);
  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        backLinkDestination={`/story/${chat.storyId}`}
        backLinkLabel={chat.storyName}
        pageTitle={chat.name}
      />
      <div className="mx-auto max-w-6xl p-6">
        <ChatContainer>
          <ChatHistory>
            <ChatMessages
              character={chat.character}
              messages={messages}
              onEdit={editMessage}
              persona={chat.persona}
              status={status}
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
            isLoading={status !== "ready"}
            onInputChange={setInput}
            onSubmit={handleSubmit}
          />
        </ChatContainer>
      </div>
    </div>
  );
}
