import {
  GetLorebookIndexResposne,
  getObsidianIndexResposneSchema,
  Lorebook,
  LOREBOOK_CACHE_KEY,
  LorebookStatus,
  ObsidianApiConnection,
  obsidianFileResponseSchema,
} from "@/app/lorebook/_lib/schema";
import {
  LOREBOOK_NEVER_TAG,
  LOREBOOK_TAG,
  OBSIDIAN_URL,
} from "@/lib/env-variables";
import { HttpStatus } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import path from "path";
import { Lorebook as LorebookEntity } from "../../../../generated/client";

export interface CreateLorebookDbParams {
  newLorebook: Pick<LorebookEntity, "name" | "apiKey" | "port">;
}

export async function createLorebookDb({
  newLorebook,
}: CreateLorebookDbParams): Promise<LorebookEntity> {
  const entity = await prisma.lorebook.create({
    data: {
      apiKey: newLorebook.apiKey,
      name: newLorebook.name,
      port: newLorebook.port,
    },
  });
  revalidateTag(LOREBOOK_CACHE_KEY, "max");
  return entity;
}

export async function getLorebookDbList(): Promise<LorebookEntity[]> {
  "use cache";
  cacheTag(LOREBOOK_CACHE_KEY);

  return await prisma.lorebook.findMany();
}

export interface UpdateLorebookDbParams {
  id: string;
  update: Partial<Pick<LorebookEntity, "apiKey" | "name" | "port">>;
}

export async function updateLorebookDb({
  id,
  update,
}: UpdateLorebookDbParams): Promise<LorebookEntity> {
  const orgLorebook = await getLorebookDbById(id);
  if (!orgLorebook) throw new Error("Lorebook does not exist");

  const entityUpdate: Partial<LorebookEntity> = {};
  if (update.apiKey !== undefined && update.apiKey !== orgLorebook.apiKey)
    entityUpdate.apiKey = update.apiKey;

  if (update.name !== undefined && update.name !== orgLorebook.name)
    entityUpdate.name = update.name;

  if (update.port !== undefined && update.port !== orgLorebook.port)
    entityUpdate.port = update.port;

  const entity = await prisma.lorebook.update({
    where: { id },
    data: entityUpdate,
  });
  
  revalidateTag(LOREBOOK_CACHE_KEY, "max");
  return entity;
}

export async function deleteLorebookDb(id: string): Promise<void> {
  await prisma.lorebook.delete({ where: { id } });
  revalidateTag(LOREBOOK_CACHE_KEY, "max");
}

export async function getLorebookDbById(id: string) {
  "use cache";
  cacheTag(LOREBOOK_CACHE_KEY);
  return prisma.lorebook.findUnique({ where: { id } });
}

export async function getLorebookById(
  id: string,
  { debug = false } = {},
): Promise<Lorebook> {
  "use cache";
  cacheTag(LOREBOOK_CACHE_KEY);
  cacheLife("hours");

  // Get lorebook entity
  const entity = await getLorebookDbById(id);
  if (!entity) throw new Error("Lorebook does not exist");

  // Get file index
  let index: GetLorebookIndexResposne;
  try {
    const indexResponse = await fetch(`${OBSIDIAN_URL}:${entity.port}/search`, {
      headers: {
        Authorization: `Bearer ${entity.apiKey}`,
        "Content-type": "application/vnd.olrapi.dataview.dql+txt",
      },
      method: "POST",
      body: `TABLE title, tags, keys, summary, constant, position FROM ${LOREBOOK_TAG} and !${LOREBOOK_NEVER_TAG} and !"system/Templates"`,
    });
    if (!indexResponse.ok) {
      console.error(
        `Lorebook index request failed. Status:${indexResponse.status} Status Text: ${indexResponse.statusText}`,
      );
      return { status: LorebookStatus.ServerUnavailable };
    }
    if (indexResponse.status === HttpStatus.UNAUTHORIZED) {
      return { status: LorebookStatus.Unauthorized };
    }
    index = getObsidianIndexResposneSchema.parse(await indexResponse.json());
  } catch (err) {
    console.error(err);
    return { status: LorebookStatus.ServerUnavailable };
  }

  // build lorebook
  const lorebook: Lorebook = {
    status: LorebookStatus.Ready,
    id: entity.id,
    name: entity.name,
    index: Array.isArray(index)
      ? index.map((idx) => ({
          filename: idx.filename,
          name: idx.result.title ?? path.basename(idx.filename),
          summary: idx.result.summary ?? "",
          tags: idx.result.tags,
          keys: idx.result.keys ?? [],
          constant:
            idx.result.constant && idx.result.constant === "true"
              ? true
              : false,
          position: idx.result.position ?? 10,
        }))
      : [],
  };
  if (debug) {
    console.debug("Lorebook Index", JSON.stringify(lorebook, null, 2));
  }
  return lorebook;
}

interface GetLorebookEntryParams {
  fileName: string;
  api: ObsidianApiConnection;
}

export async function getLorebookEntry({
  fileName,
  api,
}: GetLorebookEntryParams) {
  "use cache";
  cacheLife("hours");
  cacheTag(LOREBOOK_CACHE_KEY);

  const response = await fetch(
    `${OBSIDIAN_URL}:${api.port}/vault/${fileName}`,
    {
      headers: {
        Authorization: `Bearer ${api.apiKey}`,
        Accept: "application/vnd.olrapi.note+json",
      },
    },
  );

  const file = obsidianFileResponseSchema.parse(await response.json());
  if ("errorCode" in file) {
    throw new Error(
      `Lorebook file request failed. Status${response.status} StatusText: ${response.statusText}`,
    );
  }

  return file;
}

export async function getLorebookEntryList(
  files: string[],
  api: ObsidianApiConnection,
) {
  return Promise.all(
    files.map((fileName) => getLorebookEntry({ fileName, api })),
  );
}

export async function testLorebookConnection(api: ObsidianApiConnection) {
  const response = await fetch(`${OBSIDIAN_URL}:${api.port}/vault/`, {
    headers: {
      Authorization: `Bearer ${api.apiKey}`,
    },
  });
  if (!response.ok || response.status === 401) {
    throw new Error(
      `Lorebook connection failed. Status: ${response.status} StatusText: ${response.statusText}`,
    );
  }

  return true;
}
