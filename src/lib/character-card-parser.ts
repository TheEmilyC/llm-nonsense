import { crc32 } from "crc";
import fs from "fs/promises";
import PNGtext from "png-chunk-text";
import extract from "png-chunks-extract";

export { characterCardSchema } from "@/lib/character-card-schema";
export type { CharacterCard } from "@/lib/character-card-schema";
import { type CharacterCard, characterCardSchema } from "@/lib/character-card-schema";

interface EncodeCharacterCardParam {
  cardPath: string;
  characterCard: CharacterCard;
  format?: string;
}

export async function encodeCharacterCard({
  cardPath,
  characterCard,
  format,
}: EncodeCharacterCardParam) {
  const fileFormat = format ?? "png";
  switch (fileFormat) {
    case "png":
      const buffer = await fs.readFile(cardPath);
      const characterString = JSON.stringify(characterCard);
      const encodedImageBuffer = writeCharacterToBuffer(
        buffer,
        characterString,
      );

      await fs.writeFile(cardPath, encodedImageBuffer);
      return;
  }
  throw new Error("unsupported format");
}

export function getCacheKey(inputFile: string) {
  return inputFile.replace(".png", "");
}

/**
 * Parses a card image and returns the character metadata
 * @param cardPath path to the card image
 * @param format card file format
 * @returns character data
 */
export async function parseCharacterCard(
  cardPath: string,
  format?: string,
): Promise<CharacterCard> {
  const fileFormat = format ?? "png";

  switch (fileFormat) {
    case "png":
      const buffer = await fs.readFile(cardPath);
      const rawCharacter = readCharacterFromBuffer(buffer);
      return characterCardSchema.parse(JSON.parse(rawCharacter));
  }
  throw Error("unsupported format");
}

/**
 * Read character metadata from a PNG image buffer.
 * @param image PNG image buffer
 * @returns character data
 */
export function readCharacterFromBuffer(image: Buffer): string {
  const chunks = extract(new Uint8Array(image));
  const textChunks = chunks
    .filter((chunk) => chunk.name === "tEXt")
    .map((chunk) => PNGtext.decode(chunk.data));

  if (textChunks.length === 0) {
    console.error("PNG metadata does not contain any text chunks");
    throw new Error("No PNG metadata");
  }

  const ccv3Index = textChunks.findIndex(
    (chunk) => chunk.keyword.toLowerCase() === "ccv3",
  );
  if (ccv3Index > -1) {
    return Buffer.from(textChunks[ccv3Index].text, "base64").toString("utf-8");
  }

  const charaIndex = textChunks.findIndex(
    (chunk) => chunk.keyword.toLowerCase() === "chara",
  );
  if (charaIndex > -1) {
    return Buffer.from(textChunks[charaIndex].text, "base64").toString("utf-8");
  }

  console.error("PNG metadta does not contain any character info");
  throw new Error("No PNG metadata");
}

export function writeCharacterToBuffer(image: Buffer, characterData: string) {
  const chunks = extract(new Uint8Array(image));
  const tEXtChunks = chunks.filter((chunk) => chunk.name === "tEXt");

  // remove existing chunks
  for (const tEXtChunk of tEXtChunks) {
    const data = PNGtext.decode(tEXtChunk.data);
    if (
      data.keyword.toLowerCase() === "chara" ||
      data.keyword.toLowerCase() === "ccv3"
    ) {
      chunks.splice(chunks.indexOf(tEXtChunk), 1);
    }
  }

  // Add V2 chunk
  const base64EncodedData = Buffer.from(characterData, "utf8").toString(
    "base64",
  );
  chunks.splice(-1, 0, PNGtext.encode("chara", base64EncodedData));

  // Try adding v3 Chunk
  try {
    //change v2 format to v3
    const v3Data = JSON.parse(characterData);
    v3Data.spec = "chara_card_v3";
    v3Data.spec_version = "3.0";

    const base64EncodedData = Buffer.from(
      JSON.stringify(v3Data),
      "utf8",
    ).toString("base64");
    chunks.splice(-1, 0, PNGtext.encode("ccv3", base64EncodedData));
  } catch {
    // ignore errors
  }

  return Buffer.from(encode(chunks));
}

/**
 * Encodes PNG chunks into a PNG file format buffer.
 * @param {Array<{ name: string; data: Uint8Array }>} chunks Array of PNG chunks
 * @returns {Uint8Array} Encoded PNG data
 * @copyright Based on https://github.com/hughsk/png-chunks-encode (MIT)
 */
function encode(
  chunks: {
    data: Uint8Array;
    name: string;
  }[],
) {
  const uint8 = new Uint8Array(4);
  const int32 = new Int32Array(uint8.buffer);
  const uint32 = new Uint32Array(uint8.buffer);

  let totalSize = 8;
  let idx = totalSize;

  for (let i = 0; i < chunks.length; i++) {
    totalSize += chunks[i].data.length;
    totalSize += 12;
  }

  const output = new Uint8Array(totalSize);

  output[0] = 0x89;
  output[1] = 0x50;
  output[2] = 0x4e;
  output[3] = 0x47;
  output[4] = 0x0d;
  output[5] = 0x0a;
  output[6] = 0x1a;
  output[7] = 0x0a;

  for (let i = 0; i < chunks.length; i++) {
    const { data, name } = chunks[i];
    const size = data.length;
    const nameChars = [
      name.charCodeAt(0),
      name.charCodeAt(1),
      name.charCodeAt(2),
      name.charCodeAt(3),
    ];

    uint32[0] = size;
    output[idx++] = uint8[3];
    output[idx++] = uint8[2];
    output[idx++] = uint8[1];
    output[idx++] = uint8[0];

    output[idx++] = nameChars[0];
    output[idx++] = nameChars[1];
    output[idx++] = nameChars[2];
    output[idx++] = nameChars[3];

    for (let j = 0; j < size; ) {
      output[idx++] = data[j++];
    }

    const crc = crc32(Buffer.from(data), crc32(Buffer.from(nameChars)));

    int32[0] = crc;
    output[idx++] = uint8[3];
    output[idx++] = uint8[2];
    output[idx++] = uint8[1];
    output[idx++] = uint8[0];
  }

  return output;
}
