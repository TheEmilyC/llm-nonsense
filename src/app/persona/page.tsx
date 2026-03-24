import { PersonaList } from "@/app/persona/_components/persona-list";
import { getPersonaList } from "@/app/persona/data";
import { buildPersonaImageUrl } from "@/lib/image";

export default async function PersonaPage() {
  const personas = (await getPersonaList()).map((per) => ({
    id: per.id,
    name: per.name,
    imageUrl: buildPersonaImageUrl({ id: per.id, imgHash: per.imageHash }),
  }));
  return <PersonaList personas={personas} />;
}
