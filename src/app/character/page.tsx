import { getCharacterList } from "@/data/character";

export default async function CharactersPage() {
  const characters = await getCharacterList();
  return <CharacterList characters={characters} />;
}
