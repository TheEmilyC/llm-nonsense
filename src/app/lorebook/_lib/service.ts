import { generateText, NoObjectGeneratedError, Output, stepCountIs } from "ai";
import z from "zod";

import {
  getLorebookById,
  getLorebookEntry,
  getLorebookEntryList,
} from "@/app/lorebook/_lib/data";
import { convertFilesToPrompt } from "@/app/lorebook/_lib/lorebook-scanning";
import {
  lorebookToolPrompt,
  lorebookUpdateDiscoveryPrompt,
  lorebookUpdateSuggestionPrompt,
  memoryArcInstructionPrompt,
} from "@/app/lorebook/_lib/prompts";
import {
  LorebookFact,
  LorebookReady,
  LorebookUpdateDiscoveryResult,
  lorebookUpdateDiscoveryResultSchema,
  LorebookUpdateSuggestion,
  lorebookUpdateSuggestionSchema,
} from "@/app/lorebook/_lib/schema";
import { makeGetLorebookEntriesTool } from "@/app/lorebook/_lib/tools";
import { PromptBuilder } from "@/app/prompt/_lib/prompt-builder";
import { taskModels } from "@/lib/ai-registry";
import { SIDE_PROMPT_TOKEN_LIMIT } from "@/lib/env-variables";
import { AppError, LlmError, NotFoundError } from "@/lib/error";
import { logger } from "@/lib/logger";

export interface GenerateLorebookUpdatesParams {
  facts: LorebookFact[];
  lorebookId: string;
}

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

interface GenerateUpdateSuggestionParams {
  applicableFacts: string[];
  lorebook: LorebookReady;
  lorebookEntryFile: string;
  previousError?: NoObjectGeneratedError;
}

export async function generateLorebookUpdates({
  facts,
  lorebookId,
}: GenerateLorebookUpdatesParams) {
  const lorebook = await getLorebookById(lorebookId);
  if (!lorebook) throw new NotFoundError("lorebook", lorebookId);
  if (lorebook.status !== "READY")
    throw new AppError("Lorebook is not ready", "INTERNAL_ERROR");
  const discoveredEntities = await generateLorebookUpdateDiscovery({
    facts,
    lorebook,
  });

  const results = await Promise.allSettled(
    discoveredEntities.entries.map((entry) => {
      const applicableFacts = entry.relevantFactIndices.map(
        (i) => `(${facts[i].confidence}) ${facts[i].claim}`,
      );
      const params = {
        applicableFacts,
        lorebook,
        lorebookEntryFile: entry.entryFilename,
      };
      return generateUpdateSuggestion(params)
        .catch((err) => {
          if (NoObjectGeneratedError.isInstance(err)) {
            return generateUpdateSuggestion({ ...params, previousError: err });
          }
          throw err;
        })
        .then((suggestions) => ({
          entryFilename: entry.entryFilename,
          suggestions,
        }));
    }),
  );

  return results.flatMap((result) => {
    if (result.status === "rejected") {
      logger.error("Failed to generate update suggestion", {
        reason: result.reason,
      });
      return [];
    }
    return [result.value];
  });
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
  await promptBuilder.addLorebookToPrompt(lorebook);
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

async function generateLorebookUpdateDiscovery({
  facts,
  lorebook,
}: {
  facts: LorebookFact[];
  lorebook: LorebookReady;
}): Promise<LorebookUpdateDiscoveryResult> {
  const promptBuilder = new PromptBuilder({
    maxTokens: SIDE_PROMPT_TOKEN_LIMIT,
    promptSkeleton: [
      {
        content: lorebookUpdateDiscoveryPrompt,
        role: "system",
        type: "CONTENT",
      },
      {
        content: "<extracted_facts>",
        role: "user",
        type: "CONTENT",
      },
      {
        content: facts
          .map((fact, index) => `[${index}] (${fact.confidence}) ${fact.claim}`)
          .join("\n"),
        role: "user",
        type: "CONTENT",
      },
      {
        content: "</extracted_facts>",
        role: "user",
        type: "CONTENT",
      },
      {
        content: "<lorebook_entries>",
        role: "user",
        type: "CONTENT",
      },
      {
        content: "",
        injectTag: "LOREBOOK_ENTRIES",
        role: "system",
        type: "INJECT",
      },
      {
        content: "</lorebook_entries>",
        role: "user",
        type: "CONTENT",
      },
    ],
  });
  await promptBuilder.addLorebookToPrompt(lorebook);
  const prompt = promptBuilder.build();
  logger.info("Lorebook update discovery request", { prompt });
  try {
    const { output } = await generateText({
      model: taskModels.lorebookUpdateDiscovery,
      onFinish: (result) => {
        logger.info("Lorebook update discovery result", {
          finisReasons: result.finishReason,
          result: result.content,
        });
      },
      output: Output.object({
        schema: lorebookUpdateDiscoveryResultSchema,
      }),
      prompt,
    });
    return output;
  } catch (err) {
    throw new LlmError((err as Error).message);
  }
}

async function generateUpdateSuggestion({
  applicableFacts,
  lorebook,
  lorebookEntryFile,
  previousError,
}: GenerateUpdateSuggestionParams): Promise<LorebookUpdateSuggestion[]> {
  const lorebookEntry = await getLorebookEntry({
    fileName: lorebookEntryFile,
    lorebookId: lorebook.id,
  });
  const content = convertFilesToPrompt([lorebookEntry]);
  const promptBuilder = new PromptBuilder({
    maxTokens: SIDE_PROMPT_TOKEN_LIMIT,
    promptSkeleton: [
      {
        content: lorebookUpdateSuggestionPrompt,
        role: "system",
        type: "CONTENT",
      },
      {
        content: `<existing_entry>${content}</existing_entry>`,
        role: "user",
        type: "CONTENT",
      },
      {
        content: `<discoverd_facts>${applicableFacts.map((fact) => `- ${fact}`).join("\n")}</discoverd_facts>`,
        role: "user",
        type: "CONTENT",
      },
      ...(previousError
        ? [
            {
              content: `Your previous response failed validation with this error: ${previousError.message}. The raw response was: ${previousError.text}. Try again, ensuring the output matches the schema.`,
              role: "user" as const,
              type: "CONTENT" as const,
            },
          ]
        : []),
    ],
  });
  const prompt = promptBuilder.build();
  logger.info("Lorebook update suggestion request", { prompt });
  try {
    const { output } = await generateText({
      model: taskModels.lorebookUpdateSuggestion,
      onFinish: (result) => {
        logger.info("Lorebook update suggestion result", {
          finisReasons: result.finishReason,
          result: result.content,
        });
      },
      output: Output.object({
        schema: z.object({
          suggestions: lorebookUpdateSuggestionSchema.array(),
        }),
      }),
      prompt,
      stopWhen: stepCountIs(5),
      tools: {
        getLorebookEntries: makeGetLorebookEntriesTool(lorebook),
      },
    });

    return output.suggestions;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) throw err;
    throw new LlmError((err as Error).message);
  }
}
