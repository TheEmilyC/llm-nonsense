import { notFound } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";
import { getCharacterList } from "@/app/character/_lib/data";
import { getChatsForStory } from "@/app/chat/_lib/data";
import { getLorebookEntityDtoList } from "@/app/lorebook/_lib/data";
import { getPersonaList } from "@/app/persona/_lib/data";
import { getPromptList } from "@/app/prompt/_lib/data";
import { StoryEdit } from "@/app/story/_components/story-edit";
import { getStoryById } from "@/app/story/_lib/data";
import { getWorldList } from "@/app/world/_lib/data";

interface StoryPageParams {
  params: Promise<{ id: string }>;
}

const storyPageParamsSchema = z.object({
  id: dbIdValidator,
});

export default function StoryPage({ params }: StoryPageParams) {
  return (
    <Suspense>
      <StoryPageContent params={params} />
    </Suspense>
  );
}

async function StoryPageContent({ params }: StoryPageParams) {
  const [
    characters,
    personas,
    worlds,
    lorebookResult,
    promptResult,
    routeParams,
  ] = await Promise.all([
    getCharacterList(),
    getPersonaList(),
    getWorldList(),
    getLorebookEntityDtoList(),
    getPromptList(),
    params,
  ]);
  const { id } = storyPageParamsSchema.parse(routeParams);
  const [story, chats] = await Promise.all([
    getStoryById(id),
    getChatsForStory(id),
  ]);
  if (!story) notFound();

  const lorebooks = lorebookResult.map((lb) => ({
    label: lb.name,
    value: lb.id,
  }));
  const prompts = promptResult.map((pmt) => ({
    label: pmt.name,
    value: pmt.id,
  }));

  return (
    <StoryEdit
      characters={characters}
      chats={chats}
      lorebooks={lorebooks}
      personas={personas}
      prompts={prompts}
      story={story}
      worlds={worlds}
    />
  );
}
