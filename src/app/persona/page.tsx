import { connection } from "next/server";
import { Suspense } from "react";

import { PersonaList } from "@/app/persona/_components/persona-list";
import { getPersonaListDto } from "@/app/persona/_lib/data";

export default function PersonaPage() {
  return (
    <Suspense>
      <PersonaPageContent />
    </Suspense>
  );
}

async function PersonaPageContent() {
  await connection();
  const personas = await getPersonaListDto();
  return <PersonaList personas={personas} />;
}
