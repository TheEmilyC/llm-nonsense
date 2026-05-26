import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";
import { WorldEdit } from "@/app/world/_components/world-edit";
import { getWorldDto } from "@/app/world/_lib/data";

interface WorldPageParams {
  params: Promise<{ id: string }>;
}

const worldEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

export default function WorldEditPage({ params }: WorldPageParams) {
  return (
    <Suspense>
      <WorldEditPageContent params={params} />
    </Suspense>
  );
}

async function WorldEditPageContent({ params }: WorldPageParams) {
  await connection();
  const { id } = worldEditPageParamsSchema.parse(await params);
  const world = await getWorldDto(id);
  if (!world) notFound();

  return <WorldEdit world={world} />;
}
