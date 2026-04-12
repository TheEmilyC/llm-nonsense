import { notFound } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";
import { CharacterEdit } from "@/app/character/_components/character-edit";
import { getCharacterById } from "@/app/character/_lib/data";

interface CharacterPageParams {
  params: Promise<{ id: string }>;
}

const characterEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

export default function CharacterPage({ params }: CharacterPageParams) {
  return (
    <Suspense>
      <CharacterPageContent params={params} />
    </Suspense>
  );
}

async function CharacterPageContent({ params }: CharacterPageParams) {
  const { id } = characterEditPageParamsSchema.parse(await params);
  const character = await getCharacterById(id);
  if (!character) notFound();
  return <CharacterEdit character={character} />;
}
