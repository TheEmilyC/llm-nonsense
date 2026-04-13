"use client";

import { useState } from "react";

import { useChatMessages } from "@/app/chat/_lib/hooks";
import { ChatSessionDto } from "@/app/chat/_lib/schema";
import {
  ChatContainer,
  ChatHistory,
  ChatInput,
  ChatMessage,
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
    messages,
    status,
    stop,
    swipe,
  } = useChatMessages(chatSession);
  const [memoryStartIndex, setMemoryStartIndex] = useState<
    number | undefined
  >();
  const [memoryEndIndex, setMemoryEndIndex] = useState<number | undefined>();

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
            <div className="flex flex-col gap-4">
              {messages.map((message, i) => (
                <ChatMessage
                  character={chatSession.character}
                  isHidden={hiddenMessages[message.id] ?? false}
                  isStreaming={
                    status === "streaming" && i === messages.length - 1
                  }
                  key={message.id}
                  memory={{
                    isMemoryEnd: memoryEndIndex === i,
                    isMemoryStart: memoryStartIndex === i,
                    onMemoryEnd: () =>
                      memoryEndIndex === i
                        ? setMemoryEndIndex(undefined)
                        : setMemoryEndIndex(i),
                    onMemoryStart: () =>
                      memoryStartIndex === i
                        ? setMemoryStartIndex(undefined)
                        : setMemoryStartIndex(i),
                  }}
                  message={message}
                  onDelete={() => deleteMessage(message.id)}
                  onEdit={(newText) => editContent(message.id, newText)}
                  onHide={() => hideMessage(message.id)}
                  persona={chatSession.persona}
                />
              ))}
            </div>
            {status === "submitted" && (
              <ChatMessageThinking character={chatSession.character} />
            )}
            {lastMessage &&
              lastMessage.role === "assistant" &&
              status !== "streaming" && <ChatSwipe swipe={swipe} />}
          </ChatHistory>
          <ChatInput
            isLoading={status !== "ready"}
            memoryDisable={!memoryStartIndex}
            onStop={stop}
            onSubmit={handleSubmit}
          />
        </ChatContainer>
      </div>
    </div>
  );
}
