"use client";

import { useMutation } from "@tanstack/react-query";

import { checkPromptAction } from "@/app/prompt/_lib/actions";
import { PromptInspectorFormValues } from "@/app/prompt/_lib/schema";
import { unwrapAction } from "@/lib/action-utils";

export function useCheckPrompt() {
  const {
    error,
    isPending,
    mutateAsync: checkPrompt,
  } = useMutation({
    mutationFn: async (data: PromptInspectorFormValues) =>
      unwrapAction(await checkPromptAction(data)),
  });

  return {
    checkPrompt,
    error: error ? (error as Error).message : null,
    isPending,
  };
}
