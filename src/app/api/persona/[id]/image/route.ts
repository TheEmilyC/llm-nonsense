import fs from "fs/promises";
import { NextResponse } from "next/server";

import { getPersonaById } from "@/app/persona/_lib/data";
import { HttpStatus } from "@/lib/http";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const persona = await getPersonaById(id);
  if (!persona) {
    return new NextResponse("Image not found", {
      status: HttpStatus.NOT_FOUND,
    });
  }

  try {
    const imageBuffer = await fs.readFile(persona.image);

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
