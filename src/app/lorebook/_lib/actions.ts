"use server";

import { revalidateTag } from "next/cache";
import { notFound } from "next/navigation";

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

interface TestConnectionActionParams {
  api: {
    apiKey: string;
    port: number;
  };
}

export async function createLorebookAction(
  data: LorebookFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const parseResult = lorebookFormSchema.safeParse(data);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { error: "Malformed lorebook data", success: false };
  }
  const newLorebook = parseResult.data;
  try {
    const entity = await createLorebookEntity({ newLorebook });
    return { data: { id: entity.id }, success: true };
  } catch (err) {
    console.error(err);
    return { error: "Lorebook create failed", success: false };
  }
}

export async function deleteLorebookAction(
  lorebookId: string,
): Promise<ActionResponse<null>> {
  const idResult = dbIdValidator.safeParse(lorebookId);
  if (!idResult.success) notFound();
  try {
    await deleteLorebookEntity(idResult.data);
    return { data: null, success: true };
  } catch (err) {
    console.error(err);
    return { error: "Lorebook delete failed", success: false };
  }
}

export async function getLorebookAction(
  lorebookId: string,
  isRetry?: boolean,
): Promise<ActionResponse<LorebookDto>> {
  const idParseResult = dbIdValidator.safeParse(lorebookId);
  if (!idParseResult.success) {
    return { error: "Malformed lorebook data", success: false };
  }
  const id = idParseResult.data;

  if (isRetry) revalidateTag(LOREBOOK_TAG, "max");
  try {
    const lorebook = await getLorebookById(id);
    return { data: toLorebookDto(lorebook), success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to fetch lorebook", success: false };
  }
}

export async function testConnectionAction({
  api,
}: TestConnectionActionParams): Promise<ActionResponse<null>> {
  try {
    const result = await testLorebookConnection(api);
    if (result) {
      return { data: null, success: true };
    } else {
      // shouldn't happen
      return { error: "Unknown error", success: false };
    }
  } catch (err) {
    console.error(err);
    return { error: (err as Error).message, success: false };
  }
}

export async function updateLorebookAction(
  lorebookId: string,
  data: LorebookFormValues,
): Promise<ActionResponse<LorebookEntityDto>> {
  const idResult = dbIdValidator.safeParse(lorebookId);
  if (!idResult.success)
    return { error: "Invalid lorebook ID", success: false };
  const id = idResult.data;

  const parseResult = lorebookFormSchema.safeParse(data);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return { error: "Malformed lorebook data", success: false };
  }
  const update = parseResult.data;
  try {
    const entity = await updateLorebookEntity({ id, update });
    return { data: toLorebookEntityDto(entity), success: true };
  } catch (err) {
    console.error(err);
    return { error: "Lorebook update failed", success: false };
  }
}
