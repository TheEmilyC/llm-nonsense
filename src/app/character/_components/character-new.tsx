"use client";

import { useRouter } from "next/navigation";

import { CharacterForm } from "@/app/character/_components/character-form";
import { useCreateCharacter } from "@/app/character/_lib/hooks";
import { CharacterFormValues } from "@/app/character/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-character";

export function CharacterNew() {
  const router = useRouter();
  const { createCharacter, isPending } = useCreateCharacter();

  async function onSubmitHandler(data: CharacterFormValues) {
    const { id } = await createCharacter(data);
    router.push(`/character/${id}`);
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
