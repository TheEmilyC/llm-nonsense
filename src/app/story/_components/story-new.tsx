"use client";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { StoryForm } from "@/app/story/_components/story-form";
import { useCreateStory } from "@/app/story/_lib/hooks";
import { StoryFormValues } from "@/app/story/_lib/schema";
import { CardOption } from "@/components/card-selector";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-story";

interface StoryNewParams {
  characters: CardOption[];
  initialCharacterId?: string;
  initialPersonaId?: string;
  initialWorldId?: string;
  lorebooks: { label: string; value: string }[];
  personas: CardOption[];
  prompts: { label: string; value: string }[];
  worlds?: CardOption[];
}

export function StoryNew({
  characters,
  initialCharacterId,
  initialPersonaId,
  lorebooks,
  personas,
  prompts,
  worlds,
}: StoryNewParams) {
  const { createStory, isPending } = useCreateStory();

  async function onSubmitHandler(
    data: StoryFormValues,
    setError: UseFormSetError<StoryFormValues>,
  ) {
    const result = await createStory(data);
    if (!result.success && result.error.details) {
      for (const [field, messages] of Object.entries(result.error.details)) {
        setError(field as keyof StoryFormValues, {
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
        backLinkDestination="/story"
        backLinkLabel="Stories"
        pageTitle="New Story"
      >
        <Button disabled={isPending} form={FORM_ID} size="sm" type="submit">
          {isPending ? "Starting…" : "Begin"}
        </Button>
      </Header>

      <Content>
        <StoryForm
          characters={characters}
          defaultValues={{
            characterId: initialCharacterId,
            personaId: initialPersonaId,
          }}
          formId={FORM_ID}
          lorebooks={lorebooks}
          onSubmit={onSubmitHandler}
          personas={personas}
          prompts={prompts}
          worlds={worlds}
        />
      </Content>
    </div>
  );
}
