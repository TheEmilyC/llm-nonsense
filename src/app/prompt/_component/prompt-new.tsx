"use client";

import { useRouter } from "next/navigation";

import { PromptForm } from "@/app/prompt/_component/prompt-form";
import { useCreatePrompt } from "@/app/prompt/_lib/hooks";
import { PromptFormValues } from "@/app/prompt/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

import { MessageRole, PromptInjectTag } from "../../../../generated/enums";

const FORM_ID = "form-new-prompt";

const DEFAULT_PROMPT: PromptFormValues = {
  name: "",
  promptFragments: [
    {
      enabled: true,
      injectTag: PromptInjectTag.characterName,
      name: "Character Name",
      role: MessageRole.system,
      type: "inject",
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.characterDescription,
      name: "Character Description",
      role: MessageRole.system,
      type: "inject",
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.characterPersonality,
      name: "Character Personality",
      role: MessageRole.system,
      type: "inject",
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.characterScenario,
      name: "Character Scenario",
      role: MessageRole.system,
      type: "inject",
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.personaName,
      name: "Persona Name",
      role: MessageRole.system,
      type: "inject",
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.personaDescription,
      name: "Persona Description",
      role: MessageRole.system,
      type: "inject",
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.worldName,
      name: "World Name",
      role: MessageRole.system,
      type: "inject",
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.worldDescription,
      name: "World Description",
      role: MessageRole.system,
      type: "inject",
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.lorebook,
      name: "Lorebook",
      role: MessageRole.system,
      type: "inject",
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.lastMessage,
      name: "Last Message",
      role: MessageRole.user,
      type: "inject",
    },
  ],
};

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
        <PromptForm
          defaultValues={DEFAULT_PROMPT}
          formId={FORM_ID}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
