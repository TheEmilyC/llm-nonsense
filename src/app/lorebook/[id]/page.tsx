import z from "zod";

import { LorebookEdit } from "@/app/lorebook/_components/lorebook-edit";
import { getLorebookDbById } from "@/app/lorebook/_lib/data";
import { toLorebookDbDto } from "@/app/lorebook/_lib/schema";
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
  const lorebook = await getLorebookDbById(id);
  if (!lorebook) notFound();

  return <LorebookEdit lorebook={toLorebookDbDto(lorebook)} />;
}

export default function LorebookEditPage({ params }: LorebookEditPageParams) {
  return (
    <Suspense>
      <LorebookEditPageContent params={params} />
    </Suspense>
  );
}
