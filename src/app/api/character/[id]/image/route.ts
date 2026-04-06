import fs from "fs/promises";
import { NextResponse } from "next/server";

import { getCharacterById } from "@/app/character/_lib/data";
import { HttpStatus } from "@/lib/http";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const character = await getCharacterById(id);
  if (!character) {
    return new NextResponse("Image not found", {
      status: HttpStatus.NOT_FOUND,
    });
  }

  try {
    const imageBuffer = await fs.readFile(character.entity.png);

    return new NextResponse(imageBuffer, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for a year
        "Content-Type": "image/png",
      },
    });
  } catch {
    return new NextResponse("Image not found", {
      status: HttpStatus.NOT_FOUND,
    });
  }
}
