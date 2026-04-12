"use client";

import { useChatMessages } from "@/app/chat/_lib/hooks";
import { ChatSessionDto } from "@/app/chat/_lib/schema";
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
  chatSession: ChatSessionDto;
}

export function ChatView({ chatSession }: ChatViewParams) {
  const {
    deleteMessage,
    editContent,
    handleSubmit,
    hiddenMessages,
    hideMessage,
    input,
    messages,
    setInput,
    status,
    stop,
    swipe,
  } = useChatMessages(chatSession.id, chatSession.messages);
  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        backLinkDestination={`/story/${chatSession.story.id}`}
        backLinkLabel={chatSession.story.name}
        pageTitle={chatSession.name}
      />
      <div className="w-full mx-auto max-w-6xl p-6 flex-1 flex flex-col min-h-0">
        <ChatContainer>
          <ChatHistory>
            <ChatMessages
              character={chatSession.character}
              hiddenMessages={hiddenMessages}
              messages={messages}
              onDelete={deleteMessage}
              onEdit={editContent}
              onHide={hideMessage}
              persona={chatSession.persona}
              status={status}
            />
            {status === "submitted" && (
              <ChatMessageThinking character={chatSession.character} />
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
