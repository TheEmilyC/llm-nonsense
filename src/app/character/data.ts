"use server";

import crypto from "crypto";
import fs from "fs/promises";
import { join } from "path";

import {
  CharacterCard,
  parseCharacterCard,
  writeCharacterToBuffer,
} from "@/lib/character-card-parser";
import { CHARACTER_CARD_DIRECTORY, DEFAULT_AVATAR_PATH } from "@/lib/constants";
import { WORKING_DIRECTORY } from "@/lib/env-variables";
import { prisma } from "@/lib/prisma";

const CHARACTER_CARD_PATH = join(WORKING_DIRECTORY, CHARACTER_CARD_DIRECTORY);

export interface CharacterListItem {
  id: string;
  name: string;
  pngHash: string;
}

export interface CharacterRecord {
  entity: {
    id: string;
    name: string;
    png: string;
    pngHash: string;
    createdAt: Date;
    modifiedAt: Date;
  };
  card: CharacterCard;
}

export async function getCharacterList(): Promise<CharacterListItem[]> {
  const characterList = await prisma.character.findMany();
  return characterList.map((char) => ({
    id: char.id,
    name: char.name,
    pngHash: char.pngHash,
  }));
}

export async function getCharacterById(
  id: string,
): Promise<CharacterRecord | null> {
  const entity = await prisma.character.findUnique({ where: { id } });
  if (!entity) return null;
  const card = await parseCharacterCard(join(WORKING_DIRECTORY, entity.png));
  return { entity, card };
}

export interface CreateCharacterParameters {
  characterCard: CharacterCard;
  image: File | Buffer | null;
}

export async function createCharacter({
  characterCard,
  image,
}: CreateCharacterParameters): Promise<CharacterRecord> {
  // Get image buffer
  let imageBuffer;
  if (image instanceof File)
    imageBuffer = Buffer.from(await image.arrayBuffer());
  else if (image instanceof Buffer) imageBuffer = image;
  else
    imageBuffer = await fs.readFile(
      join(WORKING_DIRECTORY, DEFAULT_AVATAR_PATH),
    );

  const encodedImageBuffer = writeCharacterToBuffer(
    imageBuffer,
    JSON.stringify(characterCard),
  );

  // save image
  await fs.mkdir(CHARACTER_CARD_PATH, { recursive: true });
  let fileName = `${characterCard.name}.png`;
  let filePath = join(CHARACTER_CARD_PATH, fileName);
  let counter = 1;
  while (
    await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false)
  ) {
    fileName = `${characterCard.name}${counter}.png`;
    filePath = join(CHARACTER_CARD_PATH, fileName);
    counter++;
  }
  await fs.writeFile(filePath, encodedImageBuffer);

  // write create character index in DB
  const pngHash = crypto
    .createHash("md5")
    .update(imageBuffer)
    .digest("hex")
    .slice(0, 8);
  const characterEntity = await prisma.character
    .create({
      data: {
        name: characterCard.name,
        png: join(CHARACTER_CARD_DIRECTORY, fileName),
        pngHash,
      },
    })
    .catch(async (err) => {
      //clean up file
      await fs.rm(filePath);
      throw err;
    });

  return { entity: characterEntity, card: characterCard };
}
