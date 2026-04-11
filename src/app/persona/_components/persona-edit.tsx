"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { PersonaForm } from "@/app/persona/_components/persona-form";
import { useDeletePersona, useUpdatePersona } from "@/app/persona/_lib/hooks";
import { PersonaDto, PersonaFormValues } from "@/app/persona/_lib/schema";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-persona";

interface PersonaEditParams {
  persona: PersonaDto;
}

export function PersonaEdit({ persona }: PersonaEditParams) {
  const { deletePersona, isPending: isDeletePending } = useDeletePersona();
  const { isPending: isUpdatePending, updatePersona } = useUpdatePersona();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    await deletePersona(persona.id);
  }

  async function onSubmitHandler(
    data: PersonaFormValues,
    setError: UseFormSetError<PersonaFormValues>,
  ) {
    const result = await updatePersona({ id: persona.id, update: data });
    if (!result.success && result.error.details) {
      for (const [field, messages] of Object.entries(result.error.details)) {
        setError(field as keyof PersonaFormValues, {
          message: messages.join("\n"),
          type: "server",
        });
      }
      return;
    }
    if (!result.success) {
      toast.error(result.error.message);
    }
  }

  return (
    <div>
      <Header
        backLinkDestination="/persona"
        backLinkLabel="Persona"
        pageTitle={persona.name}
      >
        <ConfirmDialog
          description={`Delete ${persona.name}? This can not be undone`}
          onConfirm={deleteHandler}
          title="Delete Persona?"
          type="delete"
        >
          <Button
            disabled={isPending}
            size="sm"
            type="button"
            variant="destructive"
          >
            {isDeletePending ? "Deleting..." : "Delete"}
          </Button>
        </ConfirmDialog>
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
