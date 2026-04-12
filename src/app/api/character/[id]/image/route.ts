import fs from "fs/promises";
import { NextResponse } from "next/server";

import { dbIdValidator } from "@/app/_shared/schema";
import { getCharacterImageFile } from "@/app/character/_lib/data";
import { HttpStatus } from "@/lib/http";
import { logger, parseError } from "@/lib/logger";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  // -- Validation
  const { id: idRaw } = await params;
  const id = dbIdValidator.parse(idRaw);

  try {
    // -- Fetch
    const character = await getCharacterImageFile(id);
    if (!character) {
      return new NextResponse("Image not found", {
        status: HttpStatus.NOT_FOUND,
      });
    }
    const imageBuffer = await fs.readFile(character.png);

    // -- Response
    return new NextResponse(imageBuffer, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for a year
        "Content-Type": "image/png",
      },
    });
  } catch (err) {
    logger.error(`Error loading character image ID:${id}`, parseError(err));
    return new NextResponse("Image not found", {
      status: HttpStatus.NOT_FOUND,
    });
  }
}
