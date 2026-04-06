"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createWorldAction,
  deleteWorldAction,
  updateWorldAction,
} from "@/app/world/_lib/actions";
import {
  WORLD_CACHE_KEY,
  WorldFormValues,
} from "@/app/world/_lib/schema";
import { unwrapAction } from "@/lib/action-utils";

export interface UpdateWorldMutationParams {
  data: WorldFormValues;
  worldId: string;
}

export function useCreateWorld() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: createWorld,
  } = useMutation({
    mutationFn: async (data: WorldFormValues) =>
      unwrapAction(await createWorldAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORLD_CACHE_KEY, "list"] });
    },
  });

  return {
    createWorld,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useDeleteWorld() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: deleteWorld,
  } = useMutation({
    mutationFn: async ({ worldId }: { worldId: string }) =>
      unwrapAction(await deleteWorldAction(worldId)),
    onSuccess: (_, { worldId }) => {
      queryClient.invalidateQueries({ queryKey: [WORLD_CACHE_KEY, "list"] });
      queryClient.removeQueries({ queryKey: [WORLD_CACHE_KEY, worldId] });
    },
  });

  return {
    deleteWorld,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useUpdateWorld() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: updateWorld,
  } = useMutation({
    mutationFn: async ({ data, worldId }: UpdateWorldMutationParams) =>
      unwrapAction(await updateWorldAction(worldId, data)),
    onSuccess: (updated, { worldId }) => {
      queryClient.invalidateQueries({ queryKey: [WORLD_CACHE_KEY, "list"] });
      queryClient.setQueryData([WORLD_CACHE_KEY, worldId], updated);
    },
  });

  return {
    error: error ? (error as Error).message : null,
    isPending,
    updateWorld,
  };
}
