"use server";

import { cacheTag } from "next/cache";

import { extractFirstHeader } from "@/app/lorebook/_lib/lorebook-scanning";
import {
  getObsidianIndexResponseSchema,
  Lorebook,
  LOREBOOK_CACHE_KEY,
  LorebookEntityDto,
  LorebookEntityListDto,
  LorebookEntryIndex,
  LorebookIndex,
  LorebookNotReady,
  LorebookStatusDto,
  lorebookStatusDtoSchema,
  ObsidianApiConnection,
  ObsidianFile,
  obsidianFileResponseSchema,
  ObsidianIndex,
  VaultDirectory,
  vaultDirectoryResponseSchema,
} from "@/app/lorebook/_lib/schema";
import { Lorebook as LorebookEntity } from "@/generated/client";
import {
  LOREBOOK_ALWAYS_TAG,
  LOREBOOK_CAST_TAG,
  LOREBOOK_CONTEXT_TAG,
  LOREBOOK_MEMORY_TAG,
  LOREBOOK_NEVER_TAG,
  LOREBOOK_TAG,
  LOREBOOK_TEMPLATES_FOLDER,
  OBSIDIAN_URL,
} from "@/lib/env-variables";
import { NotFoundError, ObsidianError } from "@/lib/error";
import { HttpStatus } from "@/lib/http";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export interface CreateLorebookEntityParams {
  newLorebook: Pick<LorebookEntity, "apiKey" | "name" | "port">;
}

export interface GetLorebookEntryListParams {
  files: string[];
  lorebookId: string;
}

export interface GetLorebookEntryParams {
  fileName: string;
  lorebookId: string;
}

export interface UpdateLorebookEntityParams {
  id: string;
  update: Partial<Pick<LorebookEntity, "apiKey" | "memoryLocation" | "name" | "port">>;
}

export interface WriteLorebookFileOptions {
  /** Reject the request if the file already has content. Defaults to false. */
  rejectIfContentPreexists?: boolean;
  /** Target section type within the file. Required when `target` is set. */
  targetType?: "block" | "frontmatter" | "heading";
  /**
   * The specific target within the file (e.g. a heading name or block ID).
   * Required when `targetType` is set. Will be URL-encoded before sending.
   */
  target?: string;
  /** Delimiter for nested heading targets. Defaults to "::" on the API side. */
  targetDelimiter?: string;
  /** Strip leading/trailing whitespace from the resolved target. Defaults to false. */
  trimTargetWhitespace?: boolean;
}

export interface WriteLorebookFileParams {
  content: string;
  fileName: string;
  lorebookId: string;
  options?: WriteLorebookFileOptions;
}

interface FetchLorebookEntryParams {
  apiKey: string;
  fileName: string;
  lorebookId: string;
  port: number;
}

type FetchLorebookIndexResult =
  | (LorebookNotReady & { success: false })
  | {
      index: ObsidianIndex[];
      success: true;
    };

export async function createLorebookEntity({
  newLorebook,
}: CreateLorebookEntityParams): Promise<LorebookEntity> {
  const lorebook = await prisma.lorebook.create({
    data: {
      apiKey: newLorebook.apiKey,
      name: newLorebook.name,
      port: newLorebook.port,
    },
  });

  return lorebook;
}

export async function deleteLorebookEntity(id: string) {
  await prisma.lorebook.delete({ where: { id } });
}

export async function getLorebookById(id: string): Promise<Lorebook> {
  "use cache";
  cacheTag(`${LOREBOOK_CACHE_KEY}-${id}`);

  // Get lorebook entity
  const entity = await getLorebookEntityById(id);
  if (!entity) throw new NotFoundError("Lorebook", id);

  // Get file index
  const indexResult = await fetchLorebookIndex({ entity, id });
  if (!indexResult.success) return indexResult;

  // create index lists
  const sorted = [...indexResult.index].sort((a, b) => {
    const aOrder = a.result.order ?? null;
    const bOrder = b.result.order ?? null;
    if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return (Number(a.result.ctime) || 0) - (Number(b.result.ctime) || 0);
  });

  const entryIndex: LorebookEntryIndex[] = [];
  const constantIndex: LorebookEntryIndex[] = [];
  const memoryIndex: LorebookEntryIndex[] = [];
  const contextIndex: LorebookIndex[] = [];
  let cast: LorebookEntryIndex | undefined;
  for (const index of sorted) {
    if (index.result.tags.includes(LOREBOOK_ALWAYS_TAG))
      constantIndex.push(toLorebookEntryIndex(index));
    else if (index.result.tags.includes(LOREBOOK_CONTEXT_TAG))
      contextIndex.push(toLorebookIndex(index));
    else if (index.result.tags.includes(LOREBOOK_MEMORY_TAG))
      memoryIndex.push(toLorebookEntryIndex(index));
    else entryIndex.push(toLorebookEntryIndex(index));

    if (index.result.tags.includes(LOREBOOK_CAST_TAG))
      cast = toLorebookEntryIndex(index);
  }

  // build lorebook
  const lorebook: Lorebook = {
    cast,
    constants: constantIndex,
    context: contextIndex,
    entries: entryIndex,
    id: entity.id,
    memories: memoryIndex,
    name: entity.name,
    status: "READY",
  };

  return lorebook;
}

export async function getLorebookDirectory(
  lorebookId: string,
  pathToDirectory: string = "",
): Promise<VaultDirectory> {
  const entity = await getLorebookEntityById(lorebookId);
  if (!entity) throw new NotFoundError("Lorebook", lorebookId);

  const path = pathToDirectory ? `${pathToDirectory}/` : "";
  const response = await fetch(`${OBSIDIAN_URL}:${entity.port}/vault/${path}`, {
    headers: {
      Authorization: `Bearer ${entity.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new ObsidianError(response.statusText, response.status);
  }

  const result = vaultDirectoryResponseSchema.parse(await response.json());
  if ("errorCode" in result) {
    throw new ObsidianError(result.message, result.errorCode);
  }

  return result;
}

export async function getLorebookEntityById(
  id: string,
): Promise<LorebookEntity | null> {
  "use cache";
  cacheTag(`${LOREBOOK_CACHE_KEY}-${id}`);
  const lorebook = await prisma.lorebook.findUnique({ where: { id } });
  return lorebook;
}

export async function getLorebookEntityDto(
  id: string,
): Promise<LorebookEntityDto | null> {
  const lorebook = await getLorebookEntityById(id);
  if (!lorebook) return null;
  return toLorebookEntityDto(lorebook);
}

export async function getLorebookEntityDtoList(): Promise<
  LorebookEntityListDto[]
> {
  "use cache";
  cacheTag(LOREBOOK_CACHE_KEY);

  const result = await prisma.lorebook.findMany();
  return toLorebookEntityListDto(result);
}

export async function getLorebookEntry({
  fileName,
  lorebookId,
}: GetLorebookEntryParams): Promise<ObsidianFile> {
  const lorebookEntity = await getLorebookEntityById(lorebookId);
  if (!lorebookEntity) throw new NotFoundError("Lorebook", lorebookId);
  return fetchLorebookEntry({
    apiKey: lorebookEntity.apiKey,
    fileName,
    lorebookId,
    port: lorebookEntity.port,
  });
}

export async function getLorebookEntryList({
  files,
  lorebookId,
}: GetLorebookEntryListParams): Promise<ObsidianFile[]> {
  const lorebookEntity = await getLorebookEntityById(lorebookId);
  if (!lorebookEntity) throw new NotFoundError("Lorebook", lorebookId);
  const results = await Promise.allSettled(
    files.map((fileName) =>
      fetchLorebookEntry({
        apiKey: lorebookEntity.apiKey,
        fileName,
        lorebookId,
        port: lorebookEntity.port,
      }),
    ),
  );
  return results.flatMap((result, i) => {
    if (result.status === "rejected") {
      logger.info("Failed to fetch lorebook entry", {
        file: files[i],
        reason: result.reason,
      });
      return [];
    }
    return [result.value];
  });
}

export async function getLorebookStatusDto(
  id: string,
): Promise<LorebookStatusDto | null> {
  "use cache";
  cacheTag(`${LOREBOOK_CACHE_KEY}-${id}`);

  const lorebook = await getLorebookById(id);
  if (!lorebook) return null;
  return lorebookStatusDtoSchema.parse(lorebook);
}

export async function testLorebookConnection(api: ObsidianApiConnection) {
  const response = await fetch(`${OBSIDIAN_URL}:${api.port}/vault/`, {
    headers: {
      Authorization: `Bearer ${api.apiKey}`,
    },
  });
  if (!response.ok || response.status === 401) {
    throw new ObsidianError(response.statusText, response.status);
  }

  return true;
}

export async function updateLorebookEntity({
  id,
  update,
}: UpdateLorebookEntityParams): Promise<LorebookEntityDto> {
  const entity = await prisma.lorebook.update({
    data: {
      apiKey: update.apiKey,
      memoryLocation: update.memoryLocation,
      name: update.name,
      port: update.port,
    },
    where: { id },
  });

  return toLorebookEntityDto(entity);
}

export async function writeLorebookFile({
  content,
  fileName,
  lorebookId,
  options,
}: WriteLorebookFileParams): Promise<void> {
  const entity = await getLorebookEntityById(lorebookId);
  if (!entity) throw new NotFoundError("Lorebook", lorebookId);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${entity.apiKey}`,
    "Content-Type": "text/markdown",
  };

  if (options?.rejectIfContentPreexists !== undefined) {
    headers["Reject-If-Content-Preexists"] = String(options.rejectIfContentPreexists);
  }
  if (options?.targetType !== undefined) {
    headers["Target-Type"] = options.targetType;
  }
  if (options?.target !== undefined) {
    headers["Target"] = encodeURIComponent(options.target);
  }
  if (options?.targetDelimiter !== undefined) {
    headers["Target-Delimiter"] = options.targetDelimiter;
  }
  if (options?.trimTargetWhitespace !== undefined) {
    headers["Trim-Target-Whitespace"] = String(options.trimTargetWhitespace);
  }

  const response = await fetch(
    `${OBSIDIAN_URL}:${entity.port}/vault/${fileName}`,
    {
      body: content,
      headers,
      method: "PUT",
    },
  );

  if (!response.ok) {
    throw new ObsidianError(response.statusText, response.status);
  }
}

async function fetchLorebookEntry({
  apiKey,
  fileName,
  lorebookId,
  port,
}: FetchLorebookEntryParams): Promise<ObsidianFile> {
  "use cache";
  cacheTag(`${LOREBOOK_CACHE_KEY}-${lorebookId}`);

  const contentResponse = await fetch(
    `${OBSIDIAN_URL}:${port}/vault/${fileName}`,
    {
      headers: {
        Accept: "application/vnd.olrapi.note+json",
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  const file = obsidianFileResponseSchema.parse(await contentResponse.json());
  if ("errorCode" in file) {
    throw new ObsidianError(contentResponse.statusText, contentResponse.status);
  }

  return file;
}

async function fetchLorebookIndex({
  entity,
  id,
}: {
  entity: LorebookEntity;
  id: string;
}): Promise<FetchLorebookIndexResult> {
  const query = JSON.stringify({
    and: [
      { in: [LOREBOOK_TAG, { var: "tags" }] },
      { "!": { in: [LOREBOOK_NEVER_TAG, { var: "tags" }] } },
      { "!": { in: [LOREBOOK_TEMPLATES_FOLDER, { var: "path" }] } },
    ],
  });

  try {
    const rawResponse = await fetch(`${OBSIDIAN_URL}:${entity.port}/search`, {
      body: query,
      headers: {
        Authorization: `Bearer ${entity.apiKey}`,
        "Content-type": "application/vnd.olrapi.jsonlogic+json",
      },
      method: "POST",
    });
    if (!rawResponse.ok) {
      logger.error("fetch lorebook file index request failed", {
        lorebookId: id,
        rawResponse,
        status: rawResponse.status,
        statusText: rawResponse.statusText,
      });
      return { status: "SERVER_UNAVAILABLE", success: false };
    }
    if (rawResponse.status === HttpStatus.UNAUTHORIZED) {
      return { status: "UNAUTHORIZED", success: false };
    }
    const result = getObsidianIndexResponseSchema.parse(
      await rawResponse.json(),
    );
    if ("errorCode" in result) {
      return { error: result, status: "ERROR", success: false };
    }
    const files = await getLorebookEntryList({
      files: result.map((idx) => idx.filename),
      lorebookId: id,
    });
    return {
      index: files.map((file) => ({
        filename: file.path,
        result: {
          ...file.frontmatter,
          ctime: file.stat.ctime,
          title:
            file.frontmatter.title ??
            extractFirstHeader(file.content) ??
            file.path,
        },
      })),
      success: true,
    };
  } catch {
    return { status: "SERVER_UNAVAILABLE", success: false };
  }
}

function toLorebookEntityDto(lorebook: LorebookEntity): LorebookEntityDto {
  return {
    apiKey: lorebook.apiKey,
    id: lorebook.id,
    memoryLocation: lorebook.memoryLocation,
    name: lorebook.name,
    port: lorebook.port,
  };
}

function toLorebookEntityListDto(
  lorebooks: LorebookEntity[],
): LorebookEntityListDto[] {
  return lorebooks.map(({ createdAt, id, name }) => ({ createdAt, id, name }));
}

function toLorebookEntryIndex(index: ObsidianIndex): LorebookEntryIndex {
  return {
    ...toLorebookIndex(index),
    aliases: index.result.aliases ?? [],
    characters:
      index.result.characters?.map((char) =>
        typeof char === "string" ? char : (char.display ?? char.path),
      ) ?? [],
    summary: index.result.summary ?? "",
  };
}

function toLorebookIndex(index: ObsidianIndex): LorebookIndex {
  return {
    createdAt: index.result.ctime,
    filename: index.filename,
    name: index.result.title ?? index.filename,
    order: index.result.order ?? 50,
    tags: index.result.tags,
  };
}
