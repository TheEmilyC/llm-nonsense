// -- Images --
export const MAX_CHARACTER_IMAGE_SIZE_MB = 15;
export const MAX_CHARACTER_IMAGE_SIZE =
  MAX_CHARACTER_IMAGE_SIZE_MB * 1024 * 1024; //15MB, Some characters have integrated lorebooks that can be quite large

// -- Directories --
export const DEFAULT_AVATAR_PATH = "/public/image/ai4.png";
export const CHARACTER_CARD_DIRECTORY = "data/characters";
export const PERSONA_DIRECTORY = "data/personas";
export const WORLD_DIRECTORY = "data/worlds";

// -- Lorebook --
export const LOREBOOK_CASE_SENSITIVE = false;
export const LOREBOOK_MATCH_WHOLE_WORDS = false;
export const LOREBOOK_MAX_MATCHES = 15;
