"use server";

import fs from "fs/promises";
import { cacheTag } from "next/cache";
import path, { join } from "path";

import {
  PERSONA_CACHE_KEY,
  PersonaDto,
  PersonaImageFileDto,
  PersonaListDto,
} from "@/app/persona/_lib/schema";
import { Persona } from "@/generated/client";
import { DEFAULT_AVATAR_PATH, PERSONA_DIRECTORY } from "@/lib/constants";
import { WORKING_DIRECTORY } from "@/lib/env-variables";
import { NotFoundError } from "@/lib/error";
import { buildPersonaImageUrl, createImageHash } from "@/lib/image";
import { prisma } from "@/lib/prisma";

const PERSONA_PATH = join(WORKING_DIRECTORY, PERSONA_DIRECTORY);

export interface CreatePersonaParams {
  image: File | undefined;
  persona: Pick<Persona, "description" | "name">;
}

export type SavePersonaImageParams =
  | { filePath: string; image: File | undefined }
  | {
      image: File | undefined;
      personaName: string;
    };

export interface SavePersonaImageResult {
  fileName: string;
  filePath: string;
  imageHash: string;
}

interface UpdatePersonaParams {
  id: string;
  update: Partial<Pick<Persona, "description" | "name">> & { image?: File };
}

export async function createPersona({
  image,
  persona,
}: CreatePersonaParams): Promise<PersonaDto> {
  const { fileName, filePath, imageHash } = await savePersonaImage({
    image,
    personaName: persona.name,
  });
  const result = await prisma.persona
    .create({
      data: {
        description: persona.description,
        image: join(PERSONA_DIRECTORY, fileName),
        imageHash,
        name: persona.name,
      },
    })
    .catch(async (err) => {
      // clean up file
      await fs.rm(filePath);
      throw err;
    });

  const personaDto = toPersonaDto(result);

  return personaDto;
}

export async function deletePersona(id: string) {
  const persona = await getPersonaEntityById(id);
  if (!persona) throw new NotFoundError("Persona", id);
  // remove entity
  await prisma.persona.delete({ where: { id } });
  // remove image
  await fs.rm(join(WORKING_DIRECTORY, persona.image));
}

export async function getPersonaById(id: string): Promise<null | PersonaDto> {
  const result = await getPersonaEntityById(id);
  if (!result) return null;
  return toPersonaDto(result);
}

export async function getPersonaImageFile(
  id: string,
): Promise<null | PersonaImageFileDto> {
  const result = await getPersonaEntityById(id);
  if (!result) return null;
  return toPersonaImageFileDto(result);
}

export async function getPersonaList(): Promise<PersonaListDto[]> {
  "use cache";
  cacheTag(PERSONA_CACHE_KEY);

  const result = await prisma.persona.findMany();

  return toPersonaListDto(result);
}

export async function updatePersona({
  id,
  update,
}: UpdatePersonaParams): Promise<PersonaDto> {
  const orgPersona = await getPersonaEntityById(id);
  if (!orgPersona) throw new NotFoundError("Persona", id);
  const { image, ...data } = update;

  let imageHash: string | undefined;
  if (image) {
    const result = await savePersonaImage({
      filePath: orgPersona.image,
      image,
    });
    imageHash = result.imageHash;
  }

  const personaEntity = await prisma.persona.update({
    data: { description: data.description, imageHash, name: data.name },
    where: { id },
  });
  const personaDto = toPersonaDto(personaEntity);

  return personaDto;
}

async function getPersonaEntityById(id: string): Promise<null | Persona> {
  "use cache";
  cacheTag(`${PERSONA_CACHE_KEY}-${id}`);
  return prisma.persona.findUnique({ where: { id } });
}

async function savePersonaImage(
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

function toPersonaDto(persona: Persona): PersonaDto {
  return {
    createdAt: persona.createdAt,
    description: persona.description,
    id: persona.id,
    imageUrl: buildPersonaImageUrl({
      id: persona.id,
      imageHash: persona.imageHash,
    }),
    modifiedAt: persona.modifiedAt,
    name: persona.name,
  };
}

function toPersonaImageFileDto(
  persona: Pick<Persona, "id" | "image">,
): PersonaImageFileDto {
  return { id: persona.id, image: persona.image };
}

function toPersonaListDto(personas: Persona[]): PersonaListDto[] {
  return personas.map(({ id, imageHash, name }) => ({
    id,
    imageUrl: buildPersonaImageUrl({ id, imageHash }),
    name,
  }));
}
