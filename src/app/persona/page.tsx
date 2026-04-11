import { PersonaList } from "@/app/persona/_components/persona-list";
import { getPersonaList } from "@/app/persona/_lib/data";

export default async function PersonaPage() {
  const personas = await getPersonaList();
  return <PersonaList personas={personas} />;
}
