import { getCharacterList } from "@/app/character/data";
import { getLorebook } from "@/app/lorebook/data";
import { toLorebookDto } from "@/app/lorebook/schema";
import { getPersonaList } from "@/app/persona/data";
import { StoryEdit } from "@/app/story/_components/story-edit";
import { getStoryById } from "@/app/story/data";
import { buildCharacterImageUrl, buildPersonaImageUrl } from "@/lib/image";
import { dbIdValidator } from "@/lib/validators";
import { notFound } from "next/navigation";
import z from "zod";

interface StoryPageParams {
  params: Promise<{ id: string }>;
}

const storyPageParamsSchema = z.object({
  id: dbIdValidator,
});

export default async function StoryPage({ params }: StoryPageParams) {
  const [characterList, personaList, lorebookResult, routeParams] =
    await Promise.all([
      getCharacterList(),
      getPersonaList(),
      getLorebook(),
      params,
    ]);
  const { id } = storyPageParamsSchema.parse(routeParams);
  const story = await getStoryById(id);
  if (!story) notFound();

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
  const lorebook = toLorebookDto(lorebookResult);

  return (
    <StoryEdit
      story={story}
      characters={characters}
      personas={personas}
      currentLorebook={lorebook}
    />
  );
}
