"use server";

import { cacheTag, updateTag } from "next/cache";
import path from "path";

import {
  GetLorebookIndexResposne,
  getObsidianIndexResposneSchema,
  Lorebook,
  LOREBOOK_CACHE_KEY,
  LorebookEntityDto,
  lorebookEntityDtoSchema,
  LorebookStatus,
  LorebookStatusDto,
  lorebookStatusDtoSchema,
  ObsidianApiConnection,
  obsidianFileResponseSchema,
} from "@/app/lorebook/_lib/schema";
import { Lorebook as LorebookEntity } from "@/generated/client";
import {
  LOREBOOK_NEVER_TAG,
  LOREBOOK_TAG,
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

interface GetLorebookEntryParams {
  fileName: string;
  lorebookId: string;
}

export async function createLorebookEntity({
  newLorebook,
}: CreateLorebookEntityParams): Promise<LorebookEntityDto> {
  const entity = await prisma.lorebook.create({
    data: {
      apiKey: newLorebook.apiKey,
      name: newLorebook.name,
      port: newLorebook.port,
    },
  });
  const lorebook = lorebookEntityDtoSchema.parse(entity);

  updateTag(LOREBOOK_CACHE_KEY);
  return lorebook;
}

export async function deleteLorebookEntity(id: string) {
  await prisma.lorebook.delete({ where: { id } });
  updateTag(LOREBOOK_CACHE_KEY);
}

export async function getLorebookById(id: string): Promise<Lorebook | null> {
  "use cache";
  cacheTag(LOREBOOK_CACHE_KEY);

  // Get lorebook entity
  const entity = await getLorebookEntityById(id);
  if (!entity) return null;

  // Get file index
  let index: GetLorebookIndexResposne;
  try {
    const indexResponse = await fetch(`${OBSIDIAN_URL}:${entity.port}/search`, {
      body: `TABLE title, tags, keys, summary, constant, position FROM ${LOREBOOK_TAG} and !${LOREBOOK_NEVER_TAG} and !"system/Templates"`,
      headers: {
        Authorization: `Bearer ${entity.apiKey}`,
        "Content-type": "application/vnd.olrapi.dataview.dql+txt",
      },
      method: "POST",
    });
    if (!indexResponse.ok) {
      logger.error("fetch lorebook file index request failed", {
        lorebookId: id,
        status: indexResponse.status,
        statusText: indexResponse.statusText,
      });

      return { status: LorebookStatus.ServerUnavailable };
    }
    if (indexResponse.status === HttpStatus.UNAUTHORIZED) {
      return { status: LorebookStatus.Unauthorized };
    }
    index = getObsidianIndexResposneSchema.parse(await indexResponse.json());
  } catch (err) {
    logger.error("Failed to get lorebook file index", {
      id,
      ...parseError(err),
    });
    return { status: LorebookStatus.ServerUnavailable };
  }

  // build lorebook
  const lorebook: Lorebook = {
    id: entity.id,
    index: Array.isArray(index)
      ? index.map((idx) => ({
          constant:
            idx.result.constant && idx.result.constant === "true"
              ? true
              : false,
          filename: idx.filename,
          keys: idx.result.keys ?? [],
          name: idx.result.title ?? path.basename(idx.filename),
          position: idx.result.position ?? 10,
          summary: idx.result.summary ?? "",
          tags: idx.result.tags,
        }))
      : [],
    name: entity.name,
    status: LorebookStatus.Ready,
  };

  return lorebook;
}

export async function getLorebookEntityById(
  id: string,
): Promise<LorebookEntityDto | null> {
  "use cache";
  cacheTag(LOREBOOK_CACHE_KEY);
  const result = await prisma.lorebook.findUnique({ where: { id } });
  if (!result) return null;
  return lorebookEntityDtoSchema.parse(result);
}

export async function getLorebookEntityList(): Promise<LorebookEntity[]> {
  "use cache";
  cacheTag(LOREBOOK_CACHE_KEY);

  return await prisma.lorebook.findMany();
}

export async function getLorebookEntry({
  fileName,
  lorebookId,
}: GetLorebookEntryParams) {
  "use cache";
  cacheTag(LOREBOOK_CACHE_KEY);

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
}: GetLorebookEntryListParams) {
  return Promise.all(
    files.map((fileName) => getLorebookEntry({ fileName, lorebookId })),
  );
}

export async function getLorebookStatusDto(
  id: string,
): Promise<LorebookStatusDto | null> {
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
}: UpdateLorebookEntityParams): Promise<LorebookEntity> {
  const orgLorebook = await getLorebookEntityById(id);
  if (!orgLorebook) throw new NotFoundError("Lorebook", id);

  const entityUpdate: Partial<LorebookEntity> = {};
  if (update.apiKey !== undefined && update.apiKey !== orgLorebook.apiKey)
    entityUpdate.apiKey = update.apiKey;

  if (update.name !== undefined && update.name !== orgLorebook.name)
    entityUpdate.name = update.name;

  if (update.port !== undefined && update.port !== orgLorebook.port)
    entityUpdate.port = update.port;

  const entity = await prisma.lorebook.update({
    data: entityUpdate,
    where: { id },
  });

  updateTag(LOREBOOK_CACHE_KEY);
  return entity;
}
