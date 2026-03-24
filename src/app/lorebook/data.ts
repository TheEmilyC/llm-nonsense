import { Lorebook, LorebookStatus } from "@/app/lorebook/types";
import {
  GetLorebookIndexResposne,
  getLorebookIndexResposneSchema,
  ObsidianValutResponse,
  obsidianValutResponseSchema,
} from "@/app/lorebook/validators";
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
    throw "Failed to create lorebook index";
  }

  return true;
}

export async function getLorebookMetadata(): Promise<ObsidianValutResponse | null> {
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

  const metadata = obsidianValutResponseSchema.parse(await response.json());

  if (!metadata) throw "undefined lorebook metadata";

  return metadata;
}

export async function getLorebook({ debug = false } = {}): Promise<Lorebook> {
  // Get metadata
  let metadata: ObsidianValutResponse;
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
      throw "failed to fetch lorebook index";
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
      throw "failed to fetch lorebook index";
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
        }))
      : [],
  };
  if (debug) {
    console.debug("Lorebook Index", JSON.stringify(lorebook, null, 2));
  }
  return lorebook;
}
