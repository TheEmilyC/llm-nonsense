"use client";

import { useState } from "react";

import { useChatMessages } from "@/app/chat/_lib/hooks";
import { ChatModelKey, ChatSessionDto } from "@/app/chat/_lib/schema";
import {
  ChatContainer,
  ChatHistory,
  ChatInput,
  ChatMessage,
  ChatMessageThinking,
} from "@/components/chat";
import { Header } from "@/components/header";

export interface BasicChatViewParams {
  chatSession: ChatSessionDto;
}

export function BasicChatView({ chatSession }: BasicChatViewParams) {
  const {
    handleSubmit,
    message: { deleteMessage, editMessage, messages },
    status,
    stop,
  } = useChatMessages(chatSession);
  const [chatModel, setChatModel] = useState<ChatModelKey>("deepseek");

  function onContentEdit(
    newText: string,
    messageId: string,
    contentId?: string,
  ) {
    if (!contentId) return;
    editMessage(messageId, contentId, newText);
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header pageTitle={chatSession.name} />
      <div className="w-full mx-auto max-w-6xl p-6 flex-1 flex flex-col min-h-0">
        <ChatContainer>
          <ChatHistory>
            <div className="flex flex-col gap-4">
              {messages.map((message, i) => (
                <ChatMessage
                  isHidden={message.isHidden}
                  isStreaming={
                    status === "streaming" && i === messages.length - 1
                  }
                  key={message.id}
                  message={message}
                  onDelete={() => deleteMessage(message.id)}
                  onEdit={(newText) =>
                    onContentEdit(
                      newText,
                      message.id,
                      message.metadata?.contentId,
                    )
                  }
                />
              ))}
            </div>
            {status === "submitted" && <ChatMessageThinking />}
          </ChatHistory>
          <ChatInput
            isLoading={status !== "ready"}
            onModelChange={setChatModel}
            onStop={stop}
            onSubmit={handleSubmit}
            selectedModel={chatModel}
          />
        </ChatContainer>
      </div>
    </div>
  );
}
