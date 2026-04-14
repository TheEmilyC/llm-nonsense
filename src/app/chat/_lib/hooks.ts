"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";

import {
  createChatFromStoryAction,
  deleteChatAction,
  deleteMessageAction,
  generateMemoriesAction,
  updateChatMessageAction,
  updateMessageContentAction,
} from "@/app/chat/_lib/actions";
import {
  ChatMessageDto,
  ChatSessionDto,
  GenerateMemoriesActionParams,
  GenerateMemoriesActionResponse,
  LlmnUIMessage,
} from "@/app/chat/_lib/schema";
import { ActionError, ActionResponse } from "@/lib/action-utils";

type HookUIMessage = LlmnUIMessage & { isHidden: boolean };

export function useChatMessages({
  id: chatId,
  messages: initialMessages,
}: ChatSessionDto) {
  const isSwipeGenerateRef = useRef(false);
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
      messages: initialMessages.map((msg) => messageDtoToUIMessage(msg)),
      onFinish: ({ message }) => {
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
        prepareSendMessagesRequest({ id, messages, trigger }) {
          //only send the last message to the server
          return {
            body: { content: messages[messages.length - 1], id, trigger },
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

  const nextSwipe = () => {
    if (swipeIndex >= messageSwipes.length - 1) {
      handleSwipeGenerate();
    } else {
      setMessageSwipe(swipeIndex + 1);
    }
  };

  const prevSwipe = () => {
    if (swipeIndex <= 0) return;
    setMessageSwipe(swipeIndex - 1);
  };

  const handleSubmit = (text: string) => {
    if (text.trim()) {
      isSwipeGenerateRef.current = false;
      sendMessage({ text });
    }
  };

  const handleSwipeGenerate = () => {
    isSwipeGenerateRef.current = true;
    regenerate();
  };

  const deleteMessage = (messageId: string) => {
    setMessages(messages.filter((m) => m.id !== messageId));
    startTransition(async () => {
      await deleteMessageAction(messageId);
    });
  };

  const messageToggleHidden = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    const newIsHidden = !(message?.isHidden ?? false);
    setMessages(
      messages.map((m) =>
        m.id === messageId ? { ...m, isHidden: newIsHidden } : m,
      ),
    );
    startTransition(async () => {
      await updateChatMessageAction({
        id: messageId,
        update: { isHidden: newIsHidden },
      });
    });
  };

  const editContent = (
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
    deleteMessage,
    editContent,
    handleSubmit,
    messages,
    messageToggleHidden,
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

export function useGenerateMemories(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function generateMemories(
    params: GenerateMemoriesActionParams,
  ): Promise<ActionResponse<GenerateMemoriesActionResponse>> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await generateMemoriesAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return { generateMemories, isPending };
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
