import fs from "fs/promises";
import { NextResponse } from "next/server";

import { dbIdValidator } from "@/app/_shared/schema";
import { getWorldImageFile } from "@/app/world/_lib/data";
import { HttpStatus } from "@/lib/http";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id: idRaw } = await params;
  const id = dbIdValidator.parse(idRaw);

  const world = await getWorldImageFile(id);
  if (!world) {
    return new NextResponse("Image not found", {
      status: HttpStatus.NOT_FOUND,
    });
  }

  try {
    const imageBuffer = await fs.readFile(world.image);

    return new NextResponse(imageBuffer, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/png",
      },
    });
  } catch {
    return new NextResponse("Image not found", {
      status: HttpStatus.NOT_FOUND,
    });
  }
}
