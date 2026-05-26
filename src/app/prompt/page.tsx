import { connection } from "next/server";
import { Suspense } from "react";

import { PromptList } from "@/app/prompt/_component/prompt-list";
import { getPromptListDto } from "@/app/prompt/_lib/data";

export default function PromptPage() {
  return (
    <Suspense>
      <PromptPageContent />
    </Suspense>
  );
}

async function PromptPageContent() {
  await connection();
  const prompts = await getPromptListDto();
  return <PromptList prompts={prompts} />;
}
