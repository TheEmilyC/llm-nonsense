"use server";

import {
  createLorebookEntity,
  deleteLorebookEntity,
  getLorebookById,
  testLorebookConnection,
  updateLorebookEntity,
} from "@/app/lorebook/_lib/data";
import {
  LorebookDto,
  LorebookEntityDto,
  lorebookFormSchema,
  LorebookFormValues,
  toLorebookDto,
  toLorebookEntityDto,
} from "@/app/lorebook/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";
import { LOREBOOK_TAG } from "@/lib/env-variables";
import { dbIdValidator } from "@/lib/validators";
import { revalidateTag } from "next/cache";
import { notFound } from "next/navigation";

export async function createLorebookAction(
  data: LorebookFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const parseResult = lorebookFormSchema.safeParse(data);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { success: false, error: "Malformed lorebook data" };
  }
  const newLorebook = parseResult.data;
  try {
    const entity = await createLorebookEntity({ newLorebook });
    return { success: true, data: { id: entity.id } };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Lorebook create failed" };
  }
}

export async function updateLorebookAction(
  lorebookId: string,
  data: LorebookFormValues,
): Promise<ActionResponse<LorebookEntityDto>> {
  const idResult = dbIdValidator.safeParse(lorebookId);
  if (!idResult.success)
    return { success: false, error: "Invalid lorebook ID" };
  const id = idResult.data;

  const parseResult = lorebookFormSchema.safeParse(data);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { success: false, error: "Malformed lorebook data" };
  }
  const update = parseResult.data;
  try {
    const entity = await updateLorebookEntity({ id, update });
    return { success: true, data: toLorebookEntityDto(entity) };
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
    await deleteLorebookEntity(idResult.data);
    return { success: true, data: null };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Lorebook delete failed" };
  }
}

export async function getLorebookAction(
  lorebookId: string,
  isRetry?: boolean,
): Promise<ActionResponse<LorebookDto>> {
  const idParseResult = dbIdValidator.safeParse(lorebookId);
  if (!idParseResult.success) {
    return { success: false, error: "Malformed lorebook data" };
  }
  const id = idParseResult.data;

  if (isRetry) revalidateTag(LOREBOOK_TAG, "max");
  try {
    const lorebook = await getLorebookById(id);
    return { success: true, data: toLorebookDto(lorebook) };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to fetch lorebook" };
  }
}

interface TestConnectionActionParams {
  api: {
    port: number;
    apiKey: string;
  };
}

export async function testConnectionAction({
  api,
}: TestConnectionActionParams): Promise<ActionResponse<null>> {
  try {
    const result = await testLorebookConnection(api);
    if (result) {
      return { success: true, data: null };
    } else {
      // shouldn't happen
      return { success: false, error: "Unknown error" };
    }
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
