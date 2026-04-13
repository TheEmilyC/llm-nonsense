"use client";

import Link from "next/link";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { useCreateChatFromStory, useDeleteChat } from "@/app/chat/_lib/hooks";
import { StoryForm } from "@/app/story/_components/story-form";
import { useDeleteStory, useUpdateStory } from "@/app/story/_lib/hooks";
import { StoryDto, StoryFormValues } from "@/app/story/_lib/schema";
import { CardOption } from "@/components/card-selector";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { DeleteIcon } from "@/lib/icons";

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
  const { deleteStory, isPending: isDeletePending } = useDeleteStory();
  const { isPending: isUpdatePending, updateStory } = useUpdateStory();
  const { createChatFromStory: createChat, isPending: isCreateChatPending } =
    useCreateChatFromStory();

  const { deleteChat, isPending: isDeleteChatPending } = useDeleteChat();

  const isPending =
    isDeletePending ||
    isUpdatePending ||
    isCreateChatPending ||
    isDeleteChatPending;

  async function handleDeleteStory() {
    const result = await deleteStory(story.id);
    if (!result.success) toast.error(result.error.message);
  }

  async function handleNewChat(): Promise<void> {
    const result = await createChat(story.id);
    if (!result.success) {
      toast.error(result.error.message);
    }
  }

  async function handleDeleteChat(chatId: string) {
    const result = await deleteChat(chatId);
    if (!result.success) toast.error(result.error.message);
  }

  async function onSubmitHandler(
    update: StoryFormValues,
    setError: UseFormSetError<StoryFormValues>,
  ) {
    const result = await updateStory({ id: story.id, update });
    if (!result.success && result.error.details) {
      for (const [field, messages] of Object.entries(result.error.details)) {
        setError(field as keyof StoryFormValues, {
          message: messages.join("\n"),
          type: "server",
        });
      }
      return;
    }
    if (!result.success) {
      toast.error(result.error.message);
    }
  }

  return (
    <div>
      <Header
        backLinkDestination="/story"
        backLinkLabel="Stories"
        pageTitle={story.name}
      >
        <ConfirmDialog
          description={`Delete ${story.name}? This can not be undone`}
          onConfirm={handleDeleteStory}
          title="Delete Story?"
          type="delete"
        >
          <Button
            disabled={isPending}
            size="sm"
            type="button"
            variant="destructive"
          >
            {isDeletePending ? "Deleting..." : "Delete"}
          </Button>
        </ConfirmDialog>

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
          {chats.length === 0 && (
            <p className="text-sm text-muted-foreground">No chats yet.</p>
          )}
          {chats.map((chat) => (
            <div className="flex items-center gap-2" key={chat.id}>
              <Link
                className="flex-1 rounded-lg border px-4 py-3 hover:bg-muted transition-colors"
                href={`/chat/${chat.id}`}
              >
                <p className="text-sm font-medium">{chat.name}</p>
              </Link>
              <ConfirmDialog
                description={`Delete ${chat.name}? This can not be undone`}
                onConfirm={() => handleDeleteChat(chat.id)}
                title="Delete Story?"
                type="delete"
              >
                <Button
                  className="self-stretch h-auto w-12"
                  disabled={isPending}
                  size="icon"
                  variant="destructive"
                >
                  <DeleteIcon className="size-4" />
                </Button>
              </ConfirmDialog>
            </div>
          ))}
        </div>
      </Content>
    </div>
  );
}
