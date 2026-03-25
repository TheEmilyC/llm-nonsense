import { createChatFromStoryAction } from "@/app/chat/actions";
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
  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `/api/chat/${chatId}`,
      prepareSendMessagesRequest({ messages, id }) {
        //only send the last message to the server
        return { body: { message: messages[messages.length - 1], id } };
      },
    }),
  });
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  return { messages, status, input, setInput, handleSubmit };
}
