import { notFound } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";
import { PersonaEdit } from "@/app/persona/_components/persona-edit";
import { getPersonaById } from "@/app/persona/_lib/data";

interface PersonaPageParams {
  params: Promise<{ id: string }>;
}

const personaEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

export default function PersonaEditPage({ params }: PersonaPageParams) {
  return (
    <Suspense>
      <PersonaEditPageContent params={params} />
    </Suspense>
  );
}

async function PersonaEditPageContent({ params }: PersonaPageParams) {
  const { id } = personaEditPageParamsSchema.parse(await params);
  const persona = await getPersonaById(id);
  if (!persona) notFound();

  return <PersonaEdit persona={persona} />;
}
