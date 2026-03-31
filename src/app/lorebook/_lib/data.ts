import {
  GetLorebookIndexResposne,
  getLorebookIndexResposneSchema,
  Lorebook,
  LOREBOOK_DB_CACHE_KEY,
  lorebookFileResponseSchema,
  LorebookStatus,
  ObsidianMetadataResponse,
  obsidianMetadataResponseSchema,
} from "@/app/lorebook/_lib/schema";
import {
  LOREBOOK_NEVER_TAG,
  LOREBOOK_TAG,
  OBSIDIAN_URL,
} from "@/lib/env-variables";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import path from "path";
import { Lorebook as LorebookEntity } from "../../../../generated/client";

export async function createLorebookDb(data: {
  name: string;
  apiKey: string;
  port: number;
}): Promise<LorebookEntity> {
  const entity = await prisma.lorebook.create({ data });
  revalidateTag(LOREBOOK_DB_CACHE_KEY, "max");
  return entity;
}

export async function getLorebookDbList(): Promise<LorebookEntity[]> {
  "use cache";
  cacheTag(LOREBOOK_DB_CACHE_KEY);

  return await prisma.lorebook.findMany();
}

export async function getLorebookDbById(
  id: string,
): Promise<LorebookEntity | null> {
  "use cache";
  cacheTag(`${LOREBOOK_DB_CACHE_KEY}-${id}`);

  return await prisma.lorebook.findUnique({ where: { id } });
}

export async function updateLorebookDb(
  id: string,
  data: Partial<{ name: string; apiKey: string; port: number }>,
): Promise<LorebookEntity> {
  const entity = await prisma.lorebook.update({ where: { id }, data });
  revalidateTag(LOREBOOK_DB_CACHE_KEY, "max");
  revalidateTag(`${LOREBOOK_DB_CACHE_KEY}-${id}`, "max");
  return entity;
}

export async function deleteLorebookDb(id: string): Promise<void> {
  await prisma.lorebook.delete({ where: { id } });
  revalidateTag(LOREBOOK_DB_CACHE_KEY, "max");
  revalidateTag(`${LOREBOOK_DB_CACHE_KEY}-${id}`, "max");
}

interface ApiConnection {
  port: number;
  apiKey: string;
}

interface CreateLorebookIndexParams {
  lorebook: {
    name: string;
  };
  api: ApiConnection;
}

export async function createLorebookIndex({
  lorebook,
  api,
}: CreateLorebookIndexParams) {
  const response = await fetch(`${OBSIDIAN_URL}:${api.port}/vault/llmn.json`, {
    headers: {
      Authorization: `Bearer ${api.apiKey}`,
    },
    method: "POST",
    body: JSON.stringify(lorebook),
  });

  if (!response.ok) {
    throw new Error("Failed to create lorebook index");
  }

  revalidateTag(LOREBOOK_TAG, "max");
  return true;
}

export async function getLorebookMetadata({
  api,
}: {
  api: ApiConnection;
}): Promise<ObsidianMetadataResponse | null> {
  "use cache";
  cacheTag(LOREBOOK_TAG);
  cacheLife("hours");

  const response = await fetch(`${OBSIDIAN_URL}:${api.port}/vault/llmn.json`, {
    headers: {
      Authorization: `Bearer ${api.apiKey}`,
    },
  });
  if (!response.ok) {
    console.error(
      `Lorebook Metadata Request failed. Status:${response.status} StatusText: ${response.statusText}`,
    );
    return null;
  }

  const metadata = obsidianMetadataResponseSchema.parse(await response.json());

  if (!metadata) throw new Error("undefined lorebook metadata");

  return metadata;
}

export async function getLorebook(
  {
    api,
  }: {
    api: ApiConnection;
  },
  { debug = false } = {},
): Promise<Lorebook> {
  "use cache";
  cacheTag(LOREBOOK_TAG);
  cacheLife("hours");

  // Get metadata
  let metadata: ObsidianMetadataResponse;
  try {
    const result = await getLorebookMetadata({ api });
    if (!result) {
      //missing lorebook metadata
      return { status: LorebookStatus.NotInitialized };
    }
    if ("errorCode" in result) {
      console.error(
        `unexpected lorebook metadata error. Error code: ${result.errorCode} Message: ${result.message}`,
      );
      throw new Error("failed to fetch lorebook index");
    }
    metadata = result;
  } catch (err) {
    console.error(err);
    return { status: LorebookStatus.ServerUnavailable };
  }

  // Get file index
  let index: GetLorebookIndexResposne;
  try {
    const indexResponse = await fetch(`${OBSIDIAN_URL}:${api.port}/search`, {
      headers: {
        Authorization: `Bearer ${api.apiKey}`,
        "Content-type": "application/vnd.olrapi.dataview.dql+txt",
      },
      method: "POST",
      body: `TABLE title, tags, keys, summary, constant, position FROM ${LOREBOOK_TAG} and !${LOREBOOK_NEVER_TAG} and !"system/Templates"`,
    });
    if (!indexResponse.ok) {
      console.error(
        `Lorebook index request failed. Status:${indexResponse.status} Status Text: ${indexResponse.statusText}`,
      );
      throw new Error("failed to fetch lorebook index");
    }
    index = getLorebookIndexResposneSchema.parse(await indexResponse.json());
  } catch (err) {
    console.error(err);
    return { status: LorebookStatus.ServerUnavailable };
  }

  // build lorebook
  const lorebook: Lorebook = {
    status: LorebookStatus.Ready,
    name: metadata.name,
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
  api: ApiConnection;
}

export async function getLorebookEntry({
  fileName,
  api,
}: GetLorebookEntryParams) {
  "use cache";
  cacheLife("hours");
  cacheTag("lorebook");

  const response = await fetch(
    `${OBSIDIAN_URL}:${api.port}/vault/${fileName}`,
    {
      headers: {
        Authorization: `Bearer ${api.apiKey}`,
        Accept: "application/vnd.olrapi.note+json",
      },
    },
  );

  const file = lorebookFileResponseSchema.parse(await response.json());
  if ("errorCode" in file) {
    throw new Error(
      `Lorebook file request failed. Status${response.status} StatusText: ${response.statusText}`,
    );
  }

  return file;
}

export async function getLorebookEntryList(
  files: string[],
  api: ApiConnection,
) {
  return Promise.all(
    files.map((fileName) => getLorebookEntry({ fileName, api })),
  );
}

export async function testLorebookConnection(api: ApiConnection) {
  const response = await fetch(`${OBSIDIAN_URL}:${api.port}/vault/`, {
    headers: {
      Authorization: `Bearer ${api.apiKey}`,
    },
  });
  console.log("response", response);
  if (!response.ok || response.status === 401) {
    throw new Error(
      `Lorebook connection failed. Status: ${response.status} StatusText: ${response.statusText}`,
    );
  }

  return true;
}
