"use client";

import { PersonaForm } from "@/app/persona/_components/persona-form";
import { useDeletePersona, useUpdatePersona } from "@/app/persona/_lib/hooks";
import { PersonaDto, PersonaFormValues } from "@/app/persona/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const FORM_ID = "form-edit-persona";

interface PersonaEditParams {
  persona: PersonaDto;
}

export function PersonaEdit({ persona }: PersonaEditParams) {
  const router = useRouter();
  const { deletePersona, isPending: isDeletePending } = useDeletePersona();
  const { updatePersona, isPending: isUpdatePending } = useUpdatePersona();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    if (!confirm(`Delete "${persona?.name}"? This cannot be undone.`)) return;
    await deletePersona({ personaId: persona.id });
    router.push(`/persona`);
  }

  async function onSubmitHandler(data: PersonaFormValues) {
    await updatePersona({ personaId: persona.id, data });
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
          onClick={deleteHandler}
        >
          {isDeletePending ? "Deleting..." : "Delete"}
        </Button>
        <Button size="sm" type="submit" form={FORM_ID} disabled={isPending}>
          {isUpdatePending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <PersonaForm
          formId={FORM_ID}
          defaultValues={persona}
          imageSrc={persona.imageUrl}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
