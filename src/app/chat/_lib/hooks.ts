"use client";

import { createChatFromStoryAction } from "@/app/chat/_lib/actions";
import { unwrapAction } from "@/lib/action-utils";
import { useChat } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { DefaultChatTransport, UIMessage } from "ai";
import { useState } from "react";

export function useCreateChatFromStory() {
  const {
    mutateAsync: createChatFromStory,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ storyId }: { storyId: string }) =>
      unwrapAction(await createChatFromStoryAction(storyId)),
  });

  return {
    createChatFromStory,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export function useChatMessages(chatId: string, initialMessages: UIMessage[]) {
  const [isSwipeGenerate, setIsSwipeGenerate] = useState(false);
  const [messageSwipes, setMessageSwipes] = useState<UIMessage[]>([
    initialMessages[initialMessages.length - 1],
  ]);
  const [swipeIndex, _setSwipeIndex] = useState(0);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `/api/chat/${chatId}`,
      prepareSendMessagesRequest({ messages, id }) {
        //only send the last message to the server
        return { body: { message: messages[messages.length - 1], id } };
      },
    }),
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
  });

  const setMessageSwipe = (index: number) => {
    if (index < 0 || index >= messageSwipes.length) return;
    setMessages([...messages.slice(0, -1), messageSwipes[index]]);
    _setSwipeIndex(index);
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

  return {
    messages,
    status,
    input,
    setInput,
    handleSubmit,
    swipe: {
      length: messageSwipes.length,
      swipeIndex,
      nextSwipe,
      prevSwipe,
    },
  };
}
