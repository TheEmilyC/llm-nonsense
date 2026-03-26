"use server";

import fs from "fs/promises";
import { join } from "path";

import {
  CHARACTER_CACHE_KEY,
  CharacterListItem,
  CharacterRecord,
} from "@/app/character/schema";
import {
  CharacterCard,
  encodeCharacterCard,
  parseCharacterCard,
  writeCharacterToBuffer,
} from "@/lib/character-card-parser";
import { CHARACTER_CARD_DIRECTORY, DEFAULT_AVATAR_PATH } from "@/lib/constants";
import { WORKING_DIRECTORY } from "@/lib/env-variables";
import { createImageHash } from "@/lib/image";
import { prisma } from "@/lib/prisma";
import { cacheTag, revalidateTag } from "next/cache";

const CHARACTER_CARD_PATH = join(WORKING_DIRECTORY, CHARACTER_CARD_DIRECTORY);

export async function getCharacterList(): Promise<CharacterListItem[]> {
  "use cache";
  cacheTag(CHARACTER_CACHE_KEY);
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
  "use cache";
  cacheTag(CHARACTER_CACHE_KEY);

  const entity = await prisma.character.findUnique({ where: { id } });
  if (!entity) return null;
  const card = await parseCharacterCard(join(WORKING_DIRECTORY, entity.png));
  return { entity, card };
}

export async function getCharacterByIdOrFail(
  id: string,
): Promise<CharacterRecord> {
  const result = await getCharacterById(id);
  if (!result) throw new Error(`Character ID:${id} does not exist`);
  return result;
}

export interface CreateCharacterParameters {
  characterCard: CharacterCard;
  image: File | Buffer | undefined;
}

export async function createCharacter({
  characterCard,
  image,
}: CreateCharacterParameters): Promise<CharacterRecord> {
  const { fileName, filePath, pngHash } = await saveCharacterImage({
    characterCard,
    image,
  });
  // write create character index in DB
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

  revalidateTag(CHARACTER_CACHE_KEY, "max");
  return { entity: characterEntity, card: characterCard };
}

export async function deleteCharacter(id: string) {
  const character = await getCharacterById(id);
  if (!character) {
    throw new Error("Character does not exist");
  }
  // remove entity
  await prisma.character.delete({ where: { id } });
  // remove image
  await fs.rm(join(WORKING_DIRECTORY, character.entity.png));
  revalidateTag(CHARACTER_CACHE_KEY, "max");
}

export interface UpdateCharacterParameters {
  id: string;
  update: {
    card?: Partial<CharacterCard>;
    image?: File;
  };
}

export async function updateCharacter({
  id,
  update,
}: UpdateCharacterParameters) {
  const orgCharacter = await getCharacterById(id);
  if (!orgCharacter) throw new Error("Character does not exist");
  const cardPath = join(WORKING_DIRECTORY, orgCharacter.entity.png);
  const updatedCard: CharacterCard = { ...orgCharacter.card, ...update.card };

  let pngHash;
  if (update.image) {
    //overwrite image
    const imageBuffer = Buffer.from(await update.image.arrayBuffer());
    const encodedImageBuffer = writeCharacterToBuffer(
      imageBuffer,
      JSON.stringify(updatedCard),
    );
    await fs.writeFile(cardPath, encodedImageBuffer);
    pngHash = createImageHash(encodedImageBuffer);
  } else {
    //overwrite image metadata
    await encodeCharacterCard({ cardPath, characterCard: updatedCard });
  }

  // Update DB
  let characterEntity;
  if (
    (update.card && orgCharacter.entity.name !== update.card.name) ||
    update.image
  ) {
    characterEntity = await prisma.character.update({
      data: {
        name: update.card?.name,
        pngHash: pngHash,
      },
      where: {
        id,
      },
    });
  } else {
    characterEntity = orgCharacter.entity;
  }

  const updatedCharacter: CharacterRecord = {
    entity: characterEntity,
    card: updatedCard,
  };

  revalidateTag(CHARACTER_CACHE_KEY, "max");
  return updatedCharacter;
}

export interface SaveCharacterImageParams {
  characterCard: CharacterCard;
  image: File | Buffer | undefined;
}

export async function saveCharacterImage({
  characterCard,
  image,
}: SaveCharacterImageParams) {
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
  const pngHash = createImageHash(imageBuffer);

  return { fileName, filePath, pngHash };
}
