import { PersonaList } from "@/app/persona/_components/persona-list";
import { getPersonaList } from "@/app/persona/_lib/data";
import { buildPersonaImageUrl } from "@/lib/image";

export default async function PersonaPage() {
  const personas = (await getPersonaList()).map((per) => ({
    id: per.id,
    imageUrl: buildPersonaImageUrl({ id: per.id, imgHash: per.imageHash }),
    name: per.name,
  }));
  return <PersonaList personas={personas} />;
}
