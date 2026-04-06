"use client";

import { useChat } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { DefaultChatTransport, UIMessage } from "ai";
import { useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import {
  createChatFromStoryAction,
  deleteChatAction,
  updateMessageContentAction,
} from "@/app/chat/_lib/actions";
import {
  ChatMessageDto,
  messageDtoToUIMessage,
  UpdateContentActionParams,
} from "@/app/chat/_lib/schema";
import { unwrapAction } from "@/lib/action-utils";

export function useChatMessages(
  chatId: string,
  initialMessages: ChatMessageDto[],
) {
  const [isSwipeGenerate, setIsSwipeGenerate] = useState(false);
  const [messageSwipes, setMessageSwipes] = useState<UIMessage[]>(
    getMessageSwipes(initialMessages[initialMessages.length - 1]),
  );
  const [swipeIndex, _setSwipeIndex] = useState(
    initialMessages[initialMessages.length - 1].contents.findIndex(
      (con) => con.isActive,
    ),
  );
  const [input, setInput] = useState("");
  const { updateMessageContent } = useUpdateMessageContent();

  // Map from UIMessage id (group id) to active content id for DB persistence
  const contentIdMapRef = useRef(
    new Map<string, string>(
      initialMessages.flatMap((msg) => {
        const activeContent =
          msg.contents.find((c) => c.isActive) ?? msg.contents[0];
        return activeContent ? [[msg.id, activeContent.id]] : [];
      }),
    ),
  );

  const { messages, regenerate, sendMessage, setMessages, status } = useChat({
    messages: initialMessages.map((msg) => messageDtoToUIMessage(msg)),
    onFinish: ({ message }) => {
      if (isSwipeGenerate) {
        setMessageSwipes((prev) => [...prev, message]);
        _setSwipeIndex(messageSwipes.length);
      } else {
        setMessageSwipes([message]);
        _setSwipeIndex(0);
      }
      setIsSwipeGenerate(false);
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

  const debouncedUpdateMessageContent = useDebouncedCallback(
    (id: string) => updateMessageContent({ id, update: { isActive: true } }),
    500,
  );

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
    if (swipeIndex <= 0) {
      return;
    }
    setMessageSwipe(swipeIndex - 1);
  };

  const handleSubmit = () => {
    if (input.trim()) {
      setIsSwipeGenerate(false);
      sendMessage({ text: input });
      setInput("");
    }
  };

  const handleSwipeGenerate = () => {
    setIsSwipeGenerate(true);
    regenerate();
  };

  const editMessage = (messageId: string, newText: string) => {
    setMessages(
      messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              parts: m.parts.map((p) =>
                p.type === "text" ? { ...p, text: newText } : p,
              ),
            }
          : m,
      ),
    );
    const contentId = contentIdMapRef.current.get(messageId);
    if (contentId) {
      updateMessageContent({
        id: contentId,
        update: { parts: [{ text: newText, type: "text" }] },
      });
    }
  };

  return {
    editMessage,
    handleSubmit,
    input,
    messages,
    setInput,
    status,
    swipe: {
      length: messageSwipes.length,
      nextSwipe,
      prevSwipe,
      swipeIndex,
    },
  };
}

export function useCreateChatFromStory() {
  const {
    error,
    isPending,
    mutateAsync: createChatFromStory,
  } = useMutation({
    mutationFn: async ({ storyId }: { storyId: string }) =>
      unwrapAction(await createChatFromStoryAction(storyId)),
  });

  return {
    createChatFromStory,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useDeleteChat() {
  const { isPending, mutateAsync: deleteChat } = useMutation({
    mutationFn: async ({ chatId }: { chatId: string }) =>
      unwrapAction(await deleteChatAction(chatId)),
  });

  return { deleteChat, isPending };
}

export function useUpdateMessageContent() {
  const {
    error,
    isPending,
    mutateAsync: updateMessageContent,
  } = useMutation({
    mutationFn: async (params: UpdateContentActionParams) =>
      unwrapAction(await updateMessageContentAction(params)),
  });

  return {
    error: error ? (error as Error).message : null,
    isPending,
    updateMessageContent,
  };
}

function getMessageSwipes(message: ChatMessageDto): UIMessage[] {
  return message.contents.map((con) => ({
    id: con.id,
    metadata: con.metadata,
    parts: con.parts,
    role: con.role,
  }));
}
