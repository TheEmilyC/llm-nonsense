"use client";

import { UIMessage } from "ai";
import Image from "next/image";
import { ReactNode, useState } from "react";

import { EntityProfile } from "@/app/_shared/schema";
import { ChatModelKey } from "@/app/chat/_lib/schema";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CloseIcon,
  ConfirmIcon,
  DeleteIcon,
  EditIcon,
  HideIcon,
  LorebookIcon,
  MoveLeftIcon,
  MoveRightIcon,
  RandomIcon,
  RangeEndIcon,
  RangeStartIcon,
  SendIcon,
  StopIcon,
  UnHideIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface ChatHistoryContainerParams {
  children: ReactNode;
}

interface ChatHistoryProps {
  children: ReactNode;
}

const MODEL_LABELS: Record<ChatModelKey, string> = {
  deepseek: "DeepSeek",
  fable: "Fable",
  gemini: "Gemini",
  glm: "GLM",
  glm5_2: "GLM 5.2",
  kimi: "Kimi K2.6",
  minimax: "MiniMax M3",
  opus4_6: "Opus 4.6",
  opus4_7: "Opus 4.7",
};

interface ChatInputParams {
  isLoading: boolean;
  leftActions?: ReactNode;
  onModelChange: (model: ChatModelKey) => void;
  onStop: () => void;
  onSubmit: (text: string, model: ChatModelKey) => void;
  selectedModel: ChatModelKey;
}

interface ChatMessageProps {
  character?: EntityProfile;
  isHidden: boolean;
  isStreaming: boolean;
  memory?: {
    isMemoryEnd: boolean;
    isMemoryStart: boolean;
    onMemoryEnd: () => void;
    onMemoryStart: () => void;
  };
  message: UIMessage;
  onDelete?: () => void;
  onEdit?: (newText: string) => void;
  onHide?: () => void;
  persona?: EntityProfile;
}

interface ChatMessageThinkingProps {
  character?: EntityProfile;
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
  isLoading,
  leftActions,
  onModelChange,
  onStop,
  onSubmit,
  selectedModel,
}: ChatInputParams) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    onSubmit(input, selectedModel);
    setInput("");
  };

  return (
    <div className="border-t p-4">
      <PromptInput
        className="mx-auto max-w-3xl"
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onValueChange={setInput}
        value={input}
      >
        <PromptInputTextarea placeholder="Send a message…" />
        <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">{leftActions}</div>
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(v) => onModelChange(v as ChatModelKey)}
              value={selectedModel}
            >
              <SelectTrigger className="h-8 w-28 rounded-full border-input/50 bg-transparent px-3 text-xs">
                <SelectValue>{MODEL_LABELS[selectedModel]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MODEL_LABELS) as ChatModelKey[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {MODEL_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PromptInputAction tooltip={isLoading ? "Stop" : "Send"}>
              <Button
                className="h-8 w-8 rounded-full"
                disabled={!input.trim() && !isLoading}
                onClick={isLoading ? onStop : handleSubmit}
                size="sm"
                /* disabled state causing hydration errors because of useChats
                initialization on server vs client */
                suppressHydrationWarning
              >
                {isLoading ? (
                  <StopIcon className="h-4 w-4" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
              </Button>
            </PromptInputAction>
          </div>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}

export function ChatMessage({
  character,
  isHidden,
  isStreaming,
  memory,
  message,
  onDelete,
  onEdit,
  onHide,
  persona,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [editingPartIndex, setEditingPartIndex] = useState<null | number>(null);
  const [editText, setEditText] = useState("");

  const startEdit = (currentText: string, partIndex: number) => {
    setEditText(currentText);
    setEditingPartIndex(partIndex);
  };

  const saveEdit = () => {
    onEdit?.(editText);
    setEditingPartIndex(null);
  };

  const cancelEdit = () => {
    setEditingPartIndex(null);
  };

  return (
    <Message className={cn("reading-body", isUser ? "justify-end" : "")}>
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-lg shadow-lg ring-1 bg-secondary",
          isUser ? "" : "flex-row-reverse",
          isHidden ? "opacity-50 ring-muted-foreground/40" : "ring-black/10",
        )}
      >
        <ChatAvatar
          alt={isUser ? (persona?.name ?? "User") : (character?.name ?? "AI")}
          isUser={isUser}
          src={isUser ? persona?.imageSrc : character?.imageSrc}
        />
        <div className="flex flex-col gap-2 p-3 min-w-0 flex-1">
          <span className="text-xs font-semibold tracking-wide uppercase opacity-60">
            {isUser ? (persona?.name ?? "User") : (character?.name ?? "AI")}
          </span>
          <div className="group/msg flex flex-col gap-2">
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
              if (part.type === "tool-rollDice") {
                const rolls =
                  (part.input as { rolls?: { name: string }[] })?.rolls ?? [];
                return (
                  <div
                    className="flex items-start gap-1.5 text-xs text-muted-foreground/60"
                    key={partIndex}
                  >
                    <RandomIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      Rolling:{" "}
                      {rolls.length > 0
                        ? rolls.map((r) => r.name).join(", ")
                        : "dice"}
                    </span>
                  </div>
                );
              }
              if (part.type === "tool-getLorebookEntries") {
                const entries =
                  (part.input as { entries?: string[] })?.entries ?? [];
                return (
                  <details
                    className="text-xs text-muted-foreground/60 group"
                    key={partIndex}
                  >
                    <summary className="flex items-center gap-1.5 cursor-pointer list-none">
                      <LorebookIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Retrieved{" "}
                        {entries.length > 0
                          ? `${entries.length} lorebook ${entries.length === 1 ? "entry" : "entries"}`
                          : "lorebook entries"}
                      </span>
                    </summary>
                    <ul className="mt-1 ml-5 space-y-0.5">
                      {entries.map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  </details>
                );
              }
              if (part.type === "text") {
                if (editingPartIndex === partIndex) {
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
                          <ConfirmIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          aria-label="Cancel edit"
                          className="p-1 hover:text-foreground transition-colors text-muted-foreground"
                          onClick={cancelEdit}
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <MessageContent
                    className="rounded-none bg-transparent p-0"
                    key={partIndex}
                    markdown
                  >
                    {part.text}
                  </MessageContent>
                );
              }
              return null;
            })}
            {!isStreaming && (
              <MessageActions className="mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                {(() => {
                  const textPart = message.parts.findLast(
                    (p) => p.type === "text",
                  ) as undefined | { text: string; type: "text" };
                  const textPartIndex = textPart
                    ? message.parts.lastIndexOf(textPart)
                    : -1;
                  return (
                    <>
                      {textPart && (
                        <MessageAction tooltip="Edit">
                          <button
                            aria-label="Edit Message"
                            className="p-1 hover:text-foreground transition-colors rounded-full"
                            onClick={() =>
                              startEdit(textPart.text, textPartIndex)
                            }
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                          </button>
                        </MessageAction>
                      )}
                      <MessageAction
                        tooltip={
                          isHidden
                            ? "Unhide (message will be sent to LLM)"
                            : "Hide (message won't be sent to LLM)"
                        }
                      >
                        <button
                          aria-label={
                            isHidden ? "Unhide message" : "Hide message"
                          }
                          className="p-1 hover:text-foreground transition-colors text-muted-foreground rounded-full"
                          onClick={onHide}
                        >
                          {isHidden ? (
                            <UnHideIcon className="h-3.5 w-3.5" />
                          ) : (
                            <HideIcon className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </MessageAction>
                      <Tooltip>
                        <ConfirmDialog
                          description="This will permanently delete this message and all its swipes."
                          onConfirm={onDelete}
                          title="Delete message?"
                          type="delete"
                        >
                          <TooltipTrigger asChild>
                            <button className="p-1 hover:text-destructive transition-colors rounded-full">
                              <DeleteIcon className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                        </ConfirmDialog>
                        <TooltipContent side="top">Delete</TooltipContent>
                      </Tooltip>
                      <MessageAction tooltip="Memory Start">
                        <button
                          aria-label="Memory Start"
                          className={cn(
                            "p-1 hover:text-foreground transition-colors rounded-full",
                            memory?.isMemoryStart
                              ? "text-primary bg-primary/20"
                              : "text-muted-foreground",
                          )}
                          onClick={memory?.onMemoryStart}
                        >
                          <RangeStartIcon className="h-3.5 w-3.5" />
                        </button>
                      </MessageAction>
                      <MessageAction tooltip="Memory End">
                        <button
                          aria-label="Memory End"
                          className={cn(
                            "p-1 hover:text-foreground transition-colors rounded-full",
                            memory?.isMemoryEnd
                              ? "text-primary bg-primary/20"
                              : "text-muted-foreground",
                          )}
                          onClick={memory?.onMemoryEnd}
                        >
                          <RangeEndIcon className="h-3.5 w-3.5" />
                        </button>
                      </MessageAction>
                    </>
                  );
                })()}
              </MessageActions>
            )}
          </div>
        </div>
      </div>
    </Message>
  );
}

export function ChatMessageThinking({ character }: ChatMessageThinkingProps) {
  return (
    <Message>
      <div className="flex flex-row-reverse w-full overflow-hidden rounded-lg bg-secondary shadow-lg ring-1 ring-black/10">
        <ChatAvatar alt="AI" isUser={false} src={character?.imageSrc} />
        <div className="flex flex-col gap-2 p-3">
          <span className="text-xs font-semibold tracking-wide uppercase opacity-60">
            {character?.name ?? "AI"}
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
        <MoveLeftIcon className="h-3.5 w-3.5" />
      </button>
      <span className="text-xs text-muted-foreground/40 tabular-nums">
        {swipeIndex + 1}/{length}
      </span>
      <button
        aria-label="Next response"
        className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        onClick={nextSwipe}
      >
        <MoveRightIcon className="h-3.5 w-3.5" />
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
  src: string | undefined;
}) {
  if (!src) return null;
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
