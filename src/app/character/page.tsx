import { CharacterList } from "@/app/character/_components/character-list";
import { getCharacterListDto } from "@/app/character/_lib/data";

export default async function CharactersPage() {
  const characters = await getCharacterListDto();
  return <CharacterList characters={characters} />;
}
