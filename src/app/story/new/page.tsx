import { getCharacterList } from "@/app/character/_lib/data";
import { getLorebook } from "@/app/lorebook/_lib/data";
import { toLorebookDto } from "@/app/lorebook/_lib/schema";
import { getPersonaList } from "@/app/persona/_lib/data";
import { StoryNew } from "@/app/story/_components/story-new";
import { buildCharacterImageUrl, buildPersonaImageUrl } from "@/lib/image";
import { dbIdValidator } from "@/lib/validators";
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

export default async function NewStoryPage({
  searchParams,
}: NewStoryPageParams) {
  const [characterList, personaList, lorebookResult, params] =
    await Promise.all([
      getCharacterList(),
      getPersonaList(),
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
  const { characterId, personaId, worldId } =
    newStoryParamsSchema.parse(params);
  const lorebook = toLorebookDto(lorebookResult);

  return (
    <StoryNew
      characters={characters}
      personas={personas}
      initialCharacterId={characterId}
      initialPersonaId={personaId}
      initialWorldId={worldId}
      currentLorebook={lorebook}
    />
  );
}
