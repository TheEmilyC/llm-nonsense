"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { dbIdValidator } from "@/app/_shared/schema";
import { getChatForMemoryGen } from "@/app/chat/_lib/data";
import {
  createLorebookEntity,
  deleteLorebookEntity,
  getLorebookDirectory,
  getLorebookEntityById,
  getLorebookStatusDto,
  testLorebookConnection,
  updateLorebookEntity,
  writeLorebookFile,
} from "@/app/lorebook/_lib/data";
import { extractFirstHeader } from "@/app/lorebook/_lib/lorebook-scanning";
import {
  GenerateLorebookUpdatesActionParams,
  generateLorebookUpdatesActionParamsSchema,
  GenerateLorebookUpdatesResult,
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
  SaveMemoryToLorebookActionParams,
  saveMemoryToLorebookActionParamsSchema,
  UpdateLorebookActionParams,
  updateLorebookActionParamsSchema,
} from "@/app/lorebook/_lib/schema";
import {
  generateLorebookUpdates,
  generateMemoryArc,
  GenerateMemoryArcResult,
} from "@/app/lorebook/_lib/service";
import { ActionResponse, toActionResponseError } from "@/lib/action-utils";
import { AppError, NotFoundError } from "@/lib/error";
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

export async function generateLorebookUpdatesAction(
  params: GenerateLorebookUpdatesActionParams,
): Promise<ActionResponse<GenerateLorebookUpdatesResult>> {
  const parseResult =
    generateLorebookUpdatesActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { chatId } = parseResult.data;

  const chat = await getChatForMemoryGen(chatId, []);
  if (!chat) return toActionResponseError(new NotFoundError("Chat", chatId));
  if (!chat.lorebookId)
    return toActionResponseError(
      new AppError("Chat has no lorebook", "INTERNAL_ERROR"),
    );

  const facts = chat.facts ?? [];
  let result: GenerateLorebookUpdatesResult;
  try {
    result = await generateLorebookUpdates({
      facts,
      lorebookId: chat.lorebookId,
    });
  } catch (err) {
    logger.error("Failed to generate lorebook updates", {
      chatId,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
  logger.info("Lorebook updates generated", { chatId });
  return { data: result, success: true };
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
}

export async function getLorebookAction(
  params: GetLorebookActionParams,
): Promise<ActionResponse<LorebookStatusDto>> {
  const parseResult = getLorebookActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { id, isRetry } = parseResult.data;

  if (isRetry) updateTag(`${LOREBOOK_CACHE_KEY}-${id}`);
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

export async function getLorebookDirectoryAction(
  lorebookId: string,
  path: string,
): Promise<ActionResponse<string[]>> {
  const idResult = dbIdValidator.safeParse(lorebookId);
  if (!idResult.success) return toActionResponseError(idResult.error);

  try {
    const directory = await getLorebookDirectory(idResult.data, path);

    // Extract immediate children from the flat files list.
    // Handles both vault-relative paths ("Characters/Alice.md") and
    // relative paths ("Alice.md") returned by different API versions.
    const prefix = path ? `${path}/` : "";
    const children = new Set<string>();
    for (const file of directory.files) {
      const relative = file.startsWith(prefix)
        ? file.slice(prefix.length)
        : file;
      const firstSegment = relative.split("/")[0];
      if (firstSegment) {
        children.add(path ? `${path}/${firstSegment}` : firstSegment);
      }
    }

    return { data: Array.from(children).sort(), success: true };
  } catch (err) {
    logger.error("Failed to fetch lorebook directory", {
      lorebookId,
      path,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }
}

export async function saveMemoryToLorebookAction(
  params: SaveMemoryToLorebookActionParams,
): Promise<ActionResponse> {
  const parseResult = saveMemoryToLorebookActionParamsSchema.safeParse(params);
  if (!parseResult.success) return toActionResponseError(parseResult.error);
  const { content, lorebookId } = parseResult.data;

  try {
    const entity = await getLorebookEntityById(lorebookId);
    if (!entity)
      return toActionResponseError(new NotFoundError("Lorebook", lorebookId));

    const title =
      extractFirstHeader(content) ?? new Date().toISOString().slice(0, 10);
    const slug = slugifyTitle(title);
    const base = entity.memoryLocation ?? "";
    const fileName = base ? `${base}/${slug}.md` : `${slug}.md`;

    await writeLorebookFile({ content, fileName, lorebookId });
  } catch (err) {
    logger.error("Failed to save memory to lorebook", {
      lorebookId,
      ...parseError(err),
    });
    return toActionResponseError(err);
  }

  logger.info("Memory saved to lorebook", { lorebookId });
  return { success: true };
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
    error: { code: "INTERNAL_ERROR", message: "An error occurred" },
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
  logger.info("Lorebook updated", { id });

  updateTag(LOREBOOK_CACHE_KEY);
  updateTag(`${LOREBOOK_CACHE_KEY}-${id}`);
  return { success: true };
}

/** Converts a heading string like "Chapter 3: The Title" → "chapter-3-the-title". */
function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
