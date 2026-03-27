import { Suspense } from "react";
import z from "zod";

import { CharacterEdit } from "@/app/character/_components/character-edit";
import { getCharacterById } from "@/app/character/_lib/data";
import { toCharacterDto } from "@/app/character/_lib/schema";
import { dbIdValidator } from "@/lib/validators";
import { notFound } from "next/navigation";

interface CharacterPageParams {
  params: Promise<{ id: string }>;
}

const characterEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

async function CharacterPageContent({ params }: CharacterPageParams) {
  const { id } = characterEditPageParamsSchema.parse(await params);
  const characterRecord = await getCharacterById(id);
  if (!characterRecord) notFound();
  const character = toCharacterDto(characterRecord);
  return <CharacterEdit character={character} />;
}

export default function CharacterPage({ params }: CharacterPageParams) {
  return (
    <Suspense>
      <CharacterPageContent params={params} />
    </Suspense>
  );
}
