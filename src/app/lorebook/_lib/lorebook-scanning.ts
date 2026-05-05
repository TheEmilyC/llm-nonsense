import { LorebookEntryFile } from "@/app/lorebook/_lib/schema";
import {
  LOREBOOK_CASE_SENSITIVE,
  LOREBOOK_MATCH_WHOLE_WORDS,
  LOREBOOK_MAX_MATCHES,
} from "@/lib/constants";

export interface IndexEntry {
  constant?: boolean;
  filename: string;
  keys: string[];
  position: number;
  summary: string;
}

interface ScanLorebookIndexParams {
  index: IndexEntry[];
  scanText: string;
}

export function convertFilesToPrompt(files: LorebookEntryFile[]) {
  return files
    .map((file) => {
      const content = stripFrontMatter(file.content);
      const outlinks = file.outlinks
        .map((l) => `${l.display}(${l.path})`)
        .join(", ");
      const inlinks = file.inlinks
        .map((l) => `${l.display}(${l.path})`)
        .join(", ");

      return [
        `# ${file.path}`,
        content,
        "---",
        `**Outgoing links:** ${outlinks}`,
        `**Backlinks:** ${inlinks}`,
      ].join("\n\n");
    })
    .join("\n\n");
}

export function scanLorebookIndex({
  index,
  scanText,
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

/**
 * Escape a string for use in a regex.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extracts the leading header
 * @param str
 * @returns Returns the str without the header if present, and the found header without markup
 */
function extractHeader(str: string) {
  let header: null | string = null;
  const headerRegex = /^#\s+(.*)\n?/;
  const match = str.match(headerRegex);
  if (match) {
    header = match[1].trim();
  }
  const cleanedText = str.replace(headerRegex, "").trim();

  return { cleanedText, header };
}

/**
 * Removes frontmatter YAML from the start of a file
 * @param str
 * @returns
 */
function stripFrontMatter(str: string) {
  return str.replace(/^---[\s\S]*?---/g, "").trim();
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
