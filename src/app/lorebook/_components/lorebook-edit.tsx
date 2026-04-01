"use client";

import { LorebookForm } from "@/app/lorebook/_components/lorebook-form";
import {
  useDeleteLorebook,
  useUpdateLorebook,
} from "@/app/lorebook/_lib/hooks";
import { LorebookDbDto, LorebookFormValues } from "@/app/lorebook/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const FORM_ID = "form-edit-lorebook";

interface LorebookEditProps {
  lorebook: LorebookDbDto;
}

export function LorebookEdit({ lorebook }: LorebookEditProps) {
  const router = useRouter();
  const { deleteLorebook, isPending: isDeletePending } = useDeleteLorebook();
  const { updateLorebook, isPending: isUpdatePending } = useUpdateLorebook();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    if (!confirm(`Delete "${lorebook.name}"? This cannot be undone.`)) return;
    await deleteLorebook({ lorebookId: lorebook.id });
    router.push("/lorebook");
  }

  async function onSubmitHandler(data: LorebookFormValues) {
    await updateLorebook({ lorebookId: lorebook.id, data });
  }

  return (
    <div>
      <Header
        pageTitle={lorebook.name}
        backLinkDestination="/lorebook"
        backLinkLabel="Lorebooks"
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
        <LorebookForm
          formId={FORM_ID}
          defaultValues={lorebook}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
