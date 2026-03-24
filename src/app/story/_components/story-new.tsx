"use client";

import { StoryForm } from "@/app/story/_components/story-form";
import { createStoryAction } from "@/app/story/actions";
import { CardOption } from "@/components/card-selector";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ActionResponse } from "@/lib/action-utils";
import { useActionState } from "react";

const FORM_ID = "form-new-story";

interface StoryNewParams {
  characters: CardOption[];
  personas: CardOption[];
  worlds?: CardOption[];
  initialCharacterId?: string;
  initialPersonaId?: string;
  initialWorldId?: string;
  //   currentLorebook: {
  //     status: LorebookStatus;
  //     name?: string;
  //   };
}

export const initialState: ActionResponse<null> = {
  success: undefined,
};

export function StoryNew({
  characters,
  personas,
  initialCharacterId,
  initialPersonaId,
}: StoryNewParams) {
  const [state, createStory, isPending] = useActionState(
    createStoryAction,
    initialState,
  );

  return (
    <div>
      <Header
        pageTitle="New Story"
        backLinkDestination="/story"
        backLinkLabel="Stories"
      >
        <Button size="sm" type="submit" form={FORM_ID} disabled={isPending}>
          {isPending ? "Starting…" : "Begin"}
        </Button>
      </Header>

      <Content>
        {state.success === false && (
          <p className="text-destructive">{state.message}</p>
        )}
        <StoryForm
          formId={FORM_ID}
          characters={characters}
          personas={personas}
          formAction={createStory}
          defaultValues={{
            characterId: initialCharacterId,
            personaId: initialPersonaId,
          }}
          //currentLorebook={currentLorebook}
        />
      </Content>
    </div>
  );
}
