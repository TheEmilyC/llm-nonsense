import z from "zod";

import { LorebookEdit } from "@/app/lorebook/_components/lorebook-edit";
import { getLorebookEntityById } from "@/app/lorebook/_lib/data";
import { toLorebookEntityDto } from "@/app/lorebook/_lib/schema";
import { dbIdValidator } from "@/lib/validators";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface LorebookEditPageParams {
  params: Promise<{ id: string }>;
}

const lorebookEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

async function LorebookEditPageContent({ params }: LorebookEditPageParams) {
  const { id } = lorebookEditPageParamsSchema.parse(await params);
  const lorebook = await getLorebookEntityById(id);
  if (!lorebook) notFound();

  return <LorebookEdit lorebook={toLorebookEntityDto(lorebook)} />;
}

export default function LorebookEditPage({ params }: LorebookEditPageParams) {
  return (
    <Suspense>
      <LorebookEditPageContent params={params} />
    </Suspense>
  );
}
