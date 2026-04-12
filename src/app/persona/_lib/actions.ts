"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { dbIdValidator } from "@/app/_shared/schema";
import {
  createPersona,
  deletePersona,
  updatePersona,
} from "@/app/persona/_lib/data";
import {
  PERSONA_CACHE_KEY,
  PersonaEntity,
  personaFormSchema,
  PersonaFormValues,
  UpdatePersonaActionParams,
  updatePersonaActionParamsSchema,
} from "@/app/persona/_lib/schema";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { logger, parseError } from "@/lib/logger";

export async function createPersonaAction(
  data: PersonaFormValues,
): Promise<ActionResponse> {
  const formParseResult = personaFormSchema.safeParse(data);
  if (!formParseResult.success)
    return toActionResponseError(formParseResult.data);

  const { image, ...persona } = formParseResult.data;

  let newPersona: PersonaEntity;
  try {
    newPersona = await createPersona({ image, persona });
  } catch (err) {
    logger.error("Failed to create persona", parseError(err));
    return toActionResponseError(err);
  }
  logger.info("New person created", { id: newPersona.id });

  updateTag(PERSONA_CACHE_KEY);
  redirect(`/persona/${newPersona.id}`);
}

export async function deletePersonaAction(
  personaId: string,
): Promise<ActionResponse> {
  const idParseResult = dbIdValidator.safeParse(personaId);
  if (!idParseResult.success) return toActionResponseError(idParseResult.error);

  const id = idParseResult.data;
  try {
    await deletePersona(id);
  } catch (err) {
    logger.error("Failed to delete persona", { id, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("Persona deleted", { id });

  updateTag(PERSONA_CACHE_KEY);
  updateTag(`${PERSONA_CACHE_KEY}-${id}`);
  redirect("/persona");
}

export async function updatePersonaAction(
  params: UpdatePersonaActionParams,
): Promise<ActionResponse> {
  const parseResult = updatePersonaActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { id, update } = parseResult.data;

  try {
    await updatePersona({ id, update });
  } catch (err) {
    logger.error("Failed to update persona", {
      id: id,
      update: update,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
  logger.info("Persona updated", { id });

  updateTag(PERSONA_CACHE_KEY);
  updateTag(`${PERSONA_CACHE_KEY}-${id}`);
  return { success: true };
}
