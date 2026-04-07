"use client";

import { useRouter } from "next/navigation";

import { PromptForm } from "@/app/prompt/_component/prompt-form";
import { useCreatePrompt } from "@/app/prompt/_lib/hooks";
import { PromptFormValues } from "@/app/prompt/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-prompt";

export function PromptNew() {
  const router = useRouter();
  const { createPrompt, isPending } = useCreatePrompt();

  async function onSubmitHandler(data: PromptFormValues) {
    const { id } = await createPrompt(data);
    router.push(`/prompt/${id}`);
  }

  return (
    <div>
      <Header
        backLinkDestination="/prompt"
        backLinkLabel="Prompts"
        pageTitle="New Prompt"
      >
        <Button disabled={isPending} form={FORM_ID} size="sm" type="submit">
          {isPending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <PromptForm formId={FORM_ID} onSubmit={onSubmitHandler} />
      </Content>
    </div>
  );
}
