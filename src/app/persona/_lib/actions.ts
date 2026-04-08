"use server";

import { notFound } from "next/navigation";

import {
  createPersona,
  deletePersona,
  updatePersona,
} from "@/app/persona/_lib/data";
import {
  PersonaDto,
  personaFormSchema,
  PersonaFormValues,
  toPersonaDto,
} from "@/app/persona/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";
import { dbIdValidator } from "@/lib/validators";

export async function createPersonaAction(
  data: PersonaFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const formParseResult = personaFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(formParseResult.error);
    return { error: "Malformed persona data", success: false };
  }
  const { image, ...persona } = formParseResult.data;

  let newPersona;
  try {
    newPersona = await createPersona({ image, persona });
  } catch (err) {
    console.error(err);
    return { error: "Persona create failed", success: false };
  }
  return { data: { id: newPersona.id }, success: true };
}

export async function deletePersonaAction(
  personaId: string,
): Promise<ActionResponse<null>> {
  const idParseResult = dbIdValidator.safeParse(personaId);
  if (!idParseResult.success) {
    notFound();
  }
  const id = idParseResult.data;
  try {
    await deletePersona(id);
  } catch (err) {
    console.error(err);
    return { error: "failed to delete persona", success: false };
  }
  return { data: null, success: true };
}

export async function updatePersonaAction(
  personaId: string,
  data: PersonaFormValues,
): Promise<ActionResponse<PersonaDto>> {
  const formParseResult = personaFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(formParseResult.error);
    return { error: "Malformed persona data", success: false };
  }
  const idParseResult = dbIdValidator.safeParse(personaId);
  if (!idParseResult.success) {
    console.error(idParseResult.error);
    return { error: "Malformed persona data", success: false };
  }
  const id = idParseResult.data;
  const { image, ...update } = formParseResult.data;

  try {
    const updated = await updatePersona({ id, image, update });
    return { data: toPersonaDto(updated), success: true };
  } catch (err) {
    console.error(err);
    return { error: "Persona update failed", success: false };
  }
}
