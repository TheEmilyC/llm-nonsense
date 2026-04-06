import {
  LOREBOOK_CASE_SENSITIVE,
  LOREBOOK_MATCH_WHOLE_WORDS,
  LOREBOOK_MAX_MATCHES,
} from "@/lib/constants";
import path from "path";

export interface IndexEntry {
  constant?: boolean;
  keys: string[];
  position: number;
  filename: string;
  summary: string;
}

/**
 * Escape a string for use in a regex.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface ScanLorebookIndexParams {
  scanText: string;
  index: IndexEntry[];
}

/**
 * Removes frontmatter YAML from the start of a file
 * @param str
 * @returns
 */
function stripFrontMatter(str: string) {
  return str.replace(/^---[\s\S]*?---/g, "").trim();
}

/**
 * Extracts the leading header
 * @param str
 * @returns Returns the str without the header if present, and the found header without markup
 */
function extractHeader(str: string) {
  let header: string | null = null;
  const headerRegex = /^#\s+(.*)\n?/;
  const match = str.match(headerRegex);
  if (match) {
    header = match[1].trim();
  }
  const cleanedText = str.replace(headerRegex, "").trim();

  return { cleanedText, header };
}

export function scanLorebookIndex({
  scanText,
  index,
}: ScanLorebookIndexParams) {
  const scanTextFormatted = LOREBOOK_CASE_SENSITIVE
    ? scanText
    : scanText.toLowerCase();

  const indexList = index
    .filter((index) => testIndexMatch(scanTextFormatted, index))
    .sort((a, b) => a.position - b.position)
    .slice(0, LOREBOOK_MAX_MATCHES)
    .map((index) => index.filename);

  return indexList;
}

function testIndexMatch(scanText: string, index: IndexEntry): boolean {
  if (index.constant) return true;
  if (index.keys.length === 0) return false;

  for (const rawKey of index.keys) {
    const key = LOREBOOK_CASE_SENSITIVE ? rawKey : rawKey.toLowerCase();
    if (LOREBOOK_MATCH_WHOLE_WORDS) {
      const regex = new RegExp(
        `\\b${escapeRegex(key)}\\b`,
        LOREBOOK_CASE_SENSITIVE ? "" : "i",
      );
      if (regex.test(scanText)) return true;
    } else {
      if (scanText.includes(key)) return true;
    }
  }
  return false;
}

interface ConvertFilesToPromptParams {
  files: { content: string; title?: string; path: string }[];
}

export function convertFilesToPrompt({ files }: ConvertFilesToPromptParams) {
  const lorebookPrompt = files.reduce((acc, file) => {
    const fileText = stripFrontMatter(file.content);
    const { cleanedText, header } = extractHeader(fileText);
    const title = file.title || header || path.basename(file.path);
    return acc + `<${title}>${cleanedText}</${title}>`;
  }, "");

  return lorebookPrompt;
}
