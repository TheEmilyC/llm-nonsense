"use client";

import { CharacterForm } from "@/app/character/_components/character-form";
import { createCharacterAction } from "@/app/character/actions";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ActionResponse } from "@/lib/action-utils";
import { useActionState } from "react";

const FORM_ID = "form-new-character";

export const initialState: ActionResponse<null> = {
  success: undefined,
};

export function CharacterNew() {
  const [state, createCharacter, pending] = useActionState(
    createCharacterAction,
    initialState,
  );

  return (
    <div>
      <Header
        pageTitle="New Character"
        backLinkDestination="/character"
        backLinkLabel="Characters"
      >
        <Button size="sm" type="submit" form={FORM_ID} disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        {state.success === false && (
          <p className="text-destructive">{state.message}</p>
        )}
        <CharacterForm formId={FORM_ID} formAction={createCharacter} />
      </Content>
    </div>
  );
}
