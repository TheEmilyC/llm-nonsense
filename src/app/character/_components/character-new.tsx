"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { CharacterForm } from "@/app/character/_components/character-form";
import { useCreateCharacter } from "@/app/character/_lib/hooks";
import { CharacterFormValues } from "@/app/character/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-character";

export function CharacterNew() {
  const { createCharacter, isPending } = useCreateCharacter();

  async function onSubmitHandler(
    data: CharacterFormValues,
    setError: UseFormSetError<CharacterFormValues>,
  ) {
    const result = await createCharacter(data);
    if (!result.success && result.error.details) {
      for (const [field, messages] of Object.entries(result.error.details)) {
        setError(field as keyof CharacterFormValues, {
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
        backLinkDestination="/character"
        backLinkLabel="Characters"
        pageTitle="New Character"
      >
        <Button disabled={isPending} form={FORM_ID} size="sm" type="submit">
          {isPending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <CharacterForm formId={FORM_ID} onSubmit={onSubmitHandler} />
      </Content>
    </div>
  );
}
