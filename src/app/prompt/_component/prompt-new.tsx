"use client";

import { useRouter } from "next/navigation";

import { PromptForm } from "@/app/prompt/_component/prompt-form";
import { useCreatePrompt } from "@/app/prompt/_lib/hooks";
import {
  PromptFormValues,
  PromptFragmentType,
  PromptInjectTag,
} from "@/app/prompt/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-prompt";

const DEFAULT_PROMPT: PromptFormValues = {
  maxTokens: 80000,
  name: "",
  promptFragments: [
    {
      content:
        "Write {{char}}'s next reply in a fictional chat between {{char}} and {{user}}.",
      enabled: true,
      name: "Main Prompt",
      role: "system",
      type: PromptFragmentType.content,
    },
    {
      content: "<{{char}}>",
      enabled: true,
      name: "<Character>",
      role: "system",
      type: PromptFragmentType.content,
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.characterDescription,
      name: "Character Description",
      role: "system",
      type: PromptFragmentType.inject,
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.characterPersonality,
      name: "Character Personality",
      role: "system",
      type: PromptFragmentType.inject,
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.characterScenario,
      name: "Character Scenario",
      role: "system",
      type: PromptFragmentType.inject,
    },
    {
      content: "</{{char}}>",
      enabled: true,
      name: "</Character>",
      role: "system",
      type: PromptFragmentType.content,
    },
    {
      content: "<{{user}}>",
      enabled: true,
      name: "<User>",
      role: "system",
      type: PromptFragmentType.content,
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.personaDescription,
      name: "Persona Description",
      role: "system",
      type: PromptFragmentType.inject,
    },
    {
      content: "</{{user}}>",
      enabled: true,
      name: "</User>",
      role: "system",
      type: PromptFragmentType.content,
    },
    {
      content: "<{{world}}>",
      enabled: true,
      name: "<World>",
      role: "system",
      type: PromptFragmentType.content,
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.worldDescription,
      name: "World Description",
      role: "system",
      type: PromptFragmentType.inject,
    },
    {
      content: "</{{world}}>",
      enabled: true,
      name: "</World>",
      role: "system",
      type: PromptFragmentType.content,
    },
    {
      content: "<lore>",
      enabled: true,
      name: "<lore>",
      role: "system",
      type: PromptFragmentType.content,
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.lorebook,
      name: "Lorebook",
      role: "system",
      type: PromptFragmentType.inject,
    },
    {
      content: "</lore>",
      enabled: true,
      name: "</lore>",
      role: "system",
      type: PromptFragmentType.content,
    },
    {
      enabled: true,
      name: "Chat History",
      type: PromptFragmentType.chatHistory,
    },
    {
      enabled: true,
      injectTag: PromptInjectTag.lastMessage,
      name: "Last Message",
      role: "user",
      type: PromptFragmentType.inject,
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
