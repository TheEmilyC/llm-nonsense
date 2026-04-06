"use client";

import { useRouter } from "next/navigation";

import { LorebookForm } from "@/app/lorebook/_components/lorebook-form";
import {
  useDeleteLorebook,
  useUpdateLorebook,
} from "@/app/lorebook/_lib/hooks";
import {
  LorebookEntityDto,
  LorebookFormValues,
} from "@/app/lorebook/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-lorebook";

interface LorebookEditProps {
  lorebook: LorebookEntityDto;
}

export function LorebookEdit({ lorebook }: LorebookEditProps) {
  const router = useRouter();
  const { deleteLorebook, isPending: isDeletePending } = useDeleteLorebook();
  const { isPending: isUpdatePending, updateLorebook } = useUpdateLorebook();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    if (!confirm(`Delete "${lorebook.name}"? This cannot be undone.`)) return;
    await deleteLorebook({ lorebookId: lorebook.id });
    router.push("/lorebook");
  }

  async function onSubmitHandler(data: LorebookFormValues) {
    await updateLorebook({ data, lorebookId: lorebook.id });
  }

  return (
    <div>
      <Header
        backLinkDestination="/lorebook"
        backLinkLabel="Lorebooks"
        pageTitle={lorebook.name}
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
        <LorebookForm
          defaultValues={lorebook}
          formId={FORM_ID}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
