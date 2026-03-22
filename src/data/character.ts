"use server";

import { prisma } from "@/lib/prisma";

export async function getCharacterList() {
  const characterList = await prisma.character.findMany();
  const test = await prisma.chatMessage.findMany();
  return characterList.map((char) => ({
    id: char.id,
    name: char.name,
    pngHash: char.pngHash,
  }));
}
