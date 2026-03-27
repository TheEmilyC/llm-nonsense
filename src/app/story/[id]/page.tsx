import { getCharacterList } from "@/app/character/_lib/data";
import { getLorebook } from "@/app/lorebook/_lib/data";
import { toLorebookDto } from "@/app/lorebook/_lib/schema";
import { getPersonaList } from "@/app/persona/_lib/data";
import { StoryEdit } from "@/app/story/_components/story-edit";
import { getStoryById } from "@/app/story/_lib/data";
import { buildCharacterImageUrl, buildPersonaImageUrl } from "@/lib/image";
import { dbIdValidator } from "@/lib/validators";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

interface StoryPageParams {
  params: Promise<{ id: string }>;
}

const storyPageParamsSchema = z.object({
  id: dbIdValidator,
});

async function StoryPageContent({ params }: StoryPageParams) {
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

export default function StoryPage({ params }: StoryPageParams) {
  return (
    <Suspense>
      <StoryPageContent params={params} />
    </Suspense>
  );
}
