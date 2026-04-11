import { notFound } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

import { WorldEdit } from "@/app/world/_components/world-edit";
import { getWorldById } from "@/app/world/_lib/data";
import { dbIdValidator } from "@/lib/validators";

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
  const { id } = worldEditPageParamsSchema.parse(await params);
  const world = await getWorldById(id);
  if (!world) notFound();

  return <WorldEdit world={world} />;
}
