"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { WorldForm } from "@/app/world/_components/world-form";
import { useCreateWorld } from "@/app/world/_lib/hooks";
import { WorldFormValues } from "@/app/world/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-world";

export function WorldNew() {
  const { createWorld, isPending } = useCreateWorld();

  async function onSubmitHandler(
    data: WorldFormValues,
    setError: UseFormSetError<WorldFormValues>,
  ) {
    const result = await createWorld(data);
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
        pageTitle="New World"
      >
        <Button disabled={isPending} form={FORM_ID} size="sm" type="submit">
          {isPending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <WorldForm formId={FORM_ID} onSubmit={onSubmitHandler} />
      </Content>
    </div>
  );
}
