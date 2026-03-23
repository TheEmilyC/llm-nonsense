"use client";

import { CharacterForm } from "@/app/character/_components/character-form";
import {
  deleteCharacterAction,
  updateCharacterAction,
} from "@/app/character/actions";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ActionResponse } from "@/lib/types";
import { useActionState } from "react";

const FORM_ID = "form-edit-character";

export interface CharacterEditParams {
  character: {
    id: string;
    imageUrl: string;
    name: string;
    tags: string[];
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes: string;
  };
}

export const initialState: ActionResponse<null> = {
  success: undefined,
};

export function CharacterEdit({ character }: CharacterEditParams) {
  const [deleteState, deleteCharacter, deletePending] = useActionState(
    deleteCharacterAction,
    initialState,
  );
  const [updateState, updateCharacter, updatePending] = useActionState(
    updateCharacterAction.bind(null, character.id),
    initialState,
  );

  const isPending = deletePending || updatePending;

  async function deleteHandler() {
    if (!confirm(`Delete "${character?.name}"? This cannot be undone.`)) return;
    deleteCharacter(character.id);
  }

  return (
    <div>
      <Header
        pageTitle={character.name}
        backLinkDestination="/character"
        backLinkLabel="Character"
      >
        <Button
          size="sm"
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={deleteHandler}
        >
          {deletePending ? "Deleting..." : "Delete"}
        </Button>
        <Button size="sm" type="submit" form={FORM_ID} disabled={isPending}>
          {updatePending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        {deleteState.success === false && (
          <p className="text-destructive">{deleteState.message}</p>
        )}
        {updateState.success === false && (
          <p className="text-destructive">{updateState.message}</p>
        )}
        <CharacterForm
          formId={FORM_ID}
          defaultValues={character}
          imageSrc={character.imageUrl}
          formAction={updateCharacter}
        />
      </Content>
    </div>
  );
}
