"use server";

import fs from "fs/promises";
import { cacheTag } from "next/cache";
import path, { join } from "path";

import {
  WORLD_CACHE_KEY,
  WorldDto,
  WorldImageFileDto,
  WorldListDto,
} from "@/app/world/_lib/schema";
import { World } from "@/generated/client";
import { DEFAULT_AVATAR_PATH, WORLD_DIRECTORY } from "@/lib/constants";
import { WORKING_DIRECTORY } from "@/lib/env-variables";
import { NotFoundError } from "@/lib/error";
import { buildWorldImageUrl, createImageHash } from "@/lib/image";
import { prisma } from "@/lib/prisma";

const WORLD_PATH = join(WORKING_DIRECTORY, WORLD_DIRECTORY);

export interface CreateWorldParams {
  image: File | undefined;
  world: Pick<World, "description" | "name">;
}

export type SaveWorldImageParams =
  | { filePath: string; image: File | undefined }
  | {
      image: File | undefined;
      worldName: string;
    };

export interface SaveWorldImageResult {
  fileName: string;
  filePath: string;
  imageHash: string;
}

interface UpdateWorldParams {
  id: string;
  update: Partial<Pick<World, "description" | "name">> & { image?: File };
}

export async function createWorld({
  image,
  world,
}: CreateWorldParams): Promise<WorldDto> {
  const { fileName, filePath, imageHash } = await saveWorldImage({
    image,
    worldName: world.name,
  });
  const worldEntity = await prisma.world
    .create({
      data: {
        description: world.description,
        image: join(WORLD_DIRECTORY, fileName),
        imageHash,
        name: world.name,
      },
    })
    .catch(async (err) => {
      await fs.rm(filePath);
      throw err;
    });
  const worldDto = toWorldDto(worldEntity);
  return worldDto;
}

export async function deleteWorld(id: string) {
  const world = await getWorldEntityById(id);
  if (!world) throw new NotFoundError("World", id);
  await prisma.world.delete({ where: { id } });
  await fs.rm(join(WORKING_DIRECTORY, world.image));
}

export async function getWorldById(id: string): Promise<null | WorldDto> {
  const worldEntity = await getWorldEntityById(id);
  if (!worldEntity) return null;
  return toWorldDto(worldEntity);
}

export async function getWorldImageFile(
  id: string,
): Promise<null | WorldImageFileDto> {
  const result = await getWorldEntityById(id);
  if (!result) return null;
  return toWorldImageFileDto(result);
}

export async function getWorldList(): Promise<WorldListDto[]> {
  "use cache";
  cacheTag(WORLD_CACHE_KEY);

  const worldEntities = await prisma.world.findMany({
    select: { id: true, imageHash: true, name: true },
  });
  return toWorldListDto(worldEntities);
}

export async function updateWorld({
  id,
  update: { image, ...update },
}: UpdateWorldParams): Promise<WorldDto> {
  const orgWorld = await getWorldEntityById(id);
  if (!orgWorld) throw new NotFoundError("World", id);

  let imageHash: string | undefined;
  if (image) {
    const worldImage = await saveWorldImage({
      filePath: orgWorld.image,
      image,
    });
    imageHash = worldImage.imageHash;
  }

  const worldEntity = await prisma.world.update({
    data: {
      description: update.description,
      imageHash,
      name: update.name,
    },
    where: { id },
  });
  const worldDto = toWorldDto(worldEntity);

  return worldDto;
}

async function getWorldEntityById(id: string): Promise<null | World> {
  "use cache";
  cacheTag(`${WORLD_CACHE_KEY}-${id}`);
  return prisma.world.findUnique({ where: { id } });
}

async function saveWorldImage(
  params: SaveWorldImageParams,
): Promise<SaveWorldImageResult> {
  const image = params.image;
  await fs.mkdir(WORLD_PATH, { recursive: true });
  let fileExtension: string;
  let buffer: Buffer;
  if (image) {
    fileExtension = path.extname(image.name);
    buffer = Buffer.from(await image.arrayBuffer());
  } else {
    fileExtension = path.extname(DEFAULT_AVATAR_PATH);
    buffer = await fs.readFile(
      path.join(WORKING_DIRECTORY, DEFAULT_AVATAR_PATH),
    );
  }

  let fileName: string;
  let filePath: string;
  if ("worldName" in params) {
    fileName = `${Date.now()}_${params.worldName}${fileExtension}`;
    filePath = path.join(WORLD_PATH, fileName);
  } else {
    fileName = path.basename(params.filePath);
    filePath = params.filePath;
  }
  const imageHash = createImageHash(buffer);
  await fs.writeFile(filePath, buffer);

  return { fileName, filePath, imageHash };
}

function toWorldDto({ description, id, imageHash, name }: World): WorldDto {
  return {
    description: description,
    id: id,
    imageUrl: buildWorldImageUrl(id, imageHash),
    name: name,
  };
}

function toWorldImageFileDto(
  persona: Pick<World, "id" | "image">,
): WorldImageFileDto {
  return { id: persona.id, image: persona.image };
}

function toWorldListDto(worlds: Pick<World, "id" | "imageHash" | "name">[]) {
  return worlds.map(({ id, imageHash, name }) => ({
    id,
    imageUrl: buildWorldImageUrl(id, imageHash),
    name,
  }));
}
