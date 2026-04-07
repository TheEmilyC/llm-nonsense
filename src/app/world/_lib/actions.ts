"use server";

import { notFound } from "next/navigation";

import { createWorld, deleteWorld, updateWorld } from "@/app/world/_lib/data";
import {
  toWorldDto,
  WorldDto,
  worldFormSchema,
  WorldFormValues,
} from "@/app/world/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";
import { dbIdValidator } from "@/lib/validators";

export async function createWorldAction(
  data: WorldFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const formParseResult = worldFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(formParseResult.error);
    return { error: "Malformed world data", success: false };
  }
  const { image, ...world } = formParseResult.data;

  let newWorld;
  try {
    newWorld = await createWorld({ image, world });
  } catch (err) {
    console.error(err);
    return { error: "World create failed", success: false };
  }
  return { data: { id: newWorld.id }, success: true };
}

export async function deleteWorldAction(
  worldId: string,
): Promise<ActionResponse<null>> {
  const idParseResult = dbIdValidator.safeParse(worldId);
  if (!idParseResult.success) {
    notFound();
  }
  const id = idParseResult.data;
  try {
    await deleteWorld(id);
  } catch (err) {
    console.error(err);
    return { error: "failed to delete world", success: false };
  }
  return { data: null, success: true };
}

export async function updateWorldAction(
  worldId: string,
  data: WorldFormValues,
): Promise<ActionResponse<WorldDto>> {
  const formParseResult = worldFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(formParseResult.error);
    return { error: "Malformed world data", success: false };
  }
  const idParseResult = dbIdValidator.safeParse(worldId);
  if (!idParseResult.success) {
    console.error(idParseResult.error);
    return { error: "Malformed world data", success: false };
  }
  const id = idParseResult.data;
  const { image, ...update } = formParseResult.data;

  try {
    const updated = await updateWorld({ id, image, update });
    return { data: toWorldDto(updated), success: true };
  } catch (err) {
    console.error(err);
    return { error: "World update failed", success: false };
  }
}
