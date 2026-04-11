"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { PersonaForm } from "@/app/persona/_components/persona-form";
import { useCreatePersona } from "@/app/persona/_lib/hooks";
import { PersonaFormValues } from "@/app/persona/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-persona";

export function PersonaNew() {
  const { createPersona, isPending } = useCreatePersona();

  async function onSubmitHandler(
    data: PersonaFormValues,
    setError: UseFormSetError<PersonaFormValues>,
  ) {
    const result = await createPersona(data);
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
