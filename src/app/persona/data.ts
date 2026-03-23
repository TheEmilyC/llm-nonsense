"use server";

import fs from "fs/promises";
import path, { join } from "path";

import { DEFAULT_AVATAR_PATH, PERSONA_DIRECTORY } from "@/lib/constants";
import { WORKING_DIRECTORY } from "@/lib/env-variables";
import { createImageHash } from "@/lib/image";
import { prisma } from "@/lib/prisma";

const PERSONA_PATH = join(WORKING_DIRECTORY, PERSONA_DIRECTORY);

export async function getPersonaList() {
  return await prisma.persona.findMany();
}

export async function getPersonaById(id: string) {
  return await prisma.persona.findUnique({ where: { id } });
}

export interface CreatePersonaParameters {
  persona: {
    name: string;
    description: string;
  };
  image: File | undefined;
}

export async function createPersona({
  persona,
  image,
}: CreatePersonaParameters) {
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

  return personaEntity;
}

export interface SavePersonaImageParams {
  image: File | undefined;
  personaName: string;
}

export async function savePersonaImage({
  image,
  personaName,
}: SavePersonaImageParams): Promise<{
  fileName: string;
  filePath: string;
  imageHash: string;
}> {
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

  const fileName = `${Date.now()}_${personaName}${fileExtension}`;
  const filePath = path.join(PERSONA_PATH, fileName);
  const imageHash = createImageHash(buffer);
  await fs.writeFile(filePath, buffer);

  return { fileName, filePath, imageHash };
}
