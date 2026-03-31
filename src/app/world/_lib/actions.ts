"use server";

import { notFound } from "next/navigation";
import z from "zod";

import {
  createWorld,
  deleteWorld,
  updateWorld,
} from "@/app/world/_lib/data";
import {
  WorldDto,
  worldFormSchema,
  WorldFormValues,
  toWorldDto,
} from "@/app/world/_lib/schema";
import { ActionResponse } from "@/lib/action-utils";
import { dbIdValidator } from "@/lib/validators";
import { refresh } from "next/cache";

export async function createWorldAction(
  data: WorldFormValues,
): Promise<ActionResponse<{ id: string }>> {
  const formParseResult = worldFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(z.prettifyError(formParseResult.error));
    return { success: false, error: "Malformed world data" };
  }
  const { image, ...world } = formParseResult.data;

  let newWorld;
  try {
    newWorld = await createWorld({ image, world });
  } catch (err) {
    console.error(err);
    return { success: false, error: "World create failed" };
  }
  return { success: true, data: { id: newWorld.id } };
}

export async function updateWorldAction(
  worldId: string,
  data: WorldFormValues,
): Promise<ActionResponse<WorldDto>> {
  const formParseResult = worldFormSchema.safeParse(data);
  if (!formParseResult.success) {
    console.error(z.prettifyError(formParseResult.error));
    return { success: false, error: "Malformed world data" };
  }
  const idParseResult = dbIdValidator.safeParse(worldId);
  if (!idParseResult.success) {
    console.error(z.prettifyError(idParseResult.error));
    return { success: false, error: "Malformed world data" };
  }
  const id = idParseResult.data;
  const { image, ...update } = formParseResult.data;

  try {
    const updated = await updateWorld({ id, update, image });
    refresh();
    return { success: true, data: toWorldDto(updated) };
  } catch (err) {
    console.error(err);
    return { success: false, error: "World update failed" };
  }
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
    return { success: false, error: "failed to delete world" };
  }
  return { success: true, data: null };
}
