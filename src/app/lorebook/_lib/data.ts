"use server";

import { cacheTag } from "next/cache";

import {
  getObsidianIndexResposneSchema,
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
} from "@/app/lorebook/_lib/schema";
import { Lorebook as LorebookEntity } from "@/generated/client";
import {
  LOREBOOK_ALWAYS_TAG,
  LOREBOOK_CONTEXT_TAG,
  LOREBOOK_MEMORY_TAG,
  LOREBOOK_NEVER_TAG,
  LOREBOOK_TAG,
  LOREBOOK_TEMPLATES_FOLDER,
  OBSIDIAN_URL,
} from "@/lib/env-variables";
import { NotFoundError, ObsidianError } from "@/lib/error";
import { HttpStatus } from "@/lib/http";
import { logger, parseError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export interface CreateLorebookEntityParams {
  newLorebook: Pick<LorebookEntity, "apiKey" | "name" | "port">;
}

export interface GetLorebookEntryListParams {
  files: string[];
  lorebookId: string;
}

export interface UpdateLorebookEntityParams {
  id: string;
  update: Partial<Pick<LorebookEntity, "apiKey" | "name" | "port">>;
}

type FetchLorebookIndexResult =
  | (LorebookNotReady & { success: false })
  | {
      index: ObsidianIndex[];
      success: true;
    };

interface GetLorebookEntryParams {
  fileName: string;
  lorebookId: string;
}

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

export async function getLorebookById(id: string): Promise<Lorebook | null> {
  "use cache";
  cacheTag(`${LOREBOOK_CACHE_KEY}-${id}`);

  // Get lorebook entity
  const entity = await getLorebookEntityById(id);
  if (!entity) return null;

  // Get file index
  const indexResult = await fetchLorebookIndex({ entity, id });
  if (!indexResult.success) return indexResult;

  // create index lists
  const entryIndex: LorebookEntryIndex[] = [];
  const constantIndex: LorebookEntryIndex[] = [];
  const memoryIndex: LorebookEntryIndex[] = [];
  const contextIndex: LorebookIndex[] = [];
  for (const index of indexResult.index) {
    if (index.result.tags.includes(LOREBOOK_ALWAYS_TAG))
      constantIndex.push(toLorebookEntryIndex(index));
    else if (index.result.tags.includes(LOREBOOK_CONTEXT_TAG))
      contextIndex.push(toLorebookIndex(index));
    else if (index.result.tags.includes(LOREBOOK_MEMORY_TAG))
      memoryIndex.push(toLorebookEntryIndex(index));
    else entryIndex.push(toLorebookEntryIndex(index));
  }

  // build lorebook
  const lorebook: Lorebook = {
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
  "use cache";
  cacheTag(`${LOREBOOK_CACHE_KEY}-${lorebookId}`);

  const lorebookEntity = await getLorebookEntityById(lorebookId);
  if (!lorebookEntity) throw new NotFoundError("Lorebook", lorebookId);

  const response = await fetch(
    `${OBSIDIAN_URL}:${lorebookEntity.port}/vault/${fileName}`,
    {
      headers: {
        Accept: "application/vnd.olrapi.note+json",
        Authorization: `Bearer ${lorebookEntity.apiKey}`,
      },
    },
  );

  const file = obsidianFileResponseSchema.parse(await response.json());
  if ("errorCode" in file) {
    throw new ObsidianError(response.statusText, response.status);
  }

  return file;
}

export async function getLorebookEntryList({
  files,
  lorebookId,
}: GetLorebookEntryListParams): Promise<ObsidianFile[]> {
  return Promise.all(
    files.map((fileName) => getLorebookEntry({ fileName, lorebookId })),
  );
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
    data: { apiKey: update.apiKey, name: update.name, port: update.port },
    where: { id },
  });

  return toLorebookEntityDto(entity);
}

async function fetchLorebookIndex({
  entity,
  id,
}: {
  entity: LorebookEntity;
  id: string;
}): Promise<FetchLorebookIndexResult> {
  try {
    const rawResponse = await fetch(`${OBSIDIAN_URL}:${entity.port}/search`, {
      body: `TABLE title, tags, summary, position FROM #${LOREBOOK_TAG} and !#${LOREBOOK_NEVER_TAG} and !"${LOREBOOK_TEMPLATES_FOLDER}"`,
      headers: {
        Authorization: `Bearer ${entity.apiKey}`,
        "Content-type": "application/vnd.olrapi.dataview.dql+txt",
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
    const result = getObsidianIndexResposneSchema.parse(
      await rawResponse.json(),
    );
    if ("errorCode" in result) {
      return { error: result, status: "ERRROR", success: false };
    }
    return {
      index: result,
      success: true,
    };
  } catch (err) {
    logger.error("Failed to get lorebook file index", {
      id,
      ...parseError(err),
    });
    return { status: "SERVER_UNAVAILABLE", success: false };
  }
}

function toLorebookEntityDto(lorebook: LorebookEntity): LorebookEntityDto {
  return {
    apiKey: lorebook.apiKey,
    id: lorebook.id,
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
    characters: index.result.characters ?? [],
    summary: index.result.summary ?? "",
  };
}

function toLorebookIndex(index: ObsidianIndex): LorebookIndex {
  return {
    filename: index.filename,
    name: index.result.title ?? index.filename,
    position: index.result.position ?? 50,
    tags: index.result.tags,
  };
}
