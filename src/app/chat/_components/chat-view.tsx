"use client";

import { useChatMessages } from "@/app/chat/_lib/hooks";
import { ChatMessageDto, ChatProfile } from "@/app/chat/_lib/schema";
import {
  ChatContainer,
  ChatHistory,
  ChatInput,
  ChatMessages,
  ChatMessageThinking,
  ChatSwipe,
} from "@/components/chat";
import { Header } from "@/components/header";

export interface ChatViewParams {
  character: ChatProfile;
  chat: { id: string; messages: ChatMessageDto[]; name: string };
  persona: ChatProfile;
  story: { id: string; name: string };
}

export function ChatView({ character, chat, persona, story }: ChatViewParams) {
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
        backLinkDestination={`/story/${story.id}`}
        backLinkLabel={story.name}
        pageTitle={chat.name}
      />
      <div className="mx-auto max-w-6xl p-6">
        <ChatContainer>
          <ChatHistory>
            <ChatMessages
              character={character}
              messages={messages}
              onEdit={editMessage}
              persona={persona}
              status={status}
            />
            {status === "submitted" && (
              <ChatMessageThinking character={character} />
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
