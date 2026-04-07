"use client";

import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const { createStory, error, isPending } = useCreateStory();

  async function onSubmitHandler(data: StoryFormValues) {
    const { newStoryId } = await createStory(data);
    router.push(`/story/${newStoryId}`);
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
        {error && <p className="text-destructive">{error}</p>}
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
