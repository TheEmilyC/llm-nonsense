import { connection } from "next/server";
import { Suspense } from "react";

import { CharacterList } from "@/app/character/_components/character-list";
import { getCharacterListDto } from "@/app/character/_lib/data";

export default function CharactersPage() {
  return (
    <Suspense>
      <CharactersPageContent />
    </Suspense>
  );
}

async function CharactersPageContent() {
  await connection();
  const characters = await getCharacterListDto();
  return <CharacterList characters={characters} />;
}
