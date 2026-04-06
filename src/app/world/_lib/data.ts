"use server";

import fs from "fs/promises";
import { cacheTag, revalidateTag } from "next/cache";
import path, { join } from "path";

import { WORLD_CACHE_KEY } from "@/app/world/_lib/schema";
import { DEFAULT_AVATAR_PATH, WORLD_DIRECTORY } from "@/lib/constants";
import { WORKING_DIRECTORY } from "@/lib/env-variables";
import { createImageHash } from "@/lib/image";
import { prisma } from "@/lib/prisma";

import { World } from "../../../../generated/client";

const WORLD_PATH = join(WORKING_DIRECTORY, WORLD_DIRECTORY);

export interface CreateWorldParams {
  image: File | undefined;
  world: {
    description: string;
    name: string;
  };
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
  image?: File;
  update: { description?: string; name?: string; };
}

export async function createWorld({
  image,
  world,
}: CreateWorldParams): Promise<World> {
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

  revalidateTag(WORLD_CACHE_KEY, "max");
  return worldEntity;
}

export async function deleteWorld(id: string): Promise<void> {
  const world = await getWorldById(id);
  if (!world) throw new Error("World does not exist");
  await prisma.world.delete({ where: { id } });
  await fs.rm(join(WORKING_DIRECTORY, world.image));

  revalidateTag(WORLD_CACHE_KEY, "max");
  revalidateTag(`${WORLD_CACHE_KEY}-${id}`, "max");
}

export async function getWorldById(id: string): Promise<null | World> {
  "use cache";
  cacheTag(`${WORLD_CACHE_KEY}-${id}`);

  return await prisma.world.findUnique({ where: { id } });
}

export async function getWorldByIdOrFail(id: string): Promise<World> {
  const result = await getWorldById(id);
  if (!result) throw new Error(`World ID:${id} does not exist`);
  return result;
}

export async function getWorldList(): Promise<World[]> {
  "use cache";
  cacheTag(WORLD_CACHE_KEY);

  return await prisma.world.findMany();
}

export async function saveWorldImage(
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

export async function updateWorld({
  id,
  image,
  update,
}: UpdateWorldParams): Promise<World> {
  const orgWorld = await getWorldById(id);
  if (!orgWorld) throw new Error("World does not exist");

  const entityUpdate: Partial<World> = {};
  if (image) {
    const { imageHash } = await saveWorldImage({
      filePath: orgWorld.image,
      image,
    });
    entityUpdate.imageHash = imageHash;
  }
  if (update.name !== undefined && update.name !== orgWorld.name) {
    entityUpdate.name = update.name;
  }
  if (
    update.description !== undefined &&
    update.description !== orgWorld.description
  ) {
    entityUpdate.description = update.description;
  }

  const worldEntity = await prisma.world.update({
    data: entityUpdate,
    where: { id },
  });

  revalidateTag(WORLD_CACHE_KEY, "max");
  revalidateTag(`${WORLD_CACHE_KEY}-${id}`, "max");
  return worldEntity;
}
