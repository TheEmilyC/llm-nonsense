"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useRef, useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";

import {
  createChatFromStoryAction,
  deleteChatAction,
  deleteMessageAction,
  updateMessageContentAction,
} from "@/app/chat/_lib/actions";
import {
  ChatMessageWithContentDto,
  UpdateContentActionParams,
} from "@/app/chat/_lib/schema";
import { ActionError, ActionResponse } from "@/lib/action-utils";

export function useChatMessages(
  chatId: string,
  initialMessages: ChatMessageWithContentDto[],
) {
  const [isSwipeGenerate, setIsSwipeGenerate] = useState(false);
  const [messageSwipes, setMessageSwipes] = useState<UIMessage[]>(
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
  const [input, setInput] = useState("");
  const { updateMessageContent } = useUpdateMessageContent();
  const { deleteMessage: deleteMessageMutation } = useDeleteMessage();

  // Map from UIMessage id (message id) to active content id for DB persistence
  const contentIdMapRef = useRef(
    new Map<string, string>(
      initialMessages.flatMap((msg) => {
        const activeContent =
          msg.contents.find((c) => c.isActive) ?? msg.contents[0];
        return activeContent ? [[msg.id, activeContent.id]] : [];
      }),
    ),
  );

  const { messages, regenerate, sendMessage, setMessages, status, stop } =
    useChat({
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

  const deleteMessage = (messageId: string) => {
    setMessages(messages.filter((m) => m.id !== messageId));
    deleteMessageMutation(messageId);
  };

  const editMessage = (messageId: string, newText: string) => {
    const updateParts = (parts: UIMessage["parts"]) =>
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
    const contentId = contentIdMapRef.current.get(messageId);
    if (contentId) {
      updateMessageContent({
        id: contentId,
        update: { parts: [{ text: newText, type: "text" }] },
      });
    }
  };

  return {
    deleteMessage,
    editMessage,
    handleSubmit,
    input,
    messages,
    setInput,
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

export function useDeleteMessage(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function deleteMessage(messageId: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await deleteMessageAction(messageId);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return { deleteMessage, isPending };
}

export function useUpdateMessageContent(
  onError?: (error: ActionError) => void,
) {
  const [isPending, startTransition] = useTransition();

  function updateMessageContent(params: UpdateContentActionParams) {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateMessageContentAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    isPending,
    updateMessageContent,
  };
}

function getMessageSwipes(message: ChatMessageWithContentDto): UIMessage[] {
  return message.contents.map((con) => ({
    id: con.id,
    metadata: con.metadata,
    parts: con.parts,
    role: con.role,
  }));
}

function messageDtoToUIMessage(
  chatMessage: ChatMessageWithContentDto,
): UIMessage {
  const activeContent =
    chatMessage.contents.find((msg) => msg.isActive) ?? chatMessage.contents[0];
  if (!activeContent)
    throw new Error(`No content for message ${chatMessage.id}`);

  return {
    id: chatMessage.id,
    metadata: activeContent.metadata,
    parts: activeContent.parts,
    role: activeContent.role,
  };
}
