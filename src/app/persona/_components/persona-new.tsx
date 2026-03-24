"use client";

import { PersonaForm } from "@/app/persona/_components/persona-form";
import { createPersonaAction } from "@/app/persona/actions";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ActionResponse } from "@/lib/action-utils";
import { useActionState } from "react";

const FORM_ID = "form-new-persona";

export const initialState: ActionResponse<null> = {
  success: undefined,
};

export function PersonaNew() {
  const [state, createCharacter, isPending] = useActionState(
    createPersonaAction,
    initialState,
  );
  return (
    <div>
      <Header
        pageTitle="New Persona"
        backLinkDestination="/persona"
        backLinkLabel="Personas"
      >
        <Button size="sm" disabled={isPending} type="submit" form={FORM_ID}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        {state.success === false && (
          <p className="text-destructive">{state.message}</p>
        )}
        <PersonaForm formId={FORM_ID} formAction={createCharacter} />
      </Content>
    </div>
  );
}
