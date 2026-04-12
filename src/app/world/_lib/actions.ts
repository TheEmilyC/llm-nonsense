"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { dbIdValidator } from "@/app/_shared/schema";
import { createWorld, deleteWorld, updateWorld } from "@/app/world/_lib/data";
import {
  UpdateWorldActionParams,
  updateWorldActionParamsSchema,
  WORLD_CACHE_KEY,
  WorldEntity,
  worldFormSchema,
  WorldFormValues,
} from "@/app/world/_lib/schema";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { logger, parseError } from "@/lib/logger";

export async function createWorldAction(
  data: WorldFormValues,
): Promise<ActionResponse> {
  const formParseResult = worldFormSchema.safeParse(data);
  if (!formParseResult.success)
    return toActionResponseError(formParseResult.error);

  const { image, ...world } = formParseResult.data;

  let newWorld: WorldEntity;
  try {
    newWorld = await createWorld({ image, world });
  } catch (err) {
    logger.error("Failed to create world", { world, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("World created", { id: newWorld.id });

  updateTag(WORLD_CACHE_KEY);
  redirect(`/world/${newWorld.id}`);
}

export async function deleteWorldAction(
  worldId: string,
): Promise<ActionResponse> {
  const idParseResult = dbIdValidator.safeParse(worldId);
  if (!idParseResult.success) return toActionResponseError(idParseResult.error);

  const id = idParseResult.data;

  try {
    await deleteWorld(id);
  } catch (err) {
    logger.error("Failed to delete world", { id, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("World deleted", { id });

  updateTag(WORLD_CACHE_KEY);
  updateTag(`${WORLD_CACHE_KEY}-${id}`);
  redirect("/world");
}

export async function updateWorldAction(
  params: UpdateWorldActionParams,
): Promise<ActionResponse> {
  const parseResult = updateWorldActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { id, update } = parseResult.data;

  try {
    await updateWorld({ id, update });
  } catch (err) {
    logger.error("Failed to update world", { id, update, ...parseError(err) });
    return toActionResponseError(err);
  }
  logger.info("World updated", { id });

  updateTag(WORLD_CACHE_KEY);
  updateTag(`${WORLD_CACHE_KEY}-${id}`);
  return { success: true };
}
