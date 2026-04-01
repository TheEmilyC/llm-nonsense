"use client";

import {
  createLorebookAction,
  deleteLorebookAction,
  getLorebookAction,
  testConnectionAction,
  updateLorebookAction,
} from "@/app/lorebook/_lib/actions";
import {
  LOREBOOK_CACHE_KEY,
  LorebookDto,
  LorebookFormValues,
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
    mutationFn: async (data: LorebookFormValues) =>
      unwrapAction(await createLorebookAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [LOREBOOK_CACHE_KEY, "list"],
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
      data: LorebookFormValues;
    }) => unwrapAction(await updateLorebookAction(lorebookId, data)),
    onSuccess: (updated, { lorebookId }) => {
      queryClient.invalidateQueries({
        queryKey: [LOREBOOK_CACHE_KEY, "list"],
      });
      queryClient.setQueryData([LOREBOOK_CACHE_KEY, lorebookId], updated);
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
        queryKey: [LOREBOOK_CACHE_KEY, "list"],
      });
      queryClient.removeQueries({
        queryKey: [LOREBOOK_CACHE_KEY, lorebookId],
      });
    },
  });
  return {
    deleteLorebook,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

interface UseLorebookParams {
  lorebookId: string;
  initialLorebook?: LorebookDto;
}

export function useLorebook({
  lorebookId,
  initialLorebook,
}: UseLorebookParams) {
  const queryClient = useQueryClient();

  const {
    data: lorebook,
    isLoading,
    error: loadingError,
  } = useQuery({
    queryKey: [LOREBOOK_CACHE_KEY],
    initialData: initialLorebook,
    queryFn: async () => {
      const results = await getLorebookAction(lorebookId);
      if (!results.success) {
        throw new Error(results.error);
      }

      return results.data;
    },
  });

  const {
    mutateAsync: refreshLorebook,
    isPending: isRefreshPending,
    error: refreshError,
  } = useMutation({
    mutationFn: async () => {
      const result = await getLorebookAction(lorebookId, true);
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
    lorebook,
    refreshLorebook,
    isPending: isLoading || isRefreshPending,
    error: loadingError
      ? (loadingError as Error).message
      : refreshError
        ? (refreshError as Error).message
        : null,
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
