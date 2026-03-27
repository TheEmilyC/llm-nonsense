"use client";

import { checkPromptAction } from "@/app/prompt/_lib/actions";
import { PromptInspectorFormValues } from "@/app/prompt/_lib/schema";
import { unwrapAction } from "@/lib/action-utils";
import { useMutation } from "@tanstack/react-query";

export function useCheckPrompt() {
  const {
    mutateAsync: checkPrompt,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (data: PromptInspectorFormValues) =>
      unwrapAction(await checkPromptAction(data)),
  });

  return {
    checkPrompt,
    isPending,
    error: error ? (error as Error).message : null,
  };
}
