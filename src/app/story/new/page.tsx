import { Suspense } from "react";
import z from "zod";

import { getCharacterList } from "@/app/character/_lib/data";
import { getLorebookEntityList } from "@/app/lorebook/_lib/data";
import { getPersonaList } from "@/app/persona/_lib/data";
import { StoryNew } from "@/app/story/_components/story-new";
import { getWorldList } from "@/app/world/_lib/data";
import {
  buildCharacterImageUrl,
  buildPersonaImageUrl,
  buildWorldImageUrl,
} from "@/lib/image";
import { dbIdValidator } from "@/lib/validators";

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
  const [characterList, personaList, worldList, lorebookResult, params] =
    await Promise.all([
      getCharacterList(),
      getPersonaList(),
      getWorldList(),
      getLorebookEntityList(),
      searchParams,
    ]);

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
      worlds={worlds}
    />
  );
}
