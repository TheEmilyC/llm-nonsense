"use client";

import { PersonaForm } from "@/app/persona/_components/persona-form";
import {
  deletePersonaAction,
  updatePersonaAction,
} from "@/app/persona/actions";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ActionResponse } from "@/lib/action-utils";
import { startTransition, useActionState } from "react";

const FORM_ID = "form-edit-persona";

interface PersonaEditParams {
  persona: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
  };
}

export const initialState: ActionResponse<null> = {
  success: undefined,
};

export function PersonaEdit({ persona }: PersonaEditParams) {
  const [deleteState, deleteCharacter, isDeletePending] = useActionState(
    deletePersonaAction,
    initialState,
  );
  const [updateState, updateCharacter, isUpdatePending] = useActionState(
    updatePersonaAction.bind(null, persona.id),
    initialState,
  );
  const isPending = isDeletePending || isUpdatePending;

  async function onDeleteHandler() {
    if (!confirm(`Delete "${persona?.name}"? This cannot be undone.`)) return;
    startTransition(() => deleteCharacter(persona.id));
  }

  return (
    <div>
      <Header
        pageTitle={persona.name}
        backLinkDestination="/persona"
        backLinkLabel="Persona"
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
        <Button size="sm" type="submit" form={FORM_ID} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        {deleteState.success === false && (
          <p className="text-destructive">{deleteState.message}</p>
        )}
        {updateState.success === false && (
          <p className="text-destructive">{updateState.message}</p>
        )}
        <PersonaForm
          formId={FORM_ID}
          defaultValues={persona}
          imageSrc={persona.imageUrl}
          formAction={updateCharacter}
        />
      </Content>
    </div>
  );
}
