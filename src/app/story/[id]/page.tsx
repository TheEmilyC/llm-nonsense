import { notFound } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

import { getCharacterList } from "@/app/character/_lib/data";
import { getChatsForStory } from "@/app/chat/_lib/data";
import { getLorebookEntityList } from "@/app/lorebook/_lib/data";
import { getPersonaList } from "@/app/persona/_lib/data";
import { getPromptList } from "@/app/prompt/_lib/data";
import { StoryEdit } from "@/app/story/_components/story-edit";
import { getStoryById } from "@/app/story/_lib/data";
import { getWorldList } from "@/app/world/_lib/data";
import {
  buildCharacterImageUrl,
  buildPersonaImageUrl,
  buildWorldImageUrl,
} from "@/lib/image";
import { dbIdValidator } from "@/lib/validators";

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
    characterList,
    personaList,
    worldList,
    lorebookResult,
    promptResult,
    routeParams,
  ] = await Promise.all([
    getCharacterList(),
    getPersonaList(),
    getWorldList(),
    getLorebookEntityList(),
    getPromptList(),
    params,
  ]);
  const { id } = storyPageParamsSchema.parse(routeParams);
  const [story, chats] = await Promise.all([
    getStoryById(id),
    getChatsForStory(id),
  ]);
  if (!story) notFound();

  const characters = characterList.map((char) => ({
    id: char.id,
    imageUrl: buildCharacterImageUrl({ id: char.id, pngHash: char.pngHash }),
    name: char.name,
  }));
  const personas = personaList.map((per) => ({
    id: per.id,
    imageUrl: buildPersonaImageUrl({ id: per.id, imgHash: per.imageHash }),
    name: per.name,
  }));
  const worlds = worldList.map((wrd) => ({
    id: wrd.id,
    imageUrl: buildWorldImageUrl({ id: wrd.id, imgHash: wrd.imageHash }),
    name: wrd.name,
  }));
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
