"use client";

import { CharacterForm } from "@/app/character/_components/character-form";
import { useCreateCharacter } from "@/app/character/hooks";
import { CharacterFormValues } from "@/app/character/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
        pageTitle="New Character"
        backLinkDestination="/character"
        backLinkLabel="Characters"
      >
        <Button size="sm" type="submit" form={FORM_ID} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <CharacterForm formId={FORM_ID} onSubmit={onSubmitHandler} />
      </Content>
    </div>
  );
}
