import { connection } from "next/server";
import { Suspense } from "react";
import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";
import { getCharacterListDto } from "@/app/character/_lib/data";
import { getLorebookEntityDtoList } from "@/app/lorebook/_lib/data";
import { getPersonaListDto } from "@/app/persona/_lib/data";
import { getPromptListDto } from "@/app/prompt/_lib/data";
import { StoryNew } from "@/app/story/_components/story-new";
import { getWorldListDto } from "@/app/world/_lib/data";

type NewStoryPageParams = {
  searchParams: Promise<{
    characterId?: string;
    personaId?: string;
    worldId?: string;
  }>;
};

const newStoryParamsSchema = z.object({
  characterId: dbIdValidator.optional(),
  personaId: dbIdValidator.optional(),
  worldId: dbIdValidator.optional(),
});

export default function NewStoryPage({ searchParams }: NewStoryPageParams) {
  return (
    <Suspense>
      <NewStoryPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewStoryPageContent({ searchParams }: NewStoryPageParams) {
  await connection();
  const [characters, personas, worlds, lorebookResult, promptResult, params] =
    await Promise.all([
      getCharacterListDto(),
      getPersonaListDto(),
      getWorldListDto(),
      getLorebookEntityDtoList(),
      getPromptListDto(),
      searchParams,
    ]);

  const lorebooks = lorebookResult.map((lb) => ({
    label: lb.name,
    value: lb.id,
  }));
  const prompts = promptResult.map((pmt) => ({
    label: pmt.name,
    value: pmt.id,
  }));

  const { characterId, personaId, worldId } =
    newStoryParamsSchema.parse(params);

  return (
    <StoryNew
      characters={characters}
      initialCharacterId={characterId}
      initialPersonaId={personaId}
      initialWorldId={worldId}
      lorebooks={lorebooks}
      personas={personas}
      prompts={prompts}
      worlds={worlds}
    />
  );
}
