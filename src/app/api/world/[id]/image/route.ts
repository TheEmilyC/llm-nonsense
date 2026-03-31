import { getWorldById } from "@/app/world/_lib/data";
import { HttpStatus } from "@/lib/http";
import fs from "fs/promises";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const world = await getWorldById(id);
  if (!world) {
    return new NextResponse("Image not found", {
      status: HttpStatus.NOT_FOUND,
    });
  }

  try {
    const imageBuffer = await fs.readFile(world.image);

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Image not found", {
      status: HttpStatus.NOT_FOUND,
    });
  }
}
