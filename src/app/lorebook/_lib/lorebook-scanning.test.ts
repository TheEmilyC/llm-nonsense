import { describe, expect, it } from "vitest";

import {
  convertFilesToPrompt,
  extractFirstHeader,
  type IndexEntry,
  scanLorebookIndex,
} from "@/app/lorebook/_lib/lorebook-scanning";
import { ObsidianFile } from "@/app/lorebook/_lib/schema";

// Constants in effect: case-insensitive, no whole-word matching, max 15 matches

function makeEntry(overrides: Partial<IndexEntry> = {}): IndexEntry {
  return {
    filename: "entry.md",
    keys: ["dragon"],
    position: 0,
    summary: "",
    ...overrides,
  };
}

function makeFile(overrides: Partial<ObsidianFile> = {}): ObsidianFile {
  return {
    backlinks: [],
    content: "Some content",
    frontmatter: {} as ObsidianFile["frontmatter"],
    links: [],
    path: "file.md",
    stat: { ctime: new Date(), mtime: new Date(), size: 0 },
    tags: [],
    ...overrides,
  };
}

describe("scanLorebookIndex", () => {
  it("returns empty array when nothing matches", () => {
    const index = [makeEntry({ keys: ["dragon"] })];
    expect(scanLorebookIndex({ index, scanText: "no match here" })).toEqual([]);
  });

  it("returns filename of matched entry", () => {
    const index = [makeEntry({ filename: "dragon.md", keys: ["dragon"] })];
    expect(scanLorebookIndex({ index, scanText: "the dragon roars" })).toEqual([
      "dragon.md",
    ]);
  });

  it("matches case-insensitively", () => {
    const index = [makeEntry({ filename: "dragon.md", keys: ["Dragon"] })];
    expect(scanLorebookIndex({ index, scanText: "a DRAGON appears" })).toEqual([
      "dragon.md",
    ]);
  });

  it("matches substrings (no whole-word requirement)", () => {
    const index = [makeEntry({ filename: "drag.md", keys: ["drag"] })];
    expect(scanLorebookIndex({ index, scanText: "the dragon" })).toEqual([
      "drag.md",
    ]);
  });

  it("sorts results by position ascending", () => {
    const index = [
      makeEntry({ filename: "b.md", keys: ["beta"], position: 2 }),
      makeEntry({ filename: "a.md", keys: ["alpha"], position: 1 }),
    ];
    const result = scanLorebookIndex({
      index,
      scanText: "alpha and beta",
    });
    expect(result).toEqual(["a.md", "b.md"]);
  });

  it("respects LOREBOOK_MAX_MATCHES (15)", () => {
    const index = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ filename: `entry${i}.md`, keys: [`key${i}`], position: i }),
    );
    const scanText = index.map((e) => e.keys[0]).join(" ");
    const result = scanLorebookIndex({ index, scanText });
    expect(result).toHaveLength(15);
  });

  it("always includes constant entries regardless of scan text", () => {
    const index = [
      makeEntry({ constant: true, filename: "always.md", keys: [] }),
    ];
    expect(scanLorebookIndex({ index, scanText: "nothing relevant" })).toEqual([
      "always.md",
    ]);
  });

  it("skips entries with no keys when not constant", () => {
    const index = [makeEntry({ filename: "empty.md", keys: [] })];
    expect(scanLorebookIndex({ index, scanText: "anything" })).toEqual([]);
  });

  it("matches on any key in the list", () => {
    const index = [makeEntry({ filename: "multi.md", keys: ["wolf", "fox"] })];
    expect(scanLorebookIndex({ index, scanText: "a cunning fox" })).toEqual([
      "multi.md",
    ]);
  });

  describe("caseSensitive: true", () => {
    it("matches when case is exact", () => {
      const index = [makeEntry({ filename: "dragon.md", keys: ["Dragon"] })];
      expect(
        scanLorebookIndex({
          caseSensitive: true,
          index,
          scanText: "a Dragon appears",
        }),
      ).toEqual(["dragon.md"]);
    });

    it("does not match when case differs", () => {
      const index = [makeEntry({ filename: "dragon.md", keys: ["Dragon"] })];
      expect(
        scanLorebookIndex({
          caseSensitive: true,
          index,
          scanText: "a dragon appears",
        }),
      ).toEqual([]);
    });

    it("combines with wholeWords: true and matches exact case whole word", () => {
      const index = [makeEntry({ filename: "dragon.md", keys: ["Dragon"] })];
      expect(
        scanLorebookIndex({
          caseSensitive: true,
          index,
          scanText: "a Dragon appears",
          wholeWords: true,
        }),
      ).toEqual(["dragon.md"]);
    });

    it("combines with wholeWords: true and rejects a substring even with correct case", () => {
      const index = [makeEntry({ filename: "drag.md", keys: ["Drag"] })];
      expect(
        scanLorebookIndex({
          caseSensitive: true,
          index,
          scanText: "a Dragon flies",
          wholeWords: true,
        }),
      ).toEqual([]);
    });
  });

  describe("testWholeWords: true", () => {
    it("matches a key that appears as a standalone word", () => {
      const index = [makeEntry({ filename: "dragon.md", keys: ["dragon"] })];
      expect(
        scanLorebookIndex({
          index,
          scanText: "the dragon roars",
          wholeWords: true,
        }),
      ).toEqual(["dragon.md"]);
    });

    it("does not match a key that only appears as a substring", () => {
      const index = [makeEntry({ filename: "drag.md", keys: ["drag"] })];
      expect(
        scanLorebookIndex({
          index,
          scanText: "the dragon flies",
          wholeWords: true,
        }),
      ).toEqual([]);
    });

    it("matches case-insensitively on whole words", () => {
      const index = [makeEntry({ filename: "dragon.md", keys: ["Dragon"] })];
      expect(
        scanLorebookIndex({
          index,
          scanText: "a DRAGON appears",
          wholeWords: true,
        }),
      ).toEqual(["dragon.md"]);
    });

    it("escapes regex special characters in keys", () => {
      const index = [makeEntry({ filename: "spell.md", keys: ["fire+ice"] })];
      expect(
        scanLorebookIndex({
          index,
          scanText: "cast fire+ice now",
          wholeWords: true,
        }),
      ).toEqual(["spell.md"]);
    });
  });
});

describe("extractFirstHeader", () => {
  it("returns the text of an h1 header", () => {
    expect(extractFirstHeader("# Hello World")).toBe("Hello World");
  });

  it("returns the text of h2 through h6 headers", () => {
    expect(extractFirstHeader("## Section")).toBe("Section");
    expect(extractFirstHeader("### Sub")).toBe("Sub");
    expect(extractFirstHeader("###### Tiny")).toBe("Tiny");
  });

  it("returns null when there is no header", () => {
    expect(extractFirstHeader("just some plain text")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractFirstHeader("")).toBeNull();
  });

  it("returns the first header when multiple are present", () => {
    expect(extractFirstHeader("# First\n## Second\n# Third")).toBe("First");
  });

  it("finds a header that is not on the first line", () => {
    expect(extractFirstHeader("intro text\n# Mid-doc Header")).toBe(
      "Mid-doc Header",
    );
  });

  it("trims trailing whitespace from the header text", () => {
    expect(extractFirstHeader("# Padded   ")).toBe("Padded");
  });

  it("returns null when # is not followed by whitespace (e.g. hashtag)", () => {
    expect(extractFirstHeader("#hashtag no space")).toBeNull();
  });

  it("returns null for seven or more hashes", () => {
    expect(extractFirstHeader("####### Too deep")).toBeNull();
  });

  it("returns null for a header marker with no text", () => {
    expect(extractFirstHeader("# ")).toBeNull();
  });
});

describe("convertFilesToPrompt", () => {
  it("formats a file with its path as a header", () => {
    const result = convertFilesToPrompt([
      makeFile({ path: "notes/dragon.md" }),
    ]);
    expect(result).toContain("# notes/dragon.md");
  });

  it("includes file content (without frontmatter)", () => {
    const file = makeFile({
      content: "---\ntitle: Test\n---\nActual content here",
    });
    const result = convertFilesToPrompt([file]);
    expect(result).toContain("Actual content here");
    expect(result).not.toContain("title: Test");
  });

  it("formats outlinks and inlinks", () => {
    const file = makeFile({
      backlinks: ["target.md"],
      links: ["origin.md"],
    });
    const result = convertFilesToPrompt([file]);
    expect(result).toContain("Outgoing links:");
    expect(result).toContain("origin.md");
    expect(result).toContain("Backlinks:");
    expect(result).toContain("target.md");
  });

  it("uses display name in link label when present", () => {
    const file = makeFile({
      backlinks: ["dragon.md"],
    });
    const result = convertFilesToPrompt([file]);
    expect(result).toContain("dragon.md");
  });

  it("joins multiple files with double newlines", () => {
    const files = [makeFile({ path: "a.md" }), makeFile({ path: "b.md" })];
    const result = convertFilesToPrompt(files);
    expect(result).toContain("# a.md");
    expect(result).toContain("# b.md");
  });
});
