"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FactsDrawer } from "@/app/chat/_components/facts-drawer";
import { MemoryResultsDrawer } from "@/app/chat/_components/memory-results-drawer";
import {
  useChatMessages,
  useGenerateChatSummaries,
  useReplaceChatFacts,
} from "@/app/chat/_lib/hooks";
import {
  ChatModelKey,
  GenerateSummariesActionResponse,
  StoryChatSessionDto,
} from "@/app/chat/_lib/schema";
import { ArcResultsDrawer } from "@/app/lorebook/_components/arc-results-drawer";
import { CurrentLorebook } from "@/app/lorebook/_components/current-lorebook";
import { LorebookUpdatesDrawer } from "@/app/lorebook/_components/lorebook-updates-drawer";
import {
  useGenerateLorebookUpdates,
  useGenerateMemoryArc,
} from "@/app/lorebook/_lib/hooks";
import {
  GenerateLorebookUpdatesResult,
  LorebookStatusDto,
} from "@/app/lorebook/_lib/schema";
import { GenerateMemoryArcResult } from "@/app/lorebook/_lib/service";
import {
  ChatContainer,
  ChatHistory,
  ChatInput,
  ChatMessage,
  ChatMessageThinking,
  ChatSwipe,
} from "@/components/chat";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { PromptInputAction } from "@/components/ui/prompt-input";
import {
  FactsIcon,
  InsertAssistantMessageIcon,
  LorebookIcon,
  MemoryIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface ChatViewParams {
  chatSession: StoryChatSessionDto;
  lorebook: LorebookStatusDto;
}

export function ChatView({ chatSession, lorebook }: ChatViewParams) {
  const {
    handleSubmit,
    message: { messages, ...messageControl },
    status,
    stop,
    swipe: { nextSwipe, ...restSwipe },
  } = useChatMessages(chatSession);
  const [chatModel, setChatModel] = useState<ChatModelKey>("opus");

  // Memory
  const { generateSummaries, isPending: isSummaryPending } =
    useGenerateChatSummaries();
  const [memoryResults, setMemoryResults] = useState<
    GenerateSummariesActionResponse | undefined
  >(undefined);
  const [memoryStartIndex, _setMemoryStartIndex] = useState<
    number | undefined
  >();
  const [memoryEndIndex, _setMemoryEndIndex] = useState<number | undefined>();
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false);

  // Facts
  const [facts, setFacts] = useState(chatSession.facts);
  const [factsDrawerOpen, setFactsDrawerOpen] = useState(false);

  // Lorebook updates
  const { generateLorebookUpdates, isPending: isUpdatesPending } =
    useGenerateLorebookUpdates();
  const { isPending: isAcceptingUpdates, replaceFacts } = useReplaceChatFacts();
  const [lorebookUpdates, setLorebookUpdates] = useState<
    GenerateLorebookUpdatesResult | undefined
  >(undefined);
  const [updatesDrawerOpen, setUpdatesDrawerOpen] = useState(false);

  // Arc
  const { generateMemoryArc, isPending: isArcPending } = useGenerateMemoryArc();
  const [arcResults, setArcResults] = useState<
    GenerateMemoryArcResult | undefined
  >(undefined);
  const [arcGenFiles, setArcGenFiles] = useState<string[]>([]);
  const [arcDrawerOpen, setArcDrawerOpen] = useState(false);

  function setMemoryStartIndex(i: number | undefined) {
    _setMemoryStartIndex(i);
    if (
      i !== undefined &&
      memoryEndIndex !== undefined &&
      i >= memoryEndIndex
    ) {
      _setMemoryEndIndex(undefined);
    }
  }

  function setMemoryEndIndex(i: number | undefined) {
    _setMemoryEndIndex(i);
    if (
      i !== undefined &&
      memoryStartIndex !== undefined &&
      i <= memoryStartIndex
    ) {
      _setMemoryStartIndex(undefined);
    }
  }

  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : undefined;

  async function onGenerateArc(filenames: string[]) {
    if (
      filenames.length === arcGenFiles.length &&
      filenames.every((file, i) => file === arcGenFiles[i])
    ) {
      // If the arc has already been generated reopen the drawer
      setArcDrawerOpen(true);
      return;
    }
    if (!chatSession.story.lorebookId) return;
    const res = await generateMemoryArc({
      files: filenames,
      id: chatSession.story.lorebookId,
    });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    setArcGenFiles(filenames);
    setArcResults(res.data);
    setArcDrawerOpen(true);
  }

  async function onGenerateMemory() {
    if (memoryResults && memoryStartIndex === undefined) {
      // if memories have already been generated reopen the drawer
      setMemoryDrawerOpen(true);
      return;
    }
    const memoryMessages =
      !memoryEndIndex && memoryStartIndex
        ? [messages[memoryStartIndex].id]
        : messages
            .slice(
              memoryStartIndex,
              memoryEndIndex ? memoryEndIndex + 1 : undefined,
            )
            .map((msg) => msg.id);
    const res = await generateSummaries({
      chatId: chatSession.id,
      messageIds: memoryMessages,
    });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    messageControl.setMessageHidden({
      clientOnly: true,
      isHidden: true,
      messageId: memoryMessages,
    });
    setMemoryStartIndex(undefined);
    setMemoryEndIndex(undefined);
    setMemoryResults(res.data);
    setMemoryDrawerOpen(true);
  }

  async function onGenerateLorebookUpdates() {
    const res = await generateLorebookUpdates({ chatId: chatSession.id });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    setLorebookUpdates(res.data);
    setUpdatesDrawerOpen(true);
  }

  async function onAcceptLorebookUpdates() {
    const res = await replaceFacts({ chatId: chatSession.id, facts: [] });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    setFacts([]);
    setUpdatesDrawerOpen(false);
  }

  function onContentEdit(
    newText: string,
    messageId: string,
    contentId?: string,
  ) {
    if (!contentId) {
      toast.error("Message is missing content ID. Unable to update");
      return;
    }
    messageControl.editMessage(messageId, contentId, newText);
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        backLinkDestination={`/story/${chatSession.story.id}`}
        backLinkLabel={chatSession.story.name}
        pageTitle={chatSession.name}
      >
        {chatSession.story.lorebookId ? (
          <CurrentLorebook
            initialLorebook={lorebook}
            isArcPending={isArcPending}
            lorebookId={chatSession.story.lorebookId}
            onGenerateArc={onGenerateArc}
          />
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LorebookIcon className="h-4 w-4 shrink-0" />
            <span className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/40" />
            <span>No lorebook</span>
          </div>
        )}
      </Header>
      <div className="w-full mx-auto max-w-6xl p-6 flex-1 flex flex-col min-h-0">
        <ChatContainer>
          <ChatHistory>
            <div className="flex flex-col gap-4">
              {messages.map((message, i) => (
                <ChatMessage
                  character={chatSession.character}
                  isHidden={message.isHidden}
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
                  onDelete={() => messageControl.deleteMessage(message.id)}
                  onEdit={(newText) =>
                    onContentEdit(
                      newText,
                      message.id,
                      message.metadata?.contentId,
                    )
                  }
                  onHide={() =>
                    messageControl.setMessageHidden({
                      isHidden: !message.isHidden,
                      messageId: message.id,
                    })
                  }
                  persona={chatSession.persona}
                />
              ))}
            </div>
            {status === "submitted" && (
              <ChatMessageThinking character={chatSession.character} />
            )}
            {lastMessage &&
              lastMessage.role === "assistant" &&
              status !== "streaming" && (
                <ChatSwipe
                  swipe={{
                    ...restSwipe,
                    nextSwipe: () => nextSwipe(chatModel),
                  }}
                />
              )}
          </ChatHistory>
          <ChatInput
            isLoading={status !== "ready"}
            leftActions={
              <>
                <PromptInputAction tooltip="Generate Memory">
                  <Button
                    className="h-8 w-8 rounded-full"
                    disabled={
                      (memoryStartIndex === undefined &&
                        memoryResults === undefined) ||
                      isSummaryPending
                    }
                    onClick={onGenerateMemory}
                    size="sm"
                    suppressHydrationWarning
                  >
                    <MemoryIcon
                      className={cn(
                        "h-4 w-4",
                        isSummaryPending && "animate-spin",
                      )}
                    />
                  </Button>
                </PromptInputAction>
                <PromptInputAction tooltip={`Facts (${facts.length})`}>
                  <Button
                    className="h-8 w-8 rounded-full"
                    onClick={() => setFactsDrawerOpen(true)}
                    size="sm"
                  >
                    <FactsIcon className="h-4 w-4" />
                  </Button>
                </PromptInputAction>
                <PromptInputAction tooltip="Insert blank assistant message">
                  <Button
                    className="h-8 w-8 rounded-full"
                    disabled={status !== "ready"}
                    onClick={messageControl.insertBlankAssistantMessage}
                    size="sm"
                  >
                    <InsertAssistantMessageIcon className="h-4 w-4" />
                  </Button>
                </PromptInputAction>
              </>
            }
            onModelChange={setChatModel}
            onStop={stop}
            onSubmit={handleSubmit}
            selectedModel={chatModel}
          />
        </ChatContainer>
        <FactsDrawer
          chatId={chatSession.id}
          facts={facts}
          hasLorebook={!!chatSession.story.lorebookId}
          isGeneratingUpdates={isUpdatesPending}
          onFactsChange={setFacts}
          onGenerateUpdates={onGenerateLorebookUpdates}
          onOpenChange={setFactsDrawerOpen}
          open={factsDrawerOpen}
        />
        <MemoryResultsDrawer
          chatId={chatSession.id}
          data={memoryResults}
          lorebookId={chatSession.story.lorebookId}
          onOpenChange={setMemoryDrawerOpen}
          open={memoryDrawerOpen}
        />
        <ArcResultsDrawer
          data={arcResults}
          onOpenChange={setArcDrawerOpen}
          open={arcDrawerOpen}
        />
        <LorebookUpdatesDrawer
          data={lorebookUpdates}
          isAccepting={isAcceptingUpdates}
          onAccept={onAcceptLorebookUpdates}
          onOpenChange={setUpdatesDrawerOpen}
          open={updatesDrawerOpen}
        />
      </div>
    </div>
  );
}
