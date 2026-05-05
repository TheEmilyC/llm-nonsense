"use client";

import { useState, useTransition } from "react";

import {
  createLorebookAction,
  generateLorebookUpdatesAction,
  generateMemoryArcAction,
  getLorebookAction,
  testConnectionAction,
  updateLorebookAction,
} from "@/app/lorebook/_lib/actions";
import {
  GenerateLorebookUpdatesActionParams,
  GenerateLorebookUpdatesResult,
  GenerateMemoryArcActionParams,
  LorebookFormValues,
  LorebookStatusDto,
  ObsidianApiConnection,
  UpdateLorebookActionParams,
} from "@/app/lorebook/_lib/schema";
import { GenerateMemoryArcResult } from "@/app/lorebook/_lib/service";
import { ActionError, ActionResponse } from "@/lib/action-utils";

interface UseLorebookParams {
  initialLorebook?: LorebookStatusDto;
  lorebookId: string;
}

export function useCreateLorebook(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function createLorebook(data: LorebookFormValues): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createLorebookAction(data);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    createLorebook,
    isPending,
  };
}

export function useDeleteLorebook(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function deleteLorebook(id: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await deleteLorebook(id);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    deleteLorebook,
    isPending,
  };
}

export function useGenerateLorebookUpdates(
  onError?: (error: ActionError) => void,
) {
  const [isPending, startTransition] = useTransition();

  function generateLorebookUpdates(
    params: GenerateLorebookUpdatesActionParams,
  ): Promise<ActionResponse<GenerateLorebookUpdatesResult>> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await generateLorebookUpdatesAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return { generateLorebookUpdates, isPending };
}

export function useGenerateMemoryArc(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function generateMemoryArc(
    params: GenerateMemoryArcActionParams,
  ): Promise<ActionResponse<GenerateMemoryArcResult>> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await generateMemoryArcAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    generateMemoryArc,
    isPending,
  };
}

export function useLorebook({
  initialLorebook,
  lorebookId,
}: UseLorebookParams) {
  const [isPending, startTransition] = useTransition();
  const [lorebook, setLorebook] = useState(initialLorebook);
  const [error, setError] = useState<null | string>(null);

  function refreshLorebook() {
    startTransition(async () => {
      const result = await getLorebookAction({ id: lorebookId, isRetry: true });
      if (!result.success) {
        setError(result.error.message);
      } else {
        setLorebook(result.data);
        setError(null);
      }
    });
  }

  return { error, isPending, lorebook, refreshLorebook };
}

export function useTestLorebookConnection(
  onError?: (error: ActionError) => void,
) {
  const [isPending, startTransition] = useTransition();

  function testLorebookConnection(api: ObsidianApiConnection) {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await testConnectionAction(api);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }
  return {
    isPending,
    testLorebookConnection,
  };
}

export function useUpdateLorebook(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function updateLorebook(
    params: UpdateLorebookActionParams,
  ): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateLorebookAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    isPending,
    updateLorebook,
  };
}
