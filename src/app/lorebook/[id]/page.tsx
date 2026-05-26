import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";
import { LorebookEdit } from "@/app/lorebook/_components/lorebook-edit";
import { getLorebookEntityDto } from "@/app/lorebook/_lib/data";

interface LorebookEditPageParams {
  params: Promise<{ id: string }>;
}

const lorebookEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

export default function LorebookEditPage({ params }: LorebookEditPageParams) {
  return (
    <Suspense>
      <LorebookEditPageContent params={params} />
    </Suspense>
  );
}

async function LorebookEditPageContent({ params }: LorebookEditPageParams) {
  await connection();
  const { id } = lorebookEditPageParamsSchema.parse(await params);
  const lorebook = await getLorebookEntityDto(id);
  if (!lorebook) notFound();

  return <LorebookEdit lorebook={lorebook} />;
}
