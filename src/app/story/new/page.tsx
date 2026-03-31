import { getCharacterList } from "@/app/character/_lib/data";
import { getLorebook } from "@/app/lorebook/_lib/data";
import { toLorebookDto } from "@/app/lorebook/_lib/schema";
import { getPersonaList } from "@/app/persona/_lib/data";
import { StoryNew } from "@/app/story/_components/story-new";
import { getWorldList } from "@/app/world/_lib/data";
import {
  buildCharacterImageUrl,
  buildPersonaImageUrl,
  buildWorldImageUrl,
} from "@/lib/image";
import { dbIdValidator } from "@/lib/validators";
import { Suspense } from "react";
import z from "zod";

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

async function NewStoryPageContent({ searchParams }: NewStoryPageParams) {
  const [characterList, personaList, worldList, lorebookResult, params] =
    await Promise.all([
      getCharacterList(),
      getPersonaList(),
      getWorldList(),
      getLorebook(),
      searchParams,
    ]);

  const characters = characterList.map((char) => ({
    id: char.id,
    name: char.name,
    imageUrl: buildCharacterImageUrl({ id: char.id, pngHash: char.pngHash }),
  }));
  const personas = personaList.map((per) => ({
    id: per.id,
    name: per.name,
    imageUrl: buildPersonaImageUrl({ id: per.id, imgHash: per.imageHash }),
  }));
  const worlds = worldList.map((wrd) => ({
    id: wrd.id,
    name: wrd.name,
    imageUrl: buildWorldImageUrl({ id: wrd.id, imgHash: wrd.imageHash }),
  }));

  const { characterId, personaId, worldId } =
    newStoryParamsSchema.parse(params);
  const lorebook = toLorebookDto(lorebookResult);

  return (
    <StoryNew
      characters={characters}
      personas={personas}
      worlds={worlds}
      initialCharacterId={characterId}
      initialPersonaId={personaId}
      initialWorldId={worldId}
      currentLorebook={lorebook}
    />
  );
}

export default function NewStoryPage({ searchParams }: NewStoryPageParams) {
  return (
    <Suspense>
      <NewStoryPageContent searchParams={searchParams} />
    </Suspense>
  );
}
