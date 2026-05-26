import { crc32 } from "crc";
import fs from "fs/promises";
import PNGtext from "png-chunk-text";
import extract from "png-chunks-extract";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  encodeCharacterCard,
  getCacheKey,
  parseCharacterCard,
  readCharacterFromBuffer,
  writeCharacterToBuffer,
} from "@/app/character/_lib/character-card-parser";
import type { CharacterCard } from "@/app/character/_lib/schema";

vi.mock("fs/promises");

// Minimal valid 1×1 grayscale PNG
const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==",
  "base64",
);

// Minimal CharacterCard that satisfies the schema
const MINIMAL_CARD: CharacterCard = {
  avatar: "",
  chat: "",
  create_date: new Date("2024-01-01"),
  creatorcomment: "",
  description: "A test character",
  fav: false,
  first_mes: "Hello!",
  mes_example: "",
  name: "TestChar",
  personality: "",
  scenario: "",
  spec: "chara_card_v2",
  spec_version: "2.0",
  tags: [],
  talkativeness: "0.5",
};

/**
 * Assembles a valid PNG buffer from a set of chunks, inserting extras before IEND.
 * Uses the same CRC approach as the production encode() function.
 */
function buildTestPng(
  extraChunks: { name: string; data: Uint8Array }[],
): Buffer {
  const baseChunks = extract(new Uint8Array(MINIMAL_PNG));
  const iend = baseChunks.find((c) => c.name === "IEND")!;
  const withoutIend = baseChunks.filter((c) => c.name !== "IEND");
  const allChunks = [...withoutIend, ...extraChunks, iend];

  const PNG_SIG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const parts: Buffer[] = [PNG_SIG];

  for (const { name, data } of allChunks) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(name, "ascii");
    const dataBuf = Buffer.from(data);
    const crcValue = crc32(Buffer.concat([typeBuf, dataBuf]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcValue >>> 0);
    parts.push(lenBuf, typeBuf, dataBuf, crcBuf);
  }

  return Buffer.concat(parts);
}

describe("getCacheKey", () => {
  it("strips the .png extension", () => {
    expect(getCacheKey("characters/alice.png")).toBe("characters/alice");
  });

  it("leaves paths without .png unchanged", () => {
    expect(getCacheKey("characters/alice")).toBe("characters/alice");
  });
});

describe("writeCharacterToBuffer / readCharacterFromBuffer round-trip", () => {
  it("writes and reads back character data", () => {
    const data = JSON.stringify({ name: "Elara", description: "A mage" });
    const encoded = writeCharacterToBuffer(MINIMAL_PNG, data);
    const result = readCharacterFromBuffer(encoded);
    // writeCharacterToBuffer also injects spec/spec_version for CCv3; check originals survive
    expect(JSON.parse(result)).toMatchObject({ name: "Elara", description: "A mage" });
  });

  it("overwrites existing character chunks on re-encode", () => {
    const first = JSON.stringify({ name: "Elara" });
    const second = JSON.stringify({ name: "Kira" });
    const once = writeCharacterToBuffer(MINIMAL_PNG, first);
    const twice = writeCharacterToBuffer(once, second);
    const result = readCharacterFromBuffer(twice);
    expect(JSON.parse(result).name).toBe("Kira");
  });

  it("throws when no metadata is present", () => {
    expect(() => readCharacterFromBuffer(MINIMAL_PNG)).toThrow("No PNG metadata");
  });

  it("reads from a chara keyword when no ccv3 chunk is present", () => {
    // Lines 86-91: chara fallback path
    const charData = JSON.stringify({ name: "CharaOnly" });
    const base64 = Buffer.from(charData, "utf8").toString("base64");
    const pngWithCharaOnly = buildTestPng([PNGtext.encode("chara", base64)]);

    const result = readCharacterFromBuffer(pngWithCharaOnly);
    expect(JSON.parse(result)).toMatchObject({ name: "CharaOnly" });
  });

  it("throws when tEXt chunks are present but none are chara or ccv3", () => {
    // Line 93: neither chara nor ccv3 found
    const pngWithUnknown = buildTestPng([
      PNGtext.encode("comment", "some irrelevant text"),
    ]);

    expect(() => readCharacterFromBuffer(pngWithUnknown)).toThrow("No PNG metadata");
  });
});

describe("encodeCharacterCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reads the file, encodes the card, and writes it back", async () => {
    // Lines 23-34: PNG case — readFile → encode → writeFile
    vi.mocked(fs.readFile).mockResolvedValue(MINIMAL_PNG as never);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    await encodeCharacterCard({ cardPath: "/card.png", characterCard: MINIMAL_CARD });

    expect(fs.readFile).toHaveBeenCalledWith("/card.png");
    expect(fs.writeFile).toHaveBeenCalledWith("/card.png", expect.any(Buffer));

    // Verify the written buffer actually contains the card data
    const writtenBuffer = vi.mocked(fs.writeFile).mock.calls[0][1] as Buffer;
    const decoded = readCharacterFromBuffer(writtenBuffer);
    expect(JSON.parse(decoded)).toMatchObject({ name: "TestChar" });
  });

  it("defaults to png format when format is omitted", async () => {
    // Line 23: fileFormat = format ?? 'png'
    vi.mocked(fs.readFile).mockResolvedValue(MINIMAL_PNG as never);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    await expect(
      encodeCharacterCard({ cardPath: "/card.png", characterCard: MINIMAL_CARD }),
    ).resolves.toBeUndefined();
  });

  it("throws for unsupported formats", async () => {
    // Line 36: falls through switch → throws AppError
    await expect(
      encodeCharacterCard({
        cardPath: "/card.webp",
        characterCard: MINIMAL_CARD,
        format: "webp",
      }),
    ).rejects.toThrow("unsupported format");
  });
});

describe("parseCharacterCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reads the file and returns a parsed CharacterCard", async () => {
    // Lines 53-59: PNG case — readFile → readCharacterFromBuffer → parse
    const pngWithCard = writeCharacterToBuffer(
      MINIMAL_PNG,
      JSON.stringify(MINIMAL_CARD),
    );
    vi.mocked(fs.readFile).mockResolvedValue(pngWithCard as never);

    const result = await parseCharacterCard("/card.png");

    expect(fs.readFile).toHaveBeenCalledWith("/card.png");
    expect(result.name).toBe("TestChar");
    expect(result.description).toBe("A test character");
  });

  it("defaults to png format when format is omitted", async () => {
    // Line 53: fileFormat = format ?? 'png'
    const pngWithCard = writeCharacterToBuffer(
      MINIMAL_PNG,
      JSON.stringify(MINIMAL_CARD),
    );
    vi.mocked(fs.readFile).mockResolvedValue(pngWithCard as never);

    await expect(parseCharacterCard("/card.png")).resolves.toMatchObject({
      name: "TestChar",
    });
  });

  it("throws for unsupported formats", async () => {
    // Line 61: falls through switch → throws AppError
    await expect(parseCharacterCard("/card.webp", "webp")).rejects.toThrow(
      "unsupported format",
    );
  });
});
