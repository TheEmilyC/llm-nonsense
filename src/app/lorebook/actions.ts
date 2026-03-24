"use server";

import { createLorebookIndex, getLorebook } from "@/app/lorebook/data";
import { initializeLorebookFormSchema, Lorebook } from "@/app/lorebook/schema";
import { ActionResponse } from "@/lib/action-utils";

export async function initializeLorebookAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<Lorebook>> {
  const parseResult = initializeLorebookFormSchema.safeParse({
    name: formData.get("name"),
  });
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

export async function refreshLorebookConnectionAction(): Promise<
  ActionResponse<Lorebook>
> {
  try {
    const lorebook = await getLorebook();
    return { success: true, data: lorebook };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to connect to lorebook server" };
  }
}
