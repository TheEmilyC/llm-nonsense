"use client";

import { LorebookDto } from "@/app/lorebook/_lib/schema";
import { StoryForm } from "@/app/story/_components/story-form";
import { useCreateStory } from "@/app/story/_lib/hooks";
import { StoryFormValues } from "@/app/story/_lib/schema";
import { CardOption } from "@/components/card-selector";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const FORM_ID = "form-new-story";

interface StoryNewParams {
  characters: CardOption[];
  personas: CardOption[];
  worlds?: CardOption[];
  initialCharacterId?: string;
  initialPersonaId?: string;
  initialWorldId?: string;
  currentLorebook: LorebookDto;
}

export function StoryNew({
  characters,
  personas,
  worlds,
  initialCharacterId,
  initialPersonaId,
  currentLorebook,
}: StoryNewParams) {
  const router = useRouter();
  const { createStory, isPending, error } = useCreateStory();

  async function onSubmitHandler(data: StoryFormValues) {
    const { newStoryId } = await createStory(data);
    router.push(`/story/${newStoryId}`);
  }

  return (
    <div>
      <Header
        pageTitle="New Story"
        backLinkDestination="/story"
        backLinkLabel="Stories"
      >
        <Button size="sm" type="submit" form={FORM_ID} disabled={isPending}>
          {isPending ? "Starting…" : "Begin"}
        </Button>
      </Header>

      <Content>
        {error && <p className="text-destructive">{error}</p>}
        <StoryForm
          formId={FORM_ID}
          characters={characters}
          personas={personas}
          worlds={worlds}
          onSubmit={onSubmitHandler}
          defaultValues={{
            characterId: initialCharacterId,
            personaId: initialPersonaId,
          }}
          currentLorebook={currentLorebook}
        />
      </Content>
    </div>
  );
}
