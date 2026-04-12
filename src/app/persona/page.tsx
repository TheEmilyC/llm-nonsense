import { PersonaList } from "@/app/persona/_components/persona-list";
import { getPersonaListDto } from "@/app/persona/_lib/data";

export default async function PersonaPage() {
  const personas = await getPersonaListDto();
  return <PersonaList personas={personas} />;
}
