"use client";

import { useRouter } from "next/navigation";

import { CharacterForm } from "@/app/character/_components/character-form";
import {
  useDeleteCharacter,
  useUpdateCharacter,
} from "@/app/character/_lib/hooks";
import { CharacterDto, CharacterFormValues } from "@/app/character/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-character";

export interface CharacterEditParams {
  character: CharacterDto;
}

export function CharacterEdit({ character }: CharacterEditParams) {
  const router = useRouter();
  const { deleteCharacter, isPending: isDeletePending } = useDeleteCharacter();
  const { isPending: isUpdatePending, updateCharacter } = useUpdateCharacter();

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
        backLinkDestination="/character"
        backLinkLabel="Character"
        pageTitle={character.name}
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
        <CharacterForm
          defaultValues={character}
          formId={FORM_ID}
          imageSrc={character.imageUrl}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
