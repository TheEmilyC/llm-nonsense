"use server";

import { redirect } from "next/navigation";
import z from "zod";

import { createPersona } from "@/app/persona/data";
import { personaFormSchema } from "@/app/persona/validators";
import { ActionResponse } from "@/lib/types";

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
