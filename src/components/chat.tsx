"use client";

import { Button } from "@/components/ui/button";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import { Message, MessageContent } from "@/components/ui/message";
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
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import {
  ArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Square,
} from "lucide-react";
import Image from "next/image";

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
      <Image src={src} alt={alt} fill className="object-cover object-top" />
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

interface ChatProps {
  messages: UIMessage[];
  status: "ready" | "submitted" | "streaming" | "error";
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onSwipePrev: () => void;
  onSwipeNext: () => void;
  character: { id: string; name: string; avatarSrc: string };
  persona: { id: string; name: string; avatarSrc: string };
  swipeCount: number;
  currentSwipe: number;
}

export function Chat({
  messages,
  status,
  input,
  onInputChange,
  onSubmit,
  character,
  persona,
  onSwipePrev,
  onSwipeNext,
  swipeCount,
  currentSwipe,
}: ChatProps) {
  const isLoading = status !== "ready";

  return (
    <div className="flex min-h-0 flex-1 flex-col backdrop-blur-md backdrop-saturate-150 rounded-xl border border-white/20 shadow-xl overflow-hidden">
      <div className="relative min-h-0 flex-1 ">
        <ChatContainerRoot className="h-full">
          <ChatContainerContent className="gap-4 p-4 reading-surface">
            {messages.map((message, i) => {
              const isLastMessage = i === messages.length - 1;
              const isStreaming = isLastMessage && status === "streaming";
              const isUser = message.role === "user";

              const showSwipe = isLastMessage && !isUser && !isStreaming;

              return (
                <Message
                  key={message.id}
                  className={cn("reading-body", isUser ? "justify-end" : "")}
                >
                  <div
                    className={cn(
                      "flex w-full overflow-hidden rounded-lg shadow-lg ring-1 ring-black/10 bg-secondary",
                      isUser ? "" : "flex-row-reverse",
                    )}
                  >
                    <ChatAvatar
                      src={isUser ? persona.avatarSrc : character.avatarSrc}
                      alt={isUser ? "You" : "AI"}
                      isUser={isUser}
                    />
                    <div className="flex flex-col gap-2 p-3">
                      <span className="text-xs font-semibold tracking-wide uppercase opacity-60">
                        {isUser ? persona.name : character.name}
                      </span>
                      {message.parts.map((part, partIndex) => {
                        if (part.type === "reasoning") {
                          return (
                            <Reasoning
                              key={partIndex}
                              isStreaming={isStreaming}
                            >
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
                            (part.input as { entries?: string[] })?.entries ??
                            [];
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
                          return (
                            <MessageContent
                              key={partIndex}
                              markdown
                              className="rounded-none bg-transparent p-0"
                            >
                              {part.text}
                            </MessageContent>
                          );
                        }
                        return null;
                      })}
                      {showSwipe && (
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            onClick={onSwipePrev}
                            className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                            aria-label="Previous response"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs text-muted-foreground/40 tabular-nums">
                            {currentSwipe}/{swipeCount}
                          </span>
                          <button
                            onClick={onSwipeNext}
                            className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                            aria-label="Next response"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Message>
              );
            })}

            {status === "submitted" && (
              <Message>
                <div className="flex w-full overflow-hidden rounded-lg bg-secondary shadow-lg ring-1 ring-black/10">
                  <ChatAvatar
                    src={character.avatarSrc}
                    alt="AI"
                    isUser={false}
                  />
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
            )}

            <ChatContainerScrollAnchor />
          </ChatContainerContent>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <ScrollButton />
          </div>
        </ChatContainerRoot>
      </div>

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
    </div>
  );
}
