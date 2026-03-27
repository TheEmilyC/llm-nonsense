"use client";

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
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateWorld() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createWorld,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (data: WorldFormValues) =>
      unwrapAction(await createWorldAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORLD_CACHE_KEY, "list"] });
    },
  });

  return {
    createWorld,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export interface UpdateWorldMutationParams {
  worldId: string;
  data: WorldFormValues;
}

export function useUpdateWorld() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updateWorld,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ worldId, data }: UpdateWorldMutationParams) =>
      unwrapAction(await updateWorldAction(worldId, data)),
    onSuccess: (updated, { worldId }) => {
      queryClient.invalidateQueries({ queryKey: [WORLD_CACHE_KEY, "list"] });
      queryClient.setQueryData([WORLD_CACHE_KEY, worldId], updated);
    },
  });

  return {
    updateWorld,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export function useDeleteWorld() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deleteWorld,
    isPending,
    error,
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
    isPending,
    error: error ? (error as Error).message : null,
  };
}
