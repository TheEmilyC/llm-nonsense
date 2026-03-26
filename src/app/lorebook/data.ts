import {
  GetLorebookIndexResposne,
  getLorebookIndexResposneSchema,
  Lorebook,
  lorebookFileResponseSchema,
  LorebookStatus,
  ObsidianMetadataResponse,
  obsidianMetadataResponseSchema,
} from "@/app/lorebook/schema";
import {
  LOREBOOK_NEVER_TAG,
  LOREBOOK_TAG,
  OBSIDIAN_API_KEY,
  OBSIDIAN_URL,
} from "@/lib/env-variables";
import path from "path";

interface CreateLorebookIndexParams {
  lorebook: {
    name: string;
  };
}

export async function createLorebookIndex({
  lorebook,
}: CreateLorebookIndexParams) {
  const response = await fetch(`${OBSIDIAN_URL}/vault/llmn.json`, {
    headers: {
      Authorization: `Bearer ${OBSIDIAN_API_KEY}`,
    },
    method: "POST",
    body: JSON.stringify(lorebook),
  });

  if (!response.ok) {
    throw new Error("Failed to create lorebook index");
  }

  return true;
}

export async function getLorebookMetadata(): Promise<ObsidianMetadataResponse | null> {
  const response = await fetch(`${OBSIDIAN_URL}/vault/llmn.json`, {
    headers: {
      Authorization: `Bearer ${OBSIDIAN_API_KEY}`,
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

export async function getLorebook({ debug = false } = {}): Promise<Lorebook> {
  // Get metadata
  let metadata: ObsidianMetadataResponse;
  try {
    const result = await getLorebookMetadata();
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
    const indexResponse = await fetch(`${OBSIDIAN_URL}/search`, {
      headers: {
        Authorization: `Bearer ${OBSIDIAN_API_KEY}`,
        "Content-type": "application/vnd.olrapi.dataview.dql+txt",
      },
      method: "POST",
      body: `TABLE title, tags, keys, summary FROM ${LOREBOOK_TAG} and !${LOREBOOK_NEVER_TAG} and !"system/Templates"`,
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
          constant: idx.result.constant,
          position: idx.result.position ?? 10,
        }))
      : [],
  };
  if (debug) {
    console.debug("Lorebook Index", JSON.stringify(lorebook, null, 2));
  }
  return lorebook;
}

export async function getLorebookEntry(fileName: string) {
  //"use cache";
  //cacheLife("hours");
  //cacheTag("lorebook");
  console.log(`getLorebookEntry:${fileName}`);
  const response = await fetch(`${OBSIDIAN_URL}/vault/${fileName}`, {
    headers: {
      Authorization: `Bearer ${OBSIDIAN_API_KEY}`,
      Accept: "application/vnd.olrapi.note+json",
    },
  });

  const file = lorebookFileResponseSchema.parse(await response.json());
  console.log("file", file);
  if ("errorCode" in file) {
    throw new Error(
      `Lorebook file request failed. Status${response.status} StatusText: ${response.statusText}`,
    );
  }

  return file;
}

export async function getLorebookEntryList(files: string[]) {
  return Promise.all(files.map((file) => getLorebookEntry(file)));
}
