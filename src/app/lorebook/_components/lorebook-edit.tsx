"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { LorebookForm } from "@/app/lorebook/_components/lorebook-form";
import {
  useDeleteLorebook,
  useUpdateLorebook,
} from "@/app/lorebook/_lib/hooks";
import {
  LorebookEntityDto,
  LorebookFormValues,
} from "@/app/lorebook/_lib/schema";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-lorebook";

interface LorebookEditProps {
  lorebook: LorebookEntityDto;
}

export function LorebookEdit({ lorebook }: LorebookEditProps) {
  const { deleteLorebook, isPending: isDeletePending } = useDeleteLorebook();
  const { isPending: isUpdatePending, updateLorebook } = useUpdateLorebook();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    await deleteLorebook(lorebook.id);
  }

  async function onSubmitHandler(
    update: LorebookFormValues,
    setError: UseFormSetError<LorebookFormValues>,
  ) {
    const result = await updateLorebook({
      id: lorebook.id,
      update,
    });
    if (!result.success && result.error.details) {
      for (const [field, messages] of Object.entries(result.error.details)) {
        setError(field as keyof LorebookFormValues, {
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
        backLinkDestination="/lorebook"
        backLinkLabel="Lorebooks"
        pageTitle={lorebook.name}
      >
        <ConfirmDialog
          description={`Delete ${lorebook.name}? This can not be undone`}
          onConfirm={deleteHandler}
          title="Delete Lorebook?"
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
        <LorebookForm
          defaultValues={lorebook}
          formId={FORM_ID}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
