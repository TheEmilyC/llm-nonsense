"use server";

import { notFound } from "next/navigation";
import z from "zod";

import {
  createPersona,
  deletePersona,
  updatePersona,
} from "@/app/persona/data";
import {
  PersonaDto,
  personaFormSchema,
  PersonaFormValues,
  toPersonaDto,
} from "@/app/persona/schema";
import { ActionResponse } from "@/lib/action-utils";
import { dbIdValidator } from "@/lib/validators";
import { refresh } from "next/cache";

export async function createPersonaAction(
  data: PersonaFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const formParseResult = personaFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(z.prettifyError(formParseResult.error));
    return { success: false, error: "Malformed persona data" };
  }
  const { image, ...persona } = formParseResult.data;

  let newPersona;
  try {
    newPersona = await createPersona({ image, persona });
  } catch (err) {
    console.error(err);
    return { success: false, error: "Persona create failed" };
  }
  return { success: true, data: { id: newPersona.id } };
}

export async function updatePersonaAction(
  personaId: string,
  data: PersonaFormValues,
): Promise<ActionResponse<PersonaDto>> {
  const formParseResult = personaFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(z.prettifyError(formParseResult.error));
    return { success: false, error: "Malformed persona data" };
  }
  const idParseResult = dbIdValidator.safeParse(personaId);
  if (!idParseResult.success) {
    console.error(z.prettifyError(idParseResult.error));
    return { success: false, error: "Malformed persona data" };
  }
  const id = idParseResult.data;
  const { image, ...update } = formParseResult.data;

  try {
    const updated = await updatePersona({ id, update, image });
    refresh();
    return { success: true, data: toPersonaDto(updated) };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Persona update failed" };
  }
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
    return { success: false, error: "failed to delete persona" };
  }
  return { success: true, data: null };
}
