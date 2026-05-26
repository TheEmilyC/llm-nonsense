import { describe, expect, it } from "vitest";

import {
  convertFilesToPrompt,
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
