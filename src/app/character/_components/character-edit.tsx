"use client";

import { CharacterForm } from "@/app/character/_components/character-form";
import { useDeleteCharacter, useUpdateCharacter } from "@/app/character/hooks";
import { CharacterDto, CharacterFormValues } from "@/app/character/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const FORM_ID = "form-edit-character";

export interface CharacterEditParams {
  character: CharacterDto;
}

export function CharacterEdit({ character }: CharacterEditParams) {
  const router = useRouter();
  const { deleteCharacter, isPending: isDeletePending } = useDeleteCharacter();
  const { updateCharacter, isPending: isUpdatePending } = useUpdateCharacter();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    if (!confirm(`Delete "${character?.name}"? This cannot be undone.`)) return;
    await deleteCharacter({ characterId: character.id });
    router.push(`/character`);
  }

  async function onSubmitHandler(data: CharacterFormValues) {
    await updateCharacter({ characterId: character.id, data });
  }

  return (
    <div>
      <Header
        pageTitle={character.name}
        backLinkDestination="/character"
        backLinkLabel="Character"
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
        <CharacterForm
          formId={FORM_ID}
          defaultValues={character}
          imageSrc={character.imageUrl}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
