"use client";

import { useRouter } from "next/navigation";

import { PromptForm } from "@/app/prompt/_component/prompt-form";
import { useDeletePrompt, useUpdatePrompt } from "@/app/prompt/_lib/hooks";
import { PromptDto, PromptFormValues } from "@/app/prompt/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-prompt";

interface PromptEditProps {
  prompt: PromptDto;
}

export function PromptEdit({ prompt }: PromptEditProps) {
  const router = useRouter();
  const { deletePrompt, isPending: isDeletePending } = useDeletePrompt();
  const { isPending: isUpdatePending, updatePrompt } = useUpdatePrompt();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    if (!confirm(`Delete "${prompt.name}"? This cannot be undone.`)) return;
    await deletePrompt({ promptId: prompt.id });
    router.push("/prompt");
  }

  async function onSubmitHandler(data: PromptFormValues) {
    await updatePrompt({ data, promptId: prompt.id });
  }

  return (
    <div>
      <Header
        backLinkDestination="/prompt"
        backLinkLabel="Prompts"
        pageTitle={prompt.name}
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
        <PromptForm
          defaultValues={{ name: prompt.name }}
          formId={FORM_ID}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
