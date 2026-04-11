import crypto from "crypto";

export function buildCharacterImageUrl({
  id,
  pngHash,
}: {
  id: string;
  pngHash: string;
}): string {
  return `/api/character/${id}/image?v=${pngHash}`;
}

export function buildPersonaImageUrl({
  id,
  imageHash: imageHash,
}: {
  id: string;
  imageHash: string;
}): string {
  return `/api/persona/${id}/image?v=${imageHash}`;
}

export function buildWorldImageUrl({
  id,
  imgHash,
}: {
  id: string;
  imgHash: string;
}): string {
  return `/api/world/${id}/image?v=${imgHash}`;
}

export function createImageHash(imageBuffer: Buffer) {
  return crypto.createHash("md5").update(imageBuffer).digest("hex").slice(0, 8);
}
