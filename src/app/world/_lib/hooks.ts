"use client";

import { useTransition } from "react";

import {
  createWorldAction,
  deleteWorldAction,
  updateWorldAction,
} from "@/app/world/_lib/actions";
import {
  UpdateWorldActionParams,
  WorldFormValues,
} from "@/app/world/_lib/schema";
import { ActionError, ActionResponse } from "@/lib/action-utils";

export interface UpdateWorldMutationParams {
  data: WorldFormValues;
  worldId: string;
}

export function useCreateWorld(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function createWorld(data: WorldFormValues): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createWorldAction(data);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    createWorld,
    isPending,
  };
}

export function useDeleteWorld(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function deleteWorld(id: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await deleteWorldAction(id);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    deleteWorld,
    isPending,
  };
}

export function useUpdateWorld(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function updateWorld(
    params: UpdateWorldActionParams,
  ): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateWorldAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    isPending,
    updateWorld,
  };
}
