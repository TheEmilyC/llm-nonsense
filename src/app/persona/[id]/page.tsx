import z from "zod";

import { PersonaEdit } from "@/app/persona/_components/persona-edit";
import { getPersonaById } from "@/app/persona/_lib/data";
import { toPersonaDto } from "@/app/persona/_lib/schema";
import { dbIdValidator } from "@/lib/validators";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PersonaPageParams {
  params: Promise<{ id: string }>;
}

const personaEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

async function PersonaEditPageContent({ params }: PersonaPageParams) {
  const { id } = personaEditPageParamsSchema.parse(await params);
  const persona = await getPersonaById(id);
  if (!persona) notFound();

  return <PersonaEdit persona={toPersonaDto(persona)} />;
}

export default function PersonaEditPage({ params }: PersonaPageParams) {
  return (
    <Suspense>
      <PersonaEditPageContent params={params} />
    </Suspense>
  );
}
