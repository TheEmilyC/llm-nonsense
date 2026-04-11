"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { LorebookForm } from "@/app/lorebook/_components/lorebook-form";
import { useCreateLorebook } from "@/app/lorebook/_lib/hooks";
import { LorebookFormValues } from "@/app/lorebook/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-lorebook";

export function LorebookNew() {
  const { createLorebook, isPending } = useCreateLorebook();

  async function onSubmitHandler(
    data: LorebookFormValues,
    setError: UseFormSetError<LorebookFormValues>,
  ) {
    const result = await createLorebook(data);
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
        pageTitle="New Lorebook"
      >
        <Button disabled={isPending} form={FORM_ID} size="sm" type="submit">
          {isPending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <LorebookForm formId={FORM_ID} onSubmit={onSubmitHandler} />
      </Content>
    </div>
  );
}
