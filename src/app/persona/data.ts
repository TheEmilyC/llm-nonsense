"use server";

import fs from "fs/promises";
import path, { join } from "path";

import { PERSONA_CACHE_KEY } from "@/app/persona/schema";
import { DEFAULT_AVATAR_PATH, PERSONA_DIRECTORY } from "@/lib/constants";
import { WORKING_DIRECTORY } from "@/lib/env-variables";
import { createImageHash } from "@/lib/image";
import { prisma } from "@/lib/prisma";
import { cacheTag, revalidateTag } from "next/cache";
import { Persona } from "../../../generated/client";

const PERSONA_PATH = join(WORKING_DIRECTORY, PERSONA_DIRECTORY);

export async function getPersonaList(): Promise<Persona[]> {
  "use cache";
  cacheTag(PERSONA_CACHE_KEY);

  return await prisma.persona.findMany();
}

export async function getPersonaById(id: string): Promise<Persona | null> {
  "use cache";
  cacheTag(`${PERSONA_CACHE_KEY}-${id}`);

  return await prisma.persona.findUnique({ where: { id } });
}

export async function getPersonaByIdOrFail(id: string): Promise<Persona> {
  const result = await getPersonaById(id);
  if (!result) throw new Error(`Persona ID:${id} does not exist`);
  return result;
}

export interface CreatePersonaParams {
  persona: {
    name: string;
    description: string;
  };
  image: File | undefined;
}

export async function createPersona({
  persona,
  image,
}: CreatePersonaParams): Promise<Persona> {
  const { fileName, filePath, imageHash } = await savePersonaImage({
    image,
    personaName: persona.name,
  });
  const personaEntity = await prisma.persona
    .create({
      data: {
        name: persona.name,
        description: persona.description,
        image: join(PERSONA_DIRECTORY, fileName),
        imageHash,
      },
    })
    .catch(async (err) => {
      // clean up file
      await fs.rm(filePath);
      throw err;
    });

  revalidateTag(PERSONA_CACHE_KEY, "max");
  return personaEntity;
}

export type SavePersonaImageParams =
  | {
      image: File | undefined;
      personaName: string;
    }
  | { filePath: string; image: File | undefined };

export interface SavePersonaImageResult {
  fileName: string;
  filePath: string;
  imageHash: string;
}

export async function savePersonaImage(
  params: SavePersonaImageParams,
): Promise<SavePersonaImageResult> {
  const image = params.image;
  // Save image
  await fs.mkdir(PERSONA_PATH, { recursive: true });
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
  if ("personaName" in params) {
    fileName = `${Date.now()}_${params.personaName}${fileExtension}`;
    filePath = path.join(PERSONA_PATH, fileName);
  } else {
    fileName = path.basename(params.filePath);
    filePath = params.filePath;
  }
  const imageHash = createImageHash(buffer);
  await fs.writeFile(filePath, buffer);

  return { fileName, filePath, imageHash };
}

export async function deletePersona(id: string): Promise<void> {
  const persona = await getPersonaById(id);
  if (!persona) throw new Error("Persona does not exist");
  // remove entity
  await prisma.persona.delete({ where: { id } });
  // remove image
  await fs.rm(join(WORKING_DIRECTORY, persona.image));

  revalidateTag(PERSONA_CACHE_KEY, "max");
  revalidateTag(`${PERSONA_CACHE_KEY}-${id}`, "max");
}

interface UpdatePersonaParams {
  id: string;
  update: { name?: string; description?: string };
  image?: File;
}

export async function updatePersona({
  id,
  update,
  image,
}: UpdatePersonaParams): Promise<Persona> {
  const orgPersona = await getPersonaById(id);
  if (!orgPersona) throw new Error("Persona does not exist");

  const entityUpdate: Partial<Persona> = {};
  if (image) {
    const { imageHash } = await savePersonaImage({
      filePath: orgPersona.image,
      image,
    });
    entityUpdate.imageHash = imageHash;
  }
  if (update.name !== undefined && update.name !== orgPersona.name) {
    entityUpdate.name = update.name;
  }
  if (
    update.description !== undefined &&
    update.description !== orgPersona.description
  ) {
    entityUpdate.description = update.description;
  }

  const personaEntity = await prisma.persona.update({
    data: entityUpdate,
    where: { id },
  });

  revalidateTag(PERSONA_CACHE_KEY, "max");
  revalidateTag(`${PERSONA_CACHE_KEY}-${id}`, "max");
  return personaEntity;
}
