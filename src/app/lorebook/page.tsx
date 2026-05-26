import { connection } from "next/server";
import { Suspense } from "react";

import { LorebookList } from "@/app/lorebook/_components/lorebook-list";
import { getLorebookEntityDtoList } from "@/app/lorebook/_lib/data";

export default function LorebookPage() {
  return (
    <Suspense>
      <LorebookPageContent />
    </Suspense>
  );
}

async function LorebookPageContent() {
  await connection();
  const lorebooks = await getLorebookEntityDtoList();
  return <LorebookList lorebooks={lorebooks} />;
}
