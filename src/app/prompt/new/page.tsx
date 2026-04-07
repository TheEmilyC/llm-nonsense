import { Suspense } from "react";

import { PromptNew } from "@/app/prompt/_component/prompt-new";

export default function NewPromptPage() {
  return (
    <Suspense>
      <PromptNew />
    </Suspense>
  );
}
