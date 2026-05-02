"use client";

import { useTransition } from "react";

import {
  copyPromptAction,
  createPromptAction,
  deletePromptAction,
  updatePromptAction,
} from "@/app/prompt/_lib/actions";
import {
  PromptFormValues,
  UpdatePromptActionParams,
} from "@/app/prompt/_lib/schema";
import { ActionError, ActionResponse } from "@/lib/action-utils";

export function useCreatePrompt(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function createPrompt(data: PromptFormValues): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createPromptAction(data);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }
  return {
    createPrompt,
    isPending,
  };
}

export function useCopyPrompt(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function copyPrompt(id: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await copyPromptAction(id);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    copyPrompt,
    isPending,
  };
}

export function useDeletePrompt(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function deletePrompt(id: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await deletePromptAction(id);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    deletePrompt,
    isPending,
  };
}

export function useUpdatePrompt(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function updatePrompt(
    params: UpdatePromptActionParams,
  ): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updatePromptAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    isPending,
    updatePrompt,
  };
}
