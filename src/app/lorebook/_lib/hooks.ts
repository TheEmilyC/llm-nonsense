"use client";

import {
  createLorebookAction,
  deleteLorebookAction,
  getLorebookAction,
  initializeLorebookAction,
  testConnectionAction,
  updateLorebookAction,
} from "@/app/lorebook/_lib/actions";
import {
  InitializeLorebookFormValues,
  LOREBOOK_CACHE_KEY,
  LOREBOOK_DB_CACHE_KEY,
  LorebookDbFormValues,
  LorebookDto,
} from "@/app/lorebook/_lib/schema";
import { unwrapAction } from "@/lib/action-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCreateLorebook() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: createLorebook,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (data: LorebookDbFormValues) =>
      unwrapAction(await createLorebookAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [LOREBOOK_DB_CACHE_KEY, "list"],
      });
    },
  });
  return {
    createLorebook,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export function useUpdateLorebook() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: updateLorebook,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({
      lorebookId,
      data,
    }: {
      lorebookId: string;
      data: LorebookDbFormValues;
    }) => unwrapAction(await updateLorebookAction(lorebookId, data)),
    onSuccess: (updated, { lorebookId }) => {
      queryClient.invalidateQueries({
        queryKey: [LOREBOOK_DB_CACHE_KEY, "list"],
      });
      queryClient.setQueryData([LOREBOOK_DB_CACHE_KEY, lorebookId], updated);
    },
  });
  return {
    updateLorebook,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export function useDeleteLorebook() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: deleteLorebook,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ lorebookId }: { lorebookId: string }) =>
      unwrapAction(await deleteLorebookAction(lorebookId)),
    onSuccess: (_, { lorebookId }) => {
      queryClient.invalidateQueries({
        queryKey: [LOREBOOK_DB_CACHE_KEY, "list"],
      });
      queryClient.removeQueries({
        queryKey: [LOREBOOK_DB_CACHE_KEY, lorebookId],
      });
    },
  });
  return {
    deleteLorebook,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export function useInitializeLorebook() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: initializeLorebook,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (data: InitializeLorebookFormValues) => {
      const result = await initializeLorebookAction(data);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([LOREBOOK_CACHE_KEY], data);
    },
  });

  return {
    initializeLorebook,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

interface UseLorebookParams {
  initialLorebook?: LorebookDto;
}

export function useLorebook({ initialLorebook }: UseLorebookParams) {
  const {
    data: lorebook,
    isLoading,
    error,
  } = useQuery({
    queryKey: [LOREBOOK_CACHE_KEY],
    initialData: initialLorebook,
    queryFn: async () => {
      const results = await getLorebookAction();
      if (!results.success) {
        throw new Error(results.error);
      }

      return results.data;
    },
  });

  return {
    lorebook,
    isLoading,
    error: error ? (error as Error).message : null,
  };
}

export function useRefreshLorebookConnection() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: refreshLorebook,
    isPending,
    error,
  } = useMutation({
    mutationFn: async () => {
      const result = await getLorebookAction(true);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([LOREBOOK_CACHE_KEY], data);
    },
  });

  return {
    refreshLorebook,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export function useTestLorebookConnection() {
  const {
    mutateAsync: testLorebookConnection,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (api: { port: number; apiKey: string }) =>
      unwrapAction(await testConnectionAction({ api })),
  });

  return {
    testLorebookConnection,
    isPending,
    error: error ? (error as Error).message : null,
  };
}
