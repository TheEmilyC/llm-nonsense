"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  checkPromptAction,
  createPromptAction,
  deletePromptAction,
  updatePromptAction,
} from "@/app/prompt/_lib/actions";
import {
  PROMPT_CACHE_KEY,
  PromptFormValues,
  PromptInspectorFormValues,
} from "@/app/prompt/_lib/schema";
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

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: createPrompt,
  } = useMutation({
    mutationFn: async (data: PromptFormValues) =>
      unwrapAction(await createPromptAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMPT_CACHE_KEY, "list"] });
    },
  });

  return {
    createPrompt,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: deletePrompt,
  } = useMutation({
    mutationFn: async ({ promptId }: { promptId: string }) =>
      unwrapAction(await deletePromptAction(promptId)),
    onSuccess: (_, { promptId }) => {
      queryClient.invalidateQueries({ queryKey: [PROMPT_CACHE_KEY, "list"] });
      queryClient.removeQueries({ queryKey: [PROMPT_CACHE_KEY, promptId] });
    },
  });

  return {
    deletePrompt,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: updatePrompt,
  } = useMutation({
    mutationFn: async ({
      data,
      promptId,
    }: {
      data: PromptFormValues;
      promptId: string;
    }) => unwrapAction(await updatePromptAction(promptId, data)),
    onSuccess: (_, { promptId }) => {
      queryClient.invalidateQueries({ queryKey: [PROMPT_CACHE_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [PROMPT_CACHE_KEY, promptId] });
    },
  });

  return {
    error: error ? (error as Error).message : null,
    isPending,
    updatePrompt,
  };
}
