"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { PromptForm } from "@/app/prompt/_component/prompt-form";
import { useCreatePrompt } from "@/app/prompt/_lib/hooks";
import { PromptFormValues } from "@/app/prompt/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-prompt";

const DEFAULT_PROMPT: PromptFormValues = {
  maxOutputTokens: 0,
  maxSteps: 20,
  maxTokens: 80000,
  name: "",
  prefetch: false,
  promptFragments: [
    {
      content:
        "Write {{char}}'s next reply in a fictional chat between {{char}} and {{user}}.",
      enabled: true,
      name: "Main Prompt",
      role: "system",
      type: "CONTENT",
    },
    {
      content: "<{{char}}>",
      enabled: true,
      name: "<Character>",
      role: "system",
      type: "CONTENT",
    },
    {
      enabled: true,
      injectTag: "CHARACTER_DESCRIPTION",
      name: "Character Description",
      role: "system",
      type: "INJECT",
    },
    {
      enabled: true,
      injectTag: "CHARACTER_PERSONALITY",
      name: "Character Personality",
      role: "system",
      type: "INJECT",
    },
    {
      enabled: true,
      injectTag: "CHARACTER_SCENARIO",
      name: "Character Scenario",
      role: "system",
      type: "INJECT",
    },
    {
      content: "</{{char}}>",
      enabled: true,
      name: "</Character>",
      role: "system",
      type: "CONTENT",
    },
    {
      content: "<{{user}}>",
      enabled: true,
      name: "<User>",
      role: "system",
      type: "CONTENT",
    },
    {
      enabled: true,
      injectTag: "PERSONA_DESCRIPTION",
      name: "Persona Description",
      role: "system",
      type: "INJECT",
    },
    {
      content: "</{{user}}>",
      enabled: true,
      name: "</User>",
      role: "system",
      type: "CONTENT",
    },
    {
      content: "<{{world}}>",
      enabled: true,
      name: "<World>",
      role: "system",
      type: "CONTENT",
    },
    {
      enabled: true,
      injectTag: "WORLD_DESCRIPTION",
      name: "World Description",
      role: "system",
      type: "INJECT",
    },
    {
      content: "</{{world}}>",
      enabled: true,
      name: "</World>",
      role: "system",
      type: "CONTENT",
    },
    {
      content: "<lore>",
      enabled: true,
      name: "<lore>",
      role: "system",
      type: "CONTENT",
    },
    {
      enabled: true,
      injectTag: "LOREBOOK_CONTEXT",
      name: "Lorebook Context",
      role: "system",
      type: "INJECT",
    },
    {
      enabled: true,
      injectTag: "LOREBOOK_CONSTANT",
      name: "Lorebook Constants",
      role: "system",
      type: "INJECT",
    },
    {
      enabled: true,
      injectTag: "LOREBOOK_ENTRIES",
      name: "Lorebook Entries",
      role: "system",
      type: "INJECT",
    },
    {
      enabled: true,
      injectTag: "LOREBOOK_MEMORIES",
      name: "Lorebook Memories",
      role: "system",
      type: "INJECT",
    },
    {
      enabled: true,
      injectTag: "GENERATED_FACTS",
      name: "Generated Facts",
      role: "system",
      type: "INJECT",
    },
    {
      content: "</lore>",
      enabled: true,
      name: "</lore>",
      role: "system",
      type: "CONTENT",
    },
    {
      enabled: true,
      name: "Chat History",
      type: "CHAT_HISTORY",
    },
    {
      enabled: true,
      injectTag: "LAST_MESSAGE",
      name: "Last Message",
      role: "user",
      type: "INJECT",
    },
  ],
  promptRegexes: [],
  temperature: 0.9,
  topK: 64,
  topP: 0.95,
};

export function PromptNew() {
  const { createPrompt, isPending } = useCreatePrompt();

  async function onSubmitHandler(
    data: PromptFormValues,
    setError: UseFormSetError<PromptFormValues>,
  ) {
    const result = await createPrompt(data);
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
