import z from "zod";

import { WorldEdit } from "@/app/world/_components/world-edit";
import { getWorldById } from "@/app/world/_lib/data";
import { toWorldDto } from "@/app/world/_lib/schema";
import { dbIdValidator } from "@/lib/validators";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface WorldPageParams {
  params: Promise<{ id: string }>;
}

const worldEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

async function WorldEditPageContent({ params }: WorldPageParams) {
  const { id } = worldEditPageParamsSchema.parse(await params);
  const world = await getWorldById(id);
  if (!world) notFound();

  return <WorldEdit world={toWorldDto(world)} />;
}

export default function WorldEditPage({ params }: WorldPageParams) {
  return (
    <Suspense>
      <WorldEditPageContent params={params} />
    </Suspense>
  );
}
