"use client";

import { useCreateChatFromStory, useDeleteChat } from "@/app/chat/_lib/hooks";
import { StoryForm } from "@/app/story/_components/story-form";
import { useDeleteStory, useUpdateStory } from "@/app/story/_lib/hooks";
import { StoryFormValues } from "@/app/story/_lib/schema";
import { CardOption } from "@/components/card-selector";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FORM_ID = "form-edit-story";

interface StoryEditParams {
  story: {
    id: string;
    name: string;
    characterId: string;
    personaId: string;
  };
  characters?: CardOption[];
  personas?: CardOption[];
  worlds?: CardOption[];
  lorebooks: { value: string; label: string }[];
  chats: { id: string; name: string }[];
}

export function StoryEdit({
  story,
  characters,
  personas,
  worlds,
  lorebooks,
  chats,
}: StoryEditParams) {
  const router = useRouter();
  const { deleteStory, isPending: isDeletePending } = useDeleteStory();
  const { updateStory, isPending: isUpdatePending } = useUpdateStory();
  const { createChatFromStory: createChat, isPending: isCreateChatPending } =
    useCreateChatFromStory();

  const { deleteChat, isPending: isDeleteChatPending } = useDeleteChat();
  const [chatList, setChatList] = useState(chats);

  const isPending = isDeletePending || isUpdatePending || isCreateChatPending || isDeleteChatPending;

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
    await updateStory({ storyId: story.id, data });
  }

  return (
    <div>
      <Header
        pageTitle={story.name}
        backLinkDestination="/story"
        backLinkLabel="Stories"
      >
        <Button
          size="sm"
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={onDeleteHandler}
        >
          {isDeletePending ? "Deleting..." : "Delete"}
        </Button>
        <Button size="sm" onClick={handleNewChat} disabled={isPending}>
          {isCreateChatPending ? "Starting Chat..." : "New Chat"}
        </Button>
        <Button size="sm" type="submit" form={FORM_ID} disabled={isPending}>
          {isUpdatePending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <StoryForm
          formId={FORM_ID}
          isEdit
          defaultValues={story}
          onSubmit={onSubmitHandler}
          characters={characters}
          personas={personas}
          worlds={worlds}
          lorebooks={lorebooks}
        />
        <div className="mt-6 flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Chats</h2>
          {chatList.length === 0 && (
            <p className="text-sm text-muted-foreground">No chats yet.</p>
          )}
          {chatList.map((chat) => (
            <div key={chat.id} className="flex items-center gap-2">
              <Link
                href={`/chat/${chat.id}`}
                className="flex-1 rounded-lg border px-4 py-3 hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">{chat.name}</p>
              </Link>
              <Button
                size="icon"
                variant="destructive"
                disabled={isPending}
                className="self-stretch h-auto w-12"
                onClick={() => handleDeleteChat(chat.id, chat.name)}
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
