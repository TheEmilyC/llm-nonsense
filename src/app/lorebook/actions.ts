"use server";

import { createLorebookIndex, getLorebook } from "@/app/lorebook/data";
import {
  initializeLorebookFormSchema,
  InitializeLorebookFormValues,
  LorebookDto,
  toLorebookDto,
} from "@/app/lorebook/schema";

export async function initializeLorebookAction(
  data: InitializeLorebookFormValues,
) {
  const parseResult = initializeLorebookFormSchema.safeParse(data);
  if (!parseResult.success) {
    return { success: false, message: parseResult.error.issues[0].message };
  }

  try {
    await createLorebookIndex({ lorebook: { name: parseResult.data.name } });
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to initialize lorebook" };
  }

  try {
    const lorebook = await getLorebook();
    return { success: true, data: lorebook };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "Lorebook initialized but failed to fetch status",
    };
  }
}

export async function getLorebookAction(): Promise<LorebookDto> {
  const lorebook = await getLorebook();
  return toLorebookDto(lorebook);
}
