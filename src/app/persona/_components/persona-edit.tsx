"use client";

import { useRouter } from "next/navigation";

import { PersonaForm } from "@/app/persona/_components/persona-form";
import { useDeletePersona, useUpdatePersona } from "@/app/persona/_lib/hooks";
import { PersonaDto, PersonaFormValues } from "@/app/persona/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-persona";

interface PersonaEditParams {
  persona: PersonaDto;
}

export function PersonaEdit({ persona }: PersonaEditParams) {
  const router = useRouter();
  const { deletePersona, isPending: isDeletePending } = useDeletePersona();
  const { isPending: isUpdatePending, updatePersona } = useUpdatePersona();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    if (!confirm(`Delete "${persona?.name}"? This cannot be undone.`)) return;
    await deletePersona({ personaId: persona.id });
    router.push(`/persona`);
  }

  async function onSubmitHandler(data: PersonaFormValues) {
    await updatePersona({ data, personaId: persona.id });
  }

  return (
    <div>
      <Header
        backLinkDestination="/persona"
        backLinkLabel="Persona"
        pageTitle={persona.name}
      >
        <Button
          disabled={isPending}
          onClick={deleteHandler}
          size="sm"
          type="button"
          variant="destructive"
        >
          {isDeletePending ? "Deleting..." : "Delete"}
        </Button>
        <Button disabled={isPending} form={FORM_ID} size="sm" type="submit">
          {isUpdatePending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <PersonaForm
          defaultValues={persona}
          formId={FORM_ID}
          imageSrc={persona.imageUrl}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
