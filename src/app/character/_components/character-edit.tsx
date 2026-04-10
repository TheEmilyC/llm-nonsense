"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { CharacterForm } from "@/app/character/_components/character-form";
import {
  useDeleteCharacter,
  useUpdateCharacter,
} from "@/app/character/_lib/hooks";
import { CharacterDto, CharacterFormValues } from "@/app/character/_lib/schema";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-character";

export interface CharacterEditParams {
  character: CharacterDto;
}

export function CharacterEdit({ character }: CharacterEditParams) {
  const { deleteCharacter, isPending: isDeletePending } = useDeleteCharacter();
  const { isPending: isUpdatePending, updateCharacter } = useUpdateCharacter();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    await deleteCharacter(character.id);
  }

  async function onSubmitHandler(
    data: CharacterFormValues,
    setError: UseFormSetError<CharacterFormValues>,
  ) {
    const result = await updateCharacter({ data, id: character.id });
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
        backLinkLabel="Character"
        pageTitle={character.name}
      >
        <ConfirmDialog
          description={`Delete ${character.name}? This can not be undone`}
          onConfirm={deleteHandler}
          title="Delete Character?"
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
