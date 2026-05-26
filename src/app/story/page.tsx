import { connection } from "next/server";
import { Suspense } from "react";

import { StoriesList } from "@/app/story/_components/story-list";
import { getStoryListDto } from "@/app/story/_lib/data";

export default function StoriesPage() {
  return (
    <Suspense>
      <StoriesPageContent />
    </Suspense>
  );
}

async function StoriesPageContent() {
  await connection();
  const stories = await getStoryListDto();
  return <StoriesList stories={stories} />;
}
