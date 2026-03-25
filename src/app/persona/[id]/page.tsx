import z from "zod";

import { PersonaEdit } from "@/app/persona/_components/persona-edit";
import { getPersonaById } from "@/app/persona/data";
import { toPersonaDto } from "@/app/persona/schema";
import { dbIdValidator } from "@/lib/validators";
import { notFound } from "next/navigation";

interface PersonaPageParams {
  params: Promise<{ id: string }>;
}

const personaEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

export default async function PersonaEditPage({ params }: PersonaPageParams) {
  const { id } = personaEditPageParamsSchema.parse(await params);
  const persona = await getPersonaById(id);
  if (!persona) notFound();

  return <PersonaEdit persona={toPersonaDto(persona)} />;
}
