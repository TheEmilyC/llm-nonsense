"use server";

import fs from "fs/promises";
import { cacheTag, updateTag } from "next/cache";
import { join } from "path";

import {
  encodeCharacterCard,
  parseCharacterCard,
  writeCharacterToBuffer,
} from "@/app/character/_lib/character-card-parser";
import {
  CHARACTER_CACHE_KEY,
  CharacterCard,
  CharacterDto,
  characterDtoSchema,
  CharacterImageFileDto,
  characterImageFileDtoSchema,
  CharacterListItem,
  characterListItemSchema,
  CharacterRecord,
} from "@/app/character/_lib/schema";
import { Character } from "@/generated/client";
import { CHARACTER_CARD_DIRECTORY, DEFAULT_AVATAR_PATH } from "@/lib/constants";
import { WORKING_DIRECTORY } from "@/lib/env-variables";
import { NotFoundError } from "@/lib/error";
import { buildCharacterImageUrl, createImageHash } from "@/lib/image";
import { prisma } from "@/lib/prisma";

const CHARACTER_CARD_PATH = join(WORKING_DIRECTORY, CHARACTER_CARD_DIRECTORY);

export interface CreateCharacterParams {
  characterCard: CharacterCard;
  image: Buffer | File | undefined;
}

export interface UpdateCharacterParams {
  id: string;
  update: {
    card?: Partial<CharacterCard>;
    image?: File;
  };
}

interface SaveCharacterImageParams {
  characterCard: CharacterCard;
  image: Buffer | File | undefined;
}

export async function createCharacter({
  characterCard,
  image,
}: CreateCharacterParams): Promise<CharacterDto> {
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

  updateTag(CHARACTER_CACHE_KEY);
  return toCharacterDto({ card: characterCard, entity: characterEntity });
}

export async function deleteCharacter(id: string) {
  const entity = await getCharacterEntityById(id);
  if (!entity) throw new NotFoundError("Character", id);
  // remove entity
  await prisma.character.delete({ where: { id } });
  // remove image
  await fs.rm(join(WORKING_DIRECTORY, entity.png));
  updateTag(CHARACTER_CACHE_KEY);
  updateTag(`${CHARACTER_CACHE_KEY}-${id}`);
}

export async function getCharacterById(
  id: string,
): Promise<CharacterDto | null> {
  const record = await getCharacterRecord(id);
  if (!record) return null;
  return toCharacterDto(record);
}

export async function getCharacterImageFile(
  id: string,
): Promise<CharacterImageFileDto | null> {
  "use cache";
  cacheTag(`${CHARACTER_CACHE_KEY}-${id}`);
  const entity = await getCharacterEntityById(id);
  if (!entity) return null;
  return characterImageFileDtoSchema.parse(entity);
}

export async function getCharacterList(): Promise<CharacterListItem[]> {
  "use cache";
  cacheTag(CHARACTER_CACHE_KEY);
  const characterList = await prisma.character.findMany();
  return characterListItemSchema.array().parse(characterList);
}

export async function updateCharacter({
  id,
  update,
}: UpdateCharacterParams): Promise<CharacterDto> {
  const orgRecord = await getCharacterRecord(id);
  if (!orgRecord) throw new NotFoundError("Character", id);
  const cardPath = join(WORKING_DIRECTORY, orgRecord.entity.png);
  const updatedCard: CharacterCard = { ...orgRecord.card, ...update.card };

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
    (update.card && orgRecord.entity.name !== update.card.name) ||
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
    characterEntity = orgRecord.entity;
  }

  updateTag(CHARACTER_CACHE_KEY);
  updateTag(`${CHARACTER_CACHE_KEY}-${id}`);
  return toCharacterDto({ card: updatedCard, entity: characterEntity });
}

async function getCharacterEntityById(id: string): Promise<Character | null> {
  "use cache";
  cacheTag(`${CHARACTER_CACHE_KEY}-${id}`);
  return await prisma.character.findUnique({ where: { id } });
}

async function getCharacterRecord(id: string): Promise<CharacterRecord | null> {
  "use cache";
  cacheTag(`${CHARACTER_CACHE_KEY}-${id}`);
  const entity = await getCharacterEntityById(id);
  if (!entity) return null;
  const card = await parseCharacterCard(join(WORKING_DIRECTORY, entity.png));
  return { card, entity };
}

async function saveCharacterImage({
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

function toCharacterDto(record: CharacterRecord): CharacterDto {
  return characterDtoSchema.parse({
    createdAt: record.entity.createdAt,
    creator_notes: record.card.creator_notes,
    description: record.card.description,
    first_mes: record.card.first_mes,
    id: record.entity.id,
    imageUrl: buildCharacterImageUrl({
      id: record.entity.id,
      pngHash: record.entity.pngHash,
    }),
    mes_example: record.card.mes_example,
    modifiedAt: record.entity.modifiedAt,
    name: record.card.name,
    personality: record.card.personality,
    scenario: record.card.scenario,
    tags: record.card.tags,
  });
}
