"use server";

import { createLorebookIndex, getLorebook } from "@/app/lorebook/_lib/data";
import {
  initializeLorebookFormSchema,
  InitializeLorebookFormValues,
  LorebookDto,
  toLorebookDto,
} from "@/app/lorebook/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";
import { LOREBOOK_TAG } from "@/lib/env-variables";
import { revalidateTag } from "next/cache";

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
