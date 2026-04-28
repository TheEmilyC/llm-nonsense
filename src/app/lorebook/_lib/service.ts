import { generateText, Output, stepCountIs } from "ai";
import z from "zod";

import {
  getLorebookById,
  getLorebookEntryList,
} from "@/app/lorebook/_lib/data";
import { convertFilesToPrompt } from "@/app/lorebook/_lib/lorebook-scanning";
import {
  lorebookToolPrompt,
  memoryArcInstructionPrompt,
} from "@/app/lorebook/_lib/prompts";
import { makeGetLorebookEntriesTool } from "@/app/lorebook/_lib/tools";
import { PromptBuilder } from "@/app/prompt/_lib/prompt-builder";
import { taskModels } from "@/lib/ai-registry";
import { SIDE_PROMPT_TOKEN_LIMIT } from "@/lib/env-variables";
import { AppError, LlmError, NotFoundError } from "@/lib/error";
import { logger } from "@/lib/logger";

export interface GenerateMemoryArcResult {
  arcs: {
    content: string;
    synopsis: string;
  }[];
  unassignedMemories: {
    reason: string;
    title: string;
  };
}

export async function generateMemoryArc(lorebookId: string, files: string[]) {
  const lorebook = await getLorebookById(lorebookId);
  if (!lorebook) throw new NotFoundError("lorebook", lorebookId);
  if (lorebook.status !== "READY")
    throw new AppError("Lorebook is not ready", "INTERNAL_ERROR");
  const lbEntries = await getLorebookEntryList({ files, lorebookId });
  const memories = `<memories>${convertFilesToPrompt(lbEntries)}</memories>`;
  const promptBuilder = new PromptBuilder({
    maxTokens: SIDE_PROMPT_TOKEN_LIMIT,
    promptSkeleton: [
      {
        content: memoryArcInstructionPrompt,
        role: "system",
        type: "CONTENT",
      },
      {
        content: `<lore>${lorebookToolPrompt}`,
        role: "system",
        type: "CONTENT",
      },
      {
        content: "",
        injectTag: "LOREBOOK_ENTRIES",
        role: "system",
        type: "INJECT",
      },
      {
        content: `</lore>`,
        role: "system",
        type: "CONTENT",
      },
      {
        content: memories,
        role: "user",
        type: "CONTENT",
      },
    ],
  });
  const prompt = promptBuilder.build();
  logger.info("Memory arc request", { prompt });
  try {
    const { output } = await generateText({
      model: taskModels.summary,
      onFinish: (result) => {
        logger.info("Memory arc result", {
          finisReasons: result.finishReason,
          result: result.content,
        });
      },
      output: Output.object({
        schema: z.object({
          arcs: z
            .object({
              content: z.string(),
              synopsis: z
                .string()
                .describe(
                  "One or two sentences to describe the arc in an index",
                ),
            })
            .array(),
          unassignedMemories: z.object({
            reason: z
              .string()
              .describe(
                "Brief explanation of why this memory does not fit the produced arcs.",
              ),
            title: z.string().describe("The <title> of the unassigned memory"),
          }),
        }),
      }),
      prompt,
      providerOptions: {
        openrouter: {
          reasoning: { effort: "medium" },
        },
      },
      stopWhen: stepCountIs(20),
      tools: {
        getLorebookEntries: makeGetLorebookEntriesTool(lorebook),
      },
    });
    return output;
  } catch (err) {
    throw new LlmError((err as Error).message);
  }
}
