import { CharacterList } from "@/app/character/_components/character-list";
import { getCharacterList } from "@/app/character/_lib/data";

export default async function CharactersPage() {
  const characters = await getCharacterList();
  return <CharacterList characters={characters} />;
}
