import { connection } from "next/server";
import { Suspense } from "react";

import { WorldList } from "@/app/world/_components/world-list";
import { getWorldListDto } from "@/app/world/_lib/data";

export default function WorldPage() {
  return (
    <Suspense>
      <WorldPageContent />
    </Suspense>
  );
}

async function WorldPageContent() {
  await connection();
  const worlds = await getWorldListDto();
  return <WorldList worlds={worlds} />;
}
