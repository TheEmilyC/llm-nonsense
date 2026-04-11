"use client";

import { PersonaForm } from "@/app/persona/_components/persona-form";
import { useCreatePersona } from "@/app/persona/_lib/hooks";
import { PersonaFormValues } from "@/app/persona/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-persona";

export function PersonaNew() {
  const { createPersona, isPending } = useCreatePersona();

  async function onSubmitHandler(data: PersonaFormValues) {
    await createPersona(data);
  }

  return (
    <div>
      <Header
        backLinkDestination="/persona"
        backLinkLabel="Personas"
        pageTitle="New Persona"
      >
        <Button disabled={isPending} form={FORM_ID} size="sm" type="submit">
          {isPending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <PersonaForm formId={FORM_ID} onSubmit={onSubmitHandler} />
      </Content>
    </div>
  );
}
