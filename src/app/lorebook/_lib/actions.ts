"use server";

import {
  createLorebookDb,
  createLorebookIndex,
  deleteLorebookDb,
  getLorebook,
  updateLorebookDb,
} from "@/app/lorebook/_lib/data";
import {
  initializeLorebookFormSchema,
  InitializeLorebookFormValues,
  LorebookDbDto,
  lorebookDbDtoSchema,
  lorebookDbFormSchema,
  LorebookDbFormValues,
  LorebookDto,
  toLorebookDto,
} from "@/app/lorebook/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";
import { LOREBOOK_TAG } from "@/lib/env-variables";
import { dbIdValidator } from "@/lib/validators";
import { revalidateTag } from "next/cache";
import { notFound } from "next/navigation";

export async function createLorebookAction(
  data: LorebookDbFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const parseResult = lorebookDbFormSchema.safeParse(data);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { success: false, error: "Malformed lorebook data" };
  }
  try {
    const entity = await createLorebookDb(parseResult.data);
    return { success: true, data: { id: entity.id } };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Lorebook create failed" };
  }
}

export async function updateLorebookAction(
  lorebookId: string,
  data: LorebookDbFormValues,
): Promise<ActionResponse<LorebookDbDto>> {
  const idResult = dbIdValidator.safeParse(lorebookId);
  if (!idResult.success)
    return { success: false, error: "Invalid lorebook ID" };

  const parseResult = lorebookDbFormSchema.safeParse(data);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { success: false, error: "Malformed lorebook data" };
  }
  try {
    const entity = await updateLorebookDb(idResult.data, parseResult.data);
    return { success: true, data: lorebookDbDtoSchema.parse(entity) };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Lorebook update failed" };
  }
}

export async function deleteLorebookAction(
  lorebookId: string,
): Promise<ActionResponse<null>> {
  const idResult = dbIdValidator.safeParse(lorebookId);
  if (!idResult.success) notFound();
  try {
    await deleteLorebookDb(idResult.data);
    return { success: true, data: null };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Lorebook delete failed" };
  }
}

export async function initializeLorebookAction(
  data: InitializeLorebookFormValues,
): Promise<ActionResponse<LorebookDto>> {
  const parseResult = initializeLorebookFormSchema.safeParse(data);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0].message };
  }

  try {
    await createLorebookIndex({ lorebook: { name: parseResult.data.name } });
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to initialize lorebook" };
  }

  try {
    const lorebook = await getLorebook();
    return { success: true, data: lorebook };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: "Lorebook initialized but failed to fetch status",
    };
  }
}

export async function getLorebookAction(
  isRetry?: boolean,
): Promise<ActionResponse<LorebookDto>> {
  if (isRetry) revalidateTag(LOREBOOK_TAG, "max");
  try {
    const lorebook = await getLorebook();
    return { success: true, data: toLorebookDto(lorebook) };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to fetch lorebook" };
  }
}
