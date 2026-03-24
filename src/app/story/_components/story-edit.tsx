"use client";

import { createChatFromStory } from "@/app/chat/actions";
import { LorebookStatus } from "@/app/lorebook/types";
import { StoryForm } from "@/app/story/_components/story-form";
import { deleteStoryAction, updateStoryAction } from "@/app/story/actions";
import { CardOption } from "@/components/card-selector";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ActionResponse } from "@/lib/action-utils";
import { startTransition, useActionState } from "react";

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
  currentLorebook: {
    status: LorebookStatus;
    name?: string;
  };
}

export const initialState: ActionResponse<null> = {
  success: undefined,
};

export function StoryEdit({
  story,
  characters,
  personas,
  worlds,
  currentLorebook,
}: StoryEditParams) {
  const [deleteState, deleteStory, isDeletePending] = useActionState(
    deleteStoryAction,
    initialState,
  );
  const [updateState, updateStory, isUpdatePending] = useActionState(
    updateStoryAction.bind(null, story.id),
    initialState,
  );
  const [createChatState, createChat, isCreateChatPending] = useActionState(
    createChatFromStory,
    initialState,
  );

  const isPending = isDeletePending || isUpdatePending || isCreateChatPending;

  async function onDeleteHandler() {
    if (!confirm(`Delete "${story.name}"? This cannot be undone.`)) return;
    startTransition(() => deleteStory(story.id));
  }

  async function handleNewChat(): Promise<void> {
    startTransition(() => createChat(story.id));
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
        {deleteState.success === false && (
          <p className="text-destructive">{deleteState.message}</p>
        )}
        {updateState.success === false && (
          <p className="text-destructive">{updateState.message}</p>
        )}
        {createChatState.success === false && (
          <p className="text-destructive">{createChatState.message}</p>
        )}
        <StoryForm
          formId={FORM_ID}
          isEdit
          defaultValues={story}
          formAction={updateStory}
          characters={characters}
          personas={personas}
          worlds={worlds}
          currentLorebook={currentLorebook}
        />
      </Content>
    </div>
  );
}
