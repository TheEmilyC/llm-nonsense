"use server";

import { notFound, redirect } from "next/navigation";
import z from "zod";

import {
  createPersona,
  deletePersona,
  updatePersona,
} from "@/app/persona/data";
import { personaFormSchema } from "@/app/persona/validators";
import { ActionResponse } from "@/lib/types";
import { dbIdValidator } from "@/lib/validators";
import { refresh } from "next/cache";

export async function createPersonaAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<null>> {
  const imageFile = formData.get("image") as File | null;
  const formParseResult = personaFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    image: imageFile && imageFile.size > 0 ? imageFile : undefined,
  });
  if (!formParseResult.success) {
    console.error(z.prettifyError(formParseResult.error));
    return { success: false, message: "Malformed persona data" };
  }
  const { image, ...persona } = formParseResult.data;

  let newPersona;
  try {
    newPersona = await createPersona({ image, persona });
  } catch (err) {
    console.error(err);
    return { success: false, message: "Persona create failed" };
  }
  redirect(`/persona/${newPersona.id}`);
}

export async function updatePersonaAction(
  personaId: string,
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<null>> {
  const imageFile = formData.get("image") as File | null;
  const formParseResult = personaFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    image: imageFile && imageFile.size > 0 ? imageFile : undefined,
  });
  if (!formParseResult.success) {
    console.error(z.prettifyError(formParseResult.error));
    return { success: false, message: "Malformed persona data" };
  }
  const idParseResult = dbIdValidator.safeParse(personaId);
  if (!idParseResult.success) {
    console.error(z.prettifyError(idParseResult.error));
    return { success: false, message: "Malformed persona data" };
  }
  const id = idParseResult.data;
  const { image, ...update } = formParseResult.data;

  try {
    await updatePersona({ id, update, image });
    refresh();
    return { success: true, data: null };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Persona update failed" };
  }
}

export async function deletePersonaAction(
  prevState: unknown,
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
    return { success: false, message: "failed to delete persona" };
  }
  redirect("/persona");
}
