export const ENVIRONMENT = process.env.NODE_ENV;
export const DATABASE_URL = process.env.DATABASE_URL ?? "";
export const WORKING_DIRECTORY = process.cwd();
export const OBSIDIAN_URL = process.env.OBSIDIAN_URL ?? "http://127.0.0.1";
export const SIDE_PROMPT_TOKEN_LIMIT =
  Number(process.env.SIDE_PROMPT_TOKEN_LIMIT) ?? 40000;

// -- Lorebooks
export const LOREBOOK_TAG = process.env.LOREBOOK_TAG ?? "#lorebook";
export const LOREBOOK_ALWAYS_TAG =
  process.env.LOREBOOK_ALWAYS_TAG ?? "lorebook-always";
export const LOREBOOK_CONTEXT_TAG =
  process.env.LOREBOOK_CONTEXT_TAG ?? "lorebook-context";
export const LOREBOOK_NEVER_TAG =
  process.env.LOREBOOK_NEVER_TAG ?? "lorebook-never";
export const LOREBOOK_MEMORY_TAG =
  process.env.LOREBOOK_MEMORY_TAG ?? "lorebook-memory";
export const LOREBOOK_TEMPLATES_FOLDER =
  process.env.LOREBOOK_TEMPLATES_FOLDER ?? "System/Templates";
export const LOREBOOK_CAST_TAG =
  process.env.LOREBOOK_CAST_TAG ?? "lorebook-cast";
