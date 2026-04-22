"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { dbIdValidator } from "@/app/_shared/schema";
import {
  createLorebookEntity,
  deleteLorebookEntity,
  getLorebookStatusDto,
  testLorebookConnection,
  updateLorebookEntity,
} from "@/app/lorebook/_lib/data";
import {
  GenerateMemoryArcActionParams,
  generateMemoryArcActionParamsSchema,
  GetLorebookActionParams,
  getLorebookActionParamsSchema,
  LOREBOOK_CACHE_KEY,
  LorebookEntityDto,
  lorebookFormSchema,
  LorebookFormValues,
  LorebookStatusDto,
  ObsidianApiConnection,
  obsidianApiConnectionSchema,
  UpdateLorebookActionParams,
  updateLorebookActionParamsSchema,
} from "@/app/lorebook/_lib/schema";
import {
  generateMemoryArc,
  GenerateMemoryArcResult,
} from "@/app/lorebook/_lib/service";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { LOREBOOK_TAG } from "@/lib/env-variables";
import { NotFoundError } from "@/lib/error";
import { logger, parseError } from "@/lib/logger";

export async function createLorebookAction(
  data: LorebookFormValues,
): Promise<ActionResponse> {
  const parseResult = lorebookFormSchema.safeParse(data);
  if (!parseResult.success) return toActionResponseError(parseResult.error);

  const newLorebook = parseResult.data;
  let lorebook: LorebookEntityDto;
  try {
    lorebook = await createLorebookEntity({ newLorebook });
  } catch (err) {
    logger.error("Failed to create lorebook", parseError(err));
    return toActionResponseError(err);
  }
  logger.info("Lorebook created", { id: lorebook.id });
  updateTag(LOREBOOK_CACHE_KEY);
  redirect(`/lorebook/${lorebook.id}`);
}

export async function deleteLorebookAction(
  lorebookId: string,
): Promise<ActionResponse> {
  const idResult = dbIdValidator.safeParse(lorebookId);
  if (!idResult.success) return toActionResponseError(idResult.error);

  try {
    await deleteLorebookEntity(idResult.data);
  } catch (err) {
    logger.error("Failed to delete lorebook", {
      id: lorebookId,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
  logger.info("Lorebook deleted", { id: lorebookId });

  updateTag(`${LOREBOOK_CACHE_KEY}-${lorebookId}`);
  updateTag(LOREBOOK_CACHE_KEY);
  redirect("/lorebook");
}

export async function generateMemoryArcAction(
  params: GenerateMemoryArcActionParams,
): Promise<ActionResponse<GenerateMemoryArcResult>> {
  const parseResult = generateMemoryArcActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { files, id } = parseResult.data;

  let arcs: GenerateMemoryArcResult | undefined;
  try {
    arcs = await generateMemoryArc(id, files);
  } catch (err) {
    logger.error("Failed to generate memory arc", {
      files,
      id,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
  logger.info("Memory arc generated", { id });
  return { data: arcs, success: true };

  throw new Error("Not yet implemented");
}

export async function getLorebookAction(
  params: GetLorebookActionParams,
): Promise<ActionResponse<LorebookStatusDto>> {
  const parseResult = getLorebookActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { id, isRetry } = parseResult.data;

  if (isRetry) updateTag(LOREBOOK_TAG);
  let lorebook: LorebookStatusDto | null;
  try {
    lorebook = await getLorebookStatusDto(id);
    if (!lorebook)
      return toActionResponseError(new NotFoundError("Lorebook", id));
  } catch (err) {
    logger.error("Failed to fetch lorebook", { id, ...parseError(err) });
    return toActionResponseError(err);
  }

  return { data: lorebook, success: true };
}

export async function testConnectionAction(
  apiRaw: ObsidianApiConnection,
): Promise<ActionResponse> {
  const parseResult = obsidianApiConnectionSchema.safeParse(apiRaw);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const api = parseResult.data;

  try {
    const result = await testLorebookConnection(api);
    if (result) {
      return { success: true };
    }
  } catch (err) {
    return toActionResponseError(err);
  }

  // Shouldn't reach this, either the test works or throws
  return {
    error: { code: "INTERNAL_ERROR", message: "An error occured" },
    success: false,
  };
}

export async function updateLorebookAction(
  params: UpdateLorebookActionParams,
): Promise<ActionResponse> {
  const parseResult = updateLorebookActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { id, update } = parseResult.data;

  try {
    await updateLorebookEntity({ id, update });
  } catch (err) {
    logger.error("Failed to update lorebook", {
      id,
      update,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
  logger.info("Persona updated", { id });

  updateTag(LOREBOOK_CACHE_KEY);
  updateTag(`${LOREBOOK_CACHE_KEY}-${id}`);
  return { success: true };
}
