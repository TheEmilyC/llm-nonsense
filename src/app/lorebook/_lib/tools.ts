import { tool } from "ai";
import z from "zod";

import { getLorebookEntryList } from "@/app/lorebook/_lib/data";
import { convertFilesToPrompt } from "@/app/lorebook/_lib/lorebook-scanning";
import { LorebookReady } from "@/app/lorebook/_lib/schema";

export function makeGetLorebookEntriesTool(lorebook: LorebookReady) {
  return tool({
    description: "Retrieve lore and character information from the lorebook",
    execute: async ({ entries }) => {
      const files = await getLorebookEntryList({
        files: entries,
        lorebookId: lorebook.id,
      });
      return convertFilesToPrompt(files);
    },
    inputSchema: z.object({
      entries: z
        .string()
        .array()
        .describe("A list of lorebook entry paths to retrieve"),
    }),
  });
}
