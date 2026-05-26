import { ObsidianFile } from "@/app/lorebook/_lib/schema";
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
  caseSensitive?: boolean;
  index: IndexEntry[];
  scanText: string;
  wholeWords?: boolean;
}

export function convertFilesToPrompt(files: ObsidianFile[]) {
  return files
    .map((file) => {
      const content = stripFrontMatter(file.content);
      const links = file.links.join(", ");
      const backLinks = file.backlinks.join(", ");

      return [
        `# ${file.path}`,
        content,
        "---",
        `**Outgoing links:** [${links}]`,
        `**Backlinks:** [${backLinks}]`,
      ].join("\n\n");
    })
    .join("\n\n");
}

export function extractFirstHeader(str: string): null | string {
  const match = str.match(/^#{1,6}\s+(.+)/m);
  return match ? match[1].trim() : null;
}

export function scanLorebookIndex({
  caseSensitive,
  index,
  scanText,
  wholeWords,
}: ScanLorebookIndexParams) {
  const scanCaseSensitive = caseSensitive ?? LOREBOOK_CASE_SENSITIVE;
  const scanWholeWords = wholeWords ?? LOREBOOK_MATCH_WHOLE_WORDS;

  const indexList = index
    .filter((index) =>
      testIndexMatch(scanText, index, scanWholeWords, scanCaseSensitive),
    )
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
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Removes frontmatter YAML from the start of a file
 * @param str
 * @returns
 */
function stripFrontMatter(str: string) {
  return str.replace(/^---[\s\S]*?---/g, "").trim();
}

function testIndexMatch(
  scanText: string,
  index: IndexEntry,
  wholeWords?: boolean,
  caseSensitive?: boolean,
): boolean {
  if (index.constant) return true;
  if (index.keys.length === 0) return false;

  const scanTextFormatted = caseSensitive ? scanText : scanText.toLowerCase();

  for (const rawKey of index.keys) {
    const key = caseSensitive ? rawKey : rawKey.toLowerCase();
    if (wholeWords) {
      const regex = new RegExp(
        `\\b${escapeRegex(key)}\\b`,
        caseSensitive ? "" : "i",
      );
      if (regex.test(scanTextFormatted)) return true;
    } else {
      if (scanTextFormatted.includes(key)) return true;
    }
  }
  return false;
}
