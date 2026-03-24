export const ENVIRONMENT = process.env.NODE_ENV;
export const DATABASE_URL = process.env.DATABASE_URL ?? "";
export const WORKING_DIRECTORY = process.cwd();
export const OBSIDIAN_API_KEY = process.env.OBSIDIAN_API_KEY ?? "";
export const OBSIDIAN_URL =
  process.env.OBSIDIAN_URL ?? "http://127.0.0.1:27123";

export const LOREBOOK_TAG = process.env.LOREBOOK_TAG ?? "#lorebook";
export const LOREBOOK_ALWAYS_TAG =
  process.env.LOREBOOK_ALWAYS_TAG ?? "#lorebook-always";

export const LOREBOOK_NEVER_TAG =
  process.env.LOREBOOK_NEVER_TAG ?? "#lorebook-never";
