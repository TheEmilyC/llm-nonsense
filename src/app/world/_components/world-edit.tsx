"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { WorldForm } from "@/app/world/_components/world-form";
import { useDeleteWorld, useUpdateWorld } from "@/app/world/_lib/hooks";
import { WorldDto, WorldFormValues } from "@/app/world/_lib/schema";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-world";

interface WorldEditParams {
  world: WorldDto;
}

export function WorldEdit({ world }: WorldEditParams) {
  const { deleteWorld, isPending: isDeletePending } = useDeleteWorld();
  const { isPending: isUpdatePending, updateWorld } = useUpdateWorld();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    const result = await deleteWorld(world.id);
    if (!result.success) toast.error(result.error.message);
  }

  async function onSubmitHandler(
    update: WorldFormValues,
    setError: UseFormSetError<WorldFormValues>,
  ) {
    const result = await updateWorld({ id: world.id, update });
    if (!result.success && result.error.details) {
      for (const [field, messages] of Object.entries(result.error.details)) {
        setError(field as keyof WorldFormValues, {
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
        backLinkDestination="/world"
        backLinkLabel="Worlds"
        pageTitle={world.name}
      >
        <ConfirmDialog
          description={`Delete ${world.name}? This can not be undone`}
          onConfirm={deleteHandler}
          title="Delete World?"
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
        <WorldForm
          defaultValues={world}
          formId={FORM_ID}
          imageSrc={world.imageUrl}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
