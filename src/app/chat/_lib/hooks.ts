"use client";

import {
  createChatFromStoryAction,
  updateMessageContentAction,
} from "@/app/chat/_lib/actions";
import {
  ChatMessageDto,
  messageDtoToUIMessage,
  UpdateContentActionParams,
} from "@/app/chat/_lib/schema";
import { unwrapAction } from "@/lib/action-utils";
import { useChat } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { DefaultChatTransport, UIMessage } from "ai";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

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

function getMessageSwipes(message: ChatMessageDto): UIMessage[] {
  return message.contents.map((con) => ({
    id: con.id,
    role: con.role,
    parts: con.parts,
    metadata: con.metadata,
  }));
}

export function useUpdateMessageContent() {
  const {
    mutateAsync: updateMessageContent,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (params: UpdateContentActionParams) =>
      unwrapAction(await updateMessageContentAction(params)),
  });

  return {
    updateMessageContent,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

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

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    messages: initialMessages.map((msg) => messageDtoToUIMessage(msg)),
    transport: new DefaultChatTransport({
      api: `/api/chat/${chatId}`,
      prepareSendMessagesRequest({ messages, id, trigger }) {
        //only send the last message to the server
        return {
          body: { content: messages[messages.length - 1], id, trigger },
        };
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
