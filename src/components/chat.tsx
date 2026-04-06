"use client";

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

function ChatAvatar({
  src,
  alt,
  isUser,
}: {
  src: string;
  alt: string;
  isUser: boolean;
}) {
  return (
    <div className="relative w-45 min-h-40 max-h-80 shrink-0 self-stretch">
      <Image src={src} alt={alt} fill className="object-cover" />
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

interface ChatHistoryProps {
  children: ReactNode;
}

export function ChatHistory({ children }: ChatHistoryProps) {
  return (
    <ChatContainerRoot>
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

export interface ChatHistoryContainerParams {
  children: ReactNode;
}

export function ChatContainer({ children }: ChatHistoryContainerParams) {
  return (
    <div className=" rounded-xl border border-white/20 shadow-xl overflow-hidden">
      {children}
    </div>
  );
}

interface ChatMessageProps {
  message: UIMessage;
  isStreaming: boolean;
  character: { id: string; name: string; avatarSrc: string };
  persona: { id: string; name: string; avatarSrc: string };
  onEdit?: (newText: string) => void;
}

export function ChatMessage({
  message,
  isStreaming,
  character,
  persona,
  onEdit,
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
          src={isUser ? persona.avatarSrc : character.avatarSrc}
          alt={isUser ? persona.name : character.name}
          isUser={isUser}
        />
        <div className="flex flex-col gap-2 p-3 min-w-0 flex-1">
          <span className="text-xs font-semibold tracking-wide uppercase opacity-60">
            {isUser ? persona.name : character.name}
          </span>
          {message.parts.map((part, partIndex) => {
            if (part.type === "reasoning") {
              return (
                <Reasoning key={partIndex} isStreaming={isStreaming}>
                  <ReasoningTrigger className="text-sm text-muted-foreground">
                    Thinking
                  </ReasoningTrigger>
                  <ReasoningContent
                    markdown
                    className="border-l-2 border-muted-foreground/30 pl-3 mt-1"
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
                  key={partIndex}
                  className="flex items-start gap-1.5 text-xs text-muted-foreground/60"
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
                  <div key={partIndex} className="flex flex-col gap-2">
                    <Textarea
                      rows={25}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="bg-transparent border-muted-foreground/30 text-sm resize-none"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={saveEdit}
                        className="p-1 hover:text-foreground transition-colors text-muted-foreground"
                        aria-label="Save edit"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 hover:text-foreground transition-colors text-muted-foreground"
                        aria-label="Cancel edit"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={partIndex} className="group/text">
                  <MessageContent
                    markdown
                    className="rounded-none bg-transparent p-0"
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

interface ChatMessagesProps {
  messages: UIMessage[];
  status: "ready" | "submitted" | "streaming" | "error";
  character: { id: string; name: string; avatarSrc: string };
  persona: { id: string; name: string; avatarSrc: string };
  onEdit?: (messageId: string, newText: string) => void;
}

export function ChatMessages({
  messages,
  status,
  character,
  persona,
  onEdit,
}: ChatMessagesProps) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, i) => (
        <ChatMessage
          key={message.id}
          message={message}
          isStreaming={status === "streaming" && i === messages.length - 1}
          character={character}
          persona={persona}
          onEdit={onEdit ? (newText) => onEdit(message.id, newText) : undefined}
        />
      ))}
    </div>
  );
}

interface ChatMessageThinkingProps {
  character: { name: string; avatarSrc: string };
}

export function ChatMessageThinking({ character }: ChatMessageThinkingProps) {
  return (
    <Message>
      <div className="flex flex-row-reverse w-full overflow-hidden rounded-lg bg-secondary shadow-lg ring-1 ring-black/10">
        <ChatAvatar src={character.avatarSrc} alt="AI" isUser={false} />
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

interface ChatSwipeParams {
  swipe: {
    length: number;
    swipeIndex: number;
    prevSwipe: () => void;
    nextSwipe: () => void;
  };
}

export function ChatSwipe({
  swipe: { length, nextSwipe, prevSwipe, swipeIndex },
}: ChatSwipeParams) {
  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        onClick={prevSwipe}
        className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        aria-label="Previous response"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="text-xs text-muted-foreground/40 tabular-nums">
        {swipeIndex + 1}/{length}
      </span>
      <button
        onClick={nextSwipe}
        className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        aria-label="Next response"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface ChatInputParams {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatInputParams) {
  return (
    <div className="border-t p-4">
      <PromptInput
        value={input}
        onValueChange={onInputChange}
        onSubmit={onSubmit}
        isLoading={isLoading}
        className="mx-auto max-w-3xl"
      >
        <PromptInputTextarea placeholder="Send a message…" />
        <PromptInputActions className="justify-end">
          <PromptInputAction tooltip={isLoading ? "Stop" : "Send"}>
            <Button
              size="sm"
              className="h-8 w-8 rounded-full"
              onClick={onSubmit}
              disabled={!input.trim() && !isLoading}
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
