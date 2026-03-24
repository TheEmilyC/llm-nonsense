import z from "zod";

import { CharacterEdit } from "@/app/character/_components/character-edit";
import { getCharacterById } from "@/app/character/data";
import { buildCharacterImageUrl } from "@/lib/image";
import { dbIdValidator } from "@/lib/validators";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

const characterEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

export default async function CharacterPage({ params }: Props) {
  const { id } = characterEditPageParamsSchema.parse(await params);
  const characterRecord = await getCharacterById(id);
  if (!characterRecord) notFound();
  const character = {
    ...characterRecord.card,
    id,
    imageUrl: buildCharacterImageUrl({
      id: characterRecord.entity.id,
      pngHash: characterRecord.entity.pngHash,
    }),
  };
  return <CharacterEdit character={character} />;
}
