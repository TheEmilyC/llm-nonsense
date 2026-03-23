"use client";

import { StoryForm } from "@/app/story/_components/story-form";
import { deleteStoryAction, updateStoryAction } from "@/app/story/actions";
import { CardOption } from "@/components/card-selector";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ActionResponse } from "@/lib/types";
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
}

export const initialState: ActionResponse<null> = {
  success: undefined,
};

export function StoryEdit({
  story,
  characters,
  personas,
  worlds,
}: StoryEditParams) {
  const [deleteState, deleteStory, isDeletePending] = useActionState(
    deleteStoryAction,
    initialState,
  );
  const [updateState, updateStory, isUpdatePending] = useActionState(
    updateStoryAction.bind(null, story.id),
    initialState,
  );

  const isPending = isDeletePending || isUpdatePending;
  const createChatIsPending = false;

  async function onDeleteHandler() {
    if (!confirm(`Delete "${story.name}"? This cannot be undone.`)) return;
    startTransition(() => deleteStory(story.id));
  }

  async function handleNewChat(): Promise<void> {
    //TODO: reimplement
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
          {createChatIsPending ? "Starting Chat..." : "New Chat"}
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
        <StoryForm
          formId={FORM_ID}
          isEdit
          defaultValues={story}
          formAction={updateStory}
          characters={characters}
          personas={personas}
          worlds={worlds}
        />
      </Content>
    </div>
  );
}
