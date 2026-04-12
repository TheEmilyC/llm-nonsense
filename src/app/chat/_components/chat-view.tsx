"use client";

import { EntityProfile } from "@/app/_shared/schema";
import { useChatMessages } from "@/app/chat/_lib/hooks";
import { ChatMessageWithContentDto } from "@/app/chat/_lib/schema";
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
  character: EntityProfile;
  chat: { id: string; messages: ChatMessageWithContentDto[]; name: string };
  persona: EntityProfile;
  story: { id: string; name: string };
}

export function ChatView({ character, chat, persona, story }: ChatViewParams) {
  const {
    deleteMessage,
    editMessage,
    handleSubmit,
    input,
    messages,
    setInput,
    status,
    stop,
    swipe,
  } = useChatMessages(chat.id, chat.messages);
  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        backLinkDestination={`/story/${story.id}`}
        backLinkLabel={story.name}
        pageTitle={chat.name}
      />
      <div className="w-full mx-auto max-w-6xl p-6 flex-1 flex flex-col min-h-0">
        <ChatContainer>
          <ChatHistory>
            <ChatMessages
              character={character}
              messages={messages}
              onDelete={deleteMessage}
              onEdit={editMessage}
              persona={persona}
              status={status}
            />
            {status === "submitted" && (
              <ChatMessageThinking character={character} />
            )}
            {lastMessage &&
              lastMessage.role === "assistant" &&
              status !== "streaming" && <ChatSwipe swipe={swipe} />}
          </ChatHistory>
          <ChatInput
            input={input}
            isLoading={status !== "ready"}
            onInputChange={setInput}
            onStop={stop}
            onSubmit={handleSubmit}
          />
        </ChatContainer>
      </div>
    </div>
  );
}
