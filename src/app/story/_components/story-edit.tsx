"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCreateChatFromStory, useDeleteChat } from "@/app/chat/_lib/hooks";
import { StoryForm } from "@/app/story/_components/story-form";
import { useDeleteStory, useUpdateStory } from "@/app/story/_lib/hooks";
import { StoryDto, StoryFormValues } from "@/app/story/_lib/schema";
import { CardOption } from "@/components/card-selector";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-story";

interface StoryEditParams {
  characters?: CardOption[];
  chats: { id: string; name: string }[];
  lorebooks: { label: string; value: string }[];
  personas?: CardOption[];
  prompts: { label: string; value: string }[];
  story: StoryDto;
  worlds?: CardOption[];
}

export function StoryEdit({
  characters,
  chats,
  lorebooks,
  personas,
  prompts,
  story,
  worlds,
}: StoryEditParams) {
  const router = useRouter();
  const { deleteStory, isPending: isDeletePending } = useDeleteStory();
  const { isPending: isUpdatePending, updateStory } = useUpdateStory();
  const { createChatFromStory: createChat, isPending: isCreateChatPending } =
    useCreateChatFromStory();

  const { deleteChat, isPending: isDeleteChatPending } = useDeleteChat();
  const [chatList, setChatList] = useState(chats);

  const isPending =
    isDeletePending ||
    isUpdatePending ||
    isCreateChatPending ||
    isDeleteChatPending;

  async function onDeleteHandler() {
    if (!confirm(`Delete "${story.name}"? This cannot be undone.`)) return;
    await deleteStory({ storyId: story.id });
    router.push(`/story`);
  }

  async function handleNewChat(): Promise<void> {
    const { id } = await createChat({ storyId: story.id });
    router.push(`/chat/${id}`);
  }

  async function handleDeleteChat(chatId: string, chatName: string) {
    if (!confirm(`Delete "${chatName}"? This cannot be undone.`)) return;
    await deleteChat({ chatId });
    setChatList((prev) => prev.filter((c) => c.id !== chatId));
  }

  async function onSubmitHandler(data: StoryFormValues) {
    await updateStory({ data, storyId: story.id });
  }

  return (
    <div>
      <Header
        backLinkDestination="/story"
        backLinkLabel="Stories"
        pageTitle={story.name}
      >
        <Button
          disabled={isPending}
          onClick={onDeleteHandler}
          size="sm"
          type="button"
          variant="destructive"
        >
          {isDeletePending ? "Deleting..." : "Delete"}
        </Button>
        <Button disabled={isPending} onClick={handleNewChat} size="sm">
          {isCreateChatPending ? "Starting Chat..." : "New Chat"}
        </Button>
        <Button disabled={isPending} form={FORM_ID} size="sm" type="submit">
          {isUpdatePending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <StoryForm
          characters={characters}
          defaultValues={story}
          formId={FORM_ID}
          isEdit
          lorebooks={lorebooks}
          onSubmit={onSubmitHandler}
          personas={personas}
          prompts={prompts}
          worlds={worlds}
        />
        <div className="mt-6 flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Chats</h2>
          {chatList.length === 0 && (
            <p className="text-sm text-muted-foreground">No chats yet.</p>
          )}
          {chatList.map((chat) => (
            <div className="flex items-center gap-2" key={chat.id}>
              <Link
                className="flex-1 rounded-lg border px-4 py-3 hover:bg-muted transition-colors"
                href={`/chat/${chat.id}`}
              >
                <p className="text-sm font-medium">{chat.name}</p>
              </Link>
              <Button
                className="self-stretch h-auto w-12"
                disabled={isPending}
                onClick={() => handleDeleteChat(chat.id, chat.name)}
                size="icon"
                variant="destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </Content>
    </div>
  );
}
