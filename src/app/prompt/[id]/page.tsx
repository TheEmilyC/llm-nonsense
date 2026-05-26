import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import z from "zod";

import { dbIdValidator } from "@/app/_shared/schema";
import { PromptEdit } from "@/app/prompt/_component/prompt-edit";
import { getPromptDto } from "@/app/prompt/_lib/data";

interface PromptEditPageParams {
  params: Promise<{ id: string }>;
}

const promptEditPageParamsSchema = z.object({
  id: dbIdValidator,
});

export default function PromptEditPage({ params }: PromptEditPageParams) {
  return (
    <Suspense>
      <PromptEditPageContent params={params} />
    </Suspense>
  );
}

async function PromptEditPageContent({ params }: PromptEditPageParams) {
  await connection();
  const { id } = promptEditPageParamsSchema.parse(await params);
  const prompt = await getPromptDto(id);
  if (!prompt) notFound();

  return <PromptEdit prompt={prompt} />;
}
