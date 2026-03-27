"use client";

import { PersonaForm } from "@/app/persona/_components/persona-form";
import { useCreatePersona } from "@/app/persona/_lib/hooks";
import { PersonaFormValues } from "@/app/persona/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const FORM_ID = "form-new-persona";

export function PersonaNew() {
  const router = useRouter();
  const { createPersona, isPending } = useCreatePersona();

  async function onSubmitHandler(data: PersonaFormValues) {
    const { id } = await createPersona(data);
    router.push(`/persona/${id}`);
  }

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
        <PersonaForm formId={FORM_ID} onSubmit={onSubmitHandler} />
      </Content>
    </div>
  );
}
