"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { PromptForm } from "@/app/prompt/_component/prompt-form";
import { useDeletePrompt, useUpdatePrompt } from "@/app/prompt/_lib/hooks";
import { PromptDto, PromptFormValues } from "@/app/prompt/_lib/schema";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-prompt";

interface PromptEditProps {
  prompt: PromptDto;
}

export function PromptEdit({ prompt }: PromptEditProps) {
  const { deletePrompt, isPending: isDeletePending } = useDeletePrompt();
  const { isPending: isUpdatePending, updatePrompt } = useUpdatePrompt();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    await deletePrompt(prompt.id);
  }

  async function onSubmitHandler(
    data: PromptFormValues,
    setError: UseFormSetError<PromptFormValues>,
  ) {
    const result = await updatePrompt({ id: prompt.id, update: data });
    if (!result.success && result.error.details) {
      for (const [field, messages] of Object.entries(result.error.details)) {
        setError(field as keyof PromptFormValues, {
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
        backLinkDestination="/prompt"
        backLinkLabel="Prompts"
        pageTitle={prompt.name}
      >
        <ConfirmDialog
          description={`Delete ${prompt.name}? This can not be undone`}
          onConfirm={deleteHandler}
          title="Delete Prompt?"
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
        <PromptForm
          defaultValues={prompt}
          formId={FORM_ID}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
