"use client";

import { useCreateChatFromStory } from "@/app/chat/_lib/hooks";
import { StoryForm } from "@/app/story/_components/story-form";
import { useDeleteStory, useUpdateStory } from "@/app/story/_lib/hooks";
import { StoryFormValues } from "@/app/story/_lib/schema";
import { CardOption } from "@/components/card-selector";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
}

export function StoryEdit({
  story,
  characters,
  personas,
  worlds,
  lorebooks,
}: StoryEditParams) {
  const router = useRouter();
  const { deleteStory, isPending: isDeletePending } = useDeleteStory();
  const { updateStory, isPending: isUpdatePending } = useUpdateStory();
  const { createChatFromStory: createChat, isPending: isCreateChatPending } =
    useCreateChatFromStory();

  const isPending = isDeletePending || isUpdatePending || isCreateChatPending;

  async function onDeleteHandler() {
    if (!confirm(`Delete "${story.name}"? This cannot be undone.`)) return;
    await deleteStory({ storyId: story.id });
    router.push(`/story`);
  }

  async function handleNewChat(): Promise<void> {
    const { id } = await createChat({ storyId: story.id });
    router.push(`/chat/${id}`);
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
      </Content>
    </div>
  );
}
