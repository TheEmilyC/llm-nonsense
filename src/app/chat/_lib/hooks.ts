"use client";

import { useChat } from "@ai-sdk/react";
import { createId } from "@paralleldrive/cuid2";
import { DefaultChatTransport } from "ai";
import { useRef, useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";

import {
  createChatFromStoryAction,
  deleteChatAction,
  deleteMessageAction,
  generateSummariesAction,
  insertBlankAssistantMessageAction,
  replaceChatFactsAction,
  saveChatFactsAction,
  updateChatMessageAction,
  updateMessageContentAction,
} from "@/app/chat/_lib/actions";
import {
  ChatMessageDto,
  ChatModelKey,
  GenerateSummariesActionParams,
  GenerateSummariesActionResponse,
  LlmnUIMessage,
  SaveChatFactsActionParams,
} from "@/app/chat/_lib/schema";
import { ActionError, ActionResponse } from "@/lib/action-utils";

type HookUIMessage = LlmnUIMessage & { isHidden: boolean };

export function useChatMessages({
  id: chatId,
  messages: initialMessages,
}: {
  id: string;
  messages: ChatMessageDto[];
}) {
  const isSwipeGenerateRef = useRef(false);
  const pendingUserContentIdRef = useRef<string | undefined>(undefined);
  const [messageSwipes, setMessageSwipes] = useState<HookUIMessage[]>(
    initialMessages.length > 0
      ? getMessageSwipes(initialMessages[initialMessages.length - 1])
      : [],
  );
  const [swipeIndex, _setSwipeIndex] = useState(
    initialMessages.length > 0
      ? initialMessages[initialMessages.length - 1].contents.findIndex(
          (con) => con.isActive,
        )
      : 0,
  );
  const [, startTransition] = useTransition();

  const { messages, regenerate, sendMessage, setMessages, status, stop } =
    useChat<HookUIMessage>({
      generateId: createId,
      messages: initialMessages.map((msg) => messageDtoToUIMessage(msg)),
      onFinish: ({ message }) => {
        if (pendingUserContentIdRef.current) {
          const contentId = pendingUserContentIdRef.current;
          pendingUserContentIdRef.current = undefined;
          setMessages((prev) => {
            const lastUserIdx = prev.reduce(
              (acc, m, i) => (m.role === "user" ? i : acc),
              -1,
            );
            if (lastUserIdx === -1 || prev[lastUserIdx].metadata?.contentId)
              return prev;
            return prev.map((m, i) =>
              i === lastUserIdx ? { ...m, metadata: { contentId } } : m,
            );
          });
        }
        if (isSwipeGenerateRef.current) {
          setMessageSwipes((prev) => {
            _setSwipeIndex(prev.length);
            return [...prev, message];
          });
        } else {
          setMessageSwipes([message]);
          _setSwipeIndex(0);
        }
        isSwipeGenerateRef.current = false;
      },
      transport: new DefaultChatTransport({
        api: `/api/chat/${chatId}`,
        prepareSendMessagesRequest({ body, id, messages, trigger }) {
          //only send the last message to the server
          return {
            body: {
              content: messages[messages.length - 1],
              id,
              model: body?.model,
              trigger,
              userContentId: body?.userContentId,
            },
          };
        },
      }),
    });

  const debouncedUpdateMessageContent = useDebouncedCallback((id: string) => {
    startTransition(async () => {
      await updateMessageContentAction({ id, update: { isActive: true } });
    });
  }, 500);

  const setMessageSwipe = (index: number) => {
    if (index < 0 || index >= messageSwipes.length) return;
    setMessages([...messages.slice(0, -1), messageSwipes[index]]);
    _setSwipeIndex(index);
    debouncedUpdateMessageContent(messageSwipes[index].id);
  };

  const nextSwipe = (model: ChatModelKey) => {
    if (swipeIndex >= messageSwipes.length - 1) {
      handleSwipeGenerate(model);
    } else {
      setMessageSwipe(swipeIndex + 1);
    }
  };

  const prevSwipe = () => {
    if (swipeIndex <= 0) return;
    setMessageSwipe(swipeIndex - 1);
  };

  const handleSubmit = (text: string, model: ChatModelKey) => {
    if (text.trim()) {
      const userContentId = createId();
      pendingUserContentIdRef.current = userContentId;
      isSwipeGenerateRef.current = false;
      sendMessage({ text }, { body: { model, userContentId } });
    }
  };

  const handleSwipeGenerate = (model: ChatModelKey) => {
    isSwipeGenerateRef.current = true;
    regenerate({ body: { model } });
  };

  const deleteMessage = (messageId: string) => {
    setMessages(messages.filter((m) => m.id !== messageId));
    startTransition(async () => {
      await deleteMessageAction(messageId);
    });
  };

  const setMessageHidden = ({
    clientOnly = false,
    isHidden: isHidden,
    messageId,
  }: {
    clientOnly?: boolean;
    isHidden: boolean;
    messageId: string | string[];
  }) => {
    const updateIds = Array.isArray(messageId) ? messageId : [messageId];
    setMessages(
      messages.map((m) =>
        updateIds.some((mesId) => mesId === m.id)
          ? { ...m, isHidden: isHidden }
          : m,
      ),
    );
    if (!clientOnly) {
      startTransition(async () => {
        updateIds.forEach((mesId) => {
          updateChatMessageAction({
            id: mesId,
            update: { isHidden: isHidden },
          });
        });
      });
    }
  };

  const insertBlankAssistantMessage = async () => {
    const res = await insertBlankAssistantMessageAction(chatId);
    if (!res.success || !res.data) return;
    const { contentId, id } = res.data;
    const newMessage: HookUIMessage = {
      id,
      isHidden: false,
      metadata: { contentId },
      parts: [{ text: "", type: "text" }],
      role: "assistant",
    };
    setMessages([...messages, newMessage]);
  };

  const editMessage = (
    messageId: string,
    contentId: string,
    newText: string,
  ) => {
    const updateParts = (parts: LlmnUIMessage["parts"]) =>
      parts.map((p) => (p.type === "text" ? { ...p, text: newText } : p));

    setMessages(
      messages.map((m) =>
        m.id === messageId ? { ...m, parts: updateParts(m.parts) } : m,
      ),
    );
    setMessageSwipes((prev) =>
      prev.map((s) =>
        s.id === messageId ? { ...s, parts: updateParts(s.parts) } : s,
      ),
    );
    startTransition(async () => {
      await updateMessageContentAction({
        id: contentId,
        update: { parts: [{ text: newText, type: "text" }] },
      });
    });
  };

  return {
    handleSubmit,
    message: {
      deleteMessage,
      editMessage,
      insertBlankAssistantMessage,
      messages,
      setMessageHidden,
    },
    status,
    stop,
    swipe: {
      length: messageSwipes.length,
      nextSwipe,
      prevSwipe,
      swipeIndex,
    },
  };
}

export function useCreateChatFromStory(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function createChatFromStory(storyId: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createChatFromStoryAction(storyId);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    createChatFromStory,
    isPending,
  };
}

export function useDeleteChat(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function deleteChat(chatId: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await deleteChatAction(chatId);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return { deleteChat, isPending };
}

export function useGenerateChatSummaries(
  onError?: (error: ActionError) => void,
) {
  const [isPending, startTransition] = useTransition();

  function generateSummaries(
    params: GenerateSummariesActionParams,
  ): Promise<ActionResponse<GenerateSummariesActionResponse>> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await generateSummariesAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return { generateSummaries, isPending };
}

export function useReplaceChatFacts(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function replaceFacts(
    params: SaveChatFactsActionParams,
  ): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await replaceChatFactsAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return { isPending, replaceFacts };
}

export function useSaveChatFacts(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function saveFacts(
    params: SaveChatFactsActionParams,
  ): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await saveChatFactsAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return { isPending, saveFacts };
}

function getMessageSwipes(message: ChatMessageDto): HookUIMessage[] {
  return message.contents.map((con) => ({
    id: con.id,
    isHidden: message.isHidden,
    parts: con.parts,
    role: con.role,
  }));
}

function messageDtoToUIMessage(chatMessage: ChatMessageDto): HookUIMessage {
  const activeContent =
    chatMessage.contents.find((msg) => msg.isActive) ?? chatMessage.contents[0];
  if (!activeContent)
    throw new Error(`No content for message ${chatMessage.id}`);

  return {
    id: chatMessage.id,
    isHidden: chatMessage.isHidden,
    metadata: activeContent.metadata,
    parts: activeContent.parts,
    role: activeContent.role,
  };
}
