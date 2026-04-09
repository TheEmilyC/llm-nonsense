"use client";

import { UIMessage } from "ai";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Square,
  X,
} from "lucide-react";
import Image from "next/image";
import { ReactNode, useState } from "react";

import { ChatProfile } from "@/app/chat/_lib/schema";
import { Button } from "@/components/ui/button";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ui/reasoning";
import { ScrollButton } from "@/components/ui/scroll-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ChatHistoryContainerParams {
  children: ReactNode;
}

interface ChatHistoryProps {
  children: ReactNode;
}

interface ChatInputParams {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onStop: () => void;
  onSubmit: () => void;
}

interface ChatMessageProps {
  character: ChatProfile;
  isStreaming: boolean;
  message: UIMessage;
  onEdit?: (newText: string) => void;
  persona: ChatProfile;
}

interface ChatMessagesProps {
  character: ChatProfile;
  messages: UIMessage[];
  onEdit?: (messageId: string, newText: string) => void;
  persona: ChatProfile;
  status: "error" | "ready" | "streaming" | "submitted";
}

interface ChatMessageThinkingProps {
  character: ChatProfile;
}

interface ChatSwipeParams {
  swipe: {
    length: number;
    nextSwipe: () => void;
    prevSwipe: () => void;
    swipeIndex: number;
  };
}

export function ChatContainer({ children }: ChatHistoryContainerParams) {
  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-white/20 shadow-xl overflow-hidden">
      {children}
    </div>
  );
}

export function ChatHistory({ children }: ChatHistoryProps) {
  return (
    <ChatContainerRoot className="flex-1 min-h-0">
      <ChatContainerContent className="reading-surface">
        {children}
        <ChatContainerScrollAnchor />
      </ChatContainerContent>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <ScrollButton />
      </div>
    </ChatContainerRoot>
  );
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onStop,
  onSubmit,
}: ChatInputParams) {
  return (
    <div className="border-t p-4">
      <PromptInput
        className="mx-auto max-w-3xl"
        isLoading={isLoading}
        onSubmit={onSubmit}
        onValueChange={onInputChange}
        value={input}
      >
        <PromptInputTextarea placeholder="Send a message…" />
        <PromptInputActions className="justify-end">
          <PromptInputAction tooltip={isLoading ? "Stop" : "Send"}>
            <Button
              className="h-8 w-8 rounded-full"
              disabled={!input.trim() && !isLoading}
              onClick={isLoading ? onStop : onSubmit}
              size="sm"
            >
              {isLoading ? (
                <Square className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}

export function ChatMessage({
  character,
  isStreaming,
  message,
  onEdit,
  persona,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const startEdit = (currentText: string) => {
    setEditText(currentText);
    setIsEditing(true);
  };

  const saveEdit = () => {
    onEdit?.(editText);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <Message className={cn("reading-body", isUser ? "justify-end" : "")}>
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-lg shadow-lg ring-1 ring-black/10 bg-secondary",
          isUser ? "" : "flex-row-reverse",
        )}
      >
        <ChatAvatar
          alt={isUser ? persona.name : character.name}
          isUser={isUser}
          src={isUser ? persona.avatarSrc : character.avatarSrc}
        />
        <div className="flex flex-col gap-2 p-3 min-w-0 flex-1">
          <span className="text-xs font-semibold tracking-wide uppercase opacity-60">
            {isUser ? persona.name : character.name}
          </span>
          {message.parts.map((part, partIndex) => {
            if (part.type === "reasoning") {
              return (
                <Reasoning isStreaming={isStreaming} key={partIndex}>
                  <ReasoningTrigger className="text-sm text-muted-foreground">
                    Thinking
                  </ReasoningTrigger>
                  <ReasoningContent
                    className="border-l-2 border-muted-foreground/30 pl-3 mt-1"
                    markdown
                  >
                    {part.text}
                  </ReasoningContent>
                </Reasoning>
              );
            }
            if (part.type === "tool-getLorebookEntries") {
              const entries =
                (part.input as { entries?: string[] })?.entries ?? [];
              return (
                <div
                  className="flex items-start gap-1.5 text-xs text-muted-foreground/60"
                  key={partIndex}
                >
                  <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Looking up:{" "}
                    {entries.length > 0
                      ? entries.join(", ")
                      : "lorebook entries"}
                  </span>
                </div>
              );
            }
            if (part.type === "text") {
              if (isEditing) {
                return (
                  <div className="flex flex-col gap-2" key={partIndex}>
                    <Textarea
                      autoFocus
                      className="bg-transparent border-muted-foreground/30 text-sm resize-none"
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === "Escape") cancelEdit();
                      }}
                      rows={25}
                      value={editText}
                    />
                    <div className="flex gap-1">
                      <button
                        aria-label="Save edit"
                        className="p-1 hover:text-foreground transition-colors text-muted-foreground"
                        onClick={saveEdit}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Cancel edit"
                        className="p-1 hover:text-foreground transition-colors text-muted-foreground"
                        onClick={cancelEdit}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div className="group/text" key={partIndex}>
                  <MessageContent
                    className="rounded-none bg-transparent p-0"
                    markdown
                  >
                    {part.text}
                  </MessageContent>
                  <MessageActions className="mt-1 opacity-0 group-hover/text:opacity-100 transition-opacity">
                    <MessageAction tooltip="Edit">
                      <button
                        className="p-1 hover:text-foreground transition-colors"
                        onClick={() => startEdit(part.text)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </MessageAction>
                  </MessageActions>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </Message>
  );
}

export function ChatMessages({
  character,
  messages,
  onEdit,
  persona,
  status,
}: ChatMessagesProps) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, i) => (
        <ChatMessage
          character={character}
          isStreaming={status === "streaming" && i === messages.length - 1}
          key={message.id}
          message={message}
          onEdit={onEdit ? (newText) => onEdit(message.id, newText) : undefined}
          persona={persona}
        />
      ))}
    </div>
  );
}

export function ChatMessageThinking({ character }: ChatMessageThinkingProps) {
  return (
    <Message>
      <div className="flex flex-row-reverse w-full overflow-hidden rounded-lg bg-secondary shadow-lg ring-1 ring-black/10">
        <ChatAvatar alt="AI" isUser={false} src={character.avatarSrc} />
        <div className="flex flex-col gap-2 p-3">
          <span className="text-xs font-semibold tracking-wide uppercase opacity-60">
            {character.name}
          </span>
          <MessageContent className="rounded-none bg-transparent p-0 text-muted-foreground italic">
            Thinking…
          </MessageContent>
        </div>
      </div>
    </Message>
  );
}

export function ChatSwipe({
  swipe: { length, nextSwipe, prevSwipe, swipeIndex },
}: ChatSwipeParams) {
  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        aria-label="Previous response"
        className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        onClick={prevSwipe}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="text-xs text-muted-foreground/40 tabular-nums">
        {swipeIndex + 1}/{length}
      </span>
      <button
        aria-label="Next response"
        className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        onClick={nextSwipe}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ChatAvatar({
  alt,
  isUser,
  src,
}: {
  alt: string;
  isUser: boolean;
  src: string;
}) {
  return (
    <div className="relative w-45 min-h-40 max-h-80 shrink-0 self-stretch">
      <Image alt={alt} className="object-cover" fill src={src} />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t to-transparent, from-secondary" />
      <div
        className={cn(
          "absolute inset-y-0 w-16 to-transparent from-secondary",
          isUser ? "right-0 bg-linear-to-l " : "left-0 bg-linear-to-r ",
        )}
      />
    </div>
  );
}
