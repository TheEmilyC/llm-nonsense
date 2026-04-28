"use client";

import { useState } from "react";
import { toast } from "sonner";

import { MemoryResultsDrawer } from "@/app/chat/_components/memory-results-drawer";
import {
  useChatMessages,
  useGenerateChatSummaries,
} from "@/app/chat/_lib/hooks";
import {
  ChatModelKey,
  ChatSessionDto,
  GenerateSummariesActionResponse,
} from "@/app/chat/_lib/schema";
import { ArcResultsDrawer } from "@/app/lorebook/_components/arc-results-drawer";
import { CurrentLorebook } from "@/app/lorebook/_components/current-lorebook";
import { useGenerateMemoryArc } from "@/app/lorebook/_lib/hooks";
import { LorebookStatusDto } from "@/app/lorebook/_lib/schema";
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
import { LorebookIcon } from "@/lib/icons";

export interface ChatViewParams {
  chatSession: ChatSessionDto;
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
            isMemoryGenerating={isSummaryPending}
            memoryDisable={
              (memoryStartIndex === undefined && memoryResults === undefined) ||
              isSummaryPending
            }
            onInsertAssistantMessage={
              messageControl.insertBlankAssistantMessage
            }
            onMemoryGenerate={onGenerateMemory}
            onModelChange={setChatModel}
            onStop={stop}
            onSubmit={handleSubmit}
            selectedModel={chatModel}
          />
        </ChatContainer>
        <MemoryResultsDrawer
          data={memoryResults}
          onOpenChange={setMemoryDrawerOpen}
          open={memoryDrawerOpen}
        />
        <ArcResultsDrawer
          data={arcResults}
          onOpenChange={setArcDrawerOpen}
          open={arcDrawerOpen}
        />
      </div>
    </div>
  );
}
