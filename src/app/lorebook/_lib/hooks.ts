"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

interface UseLorebookParams {
  initialLorebook?: LorebookDto;
  lorebookId: string;
}

export function useCreateLorebook() {
  const queryClient = useQueryClient();
  const {
    error,
    isPending,
    mutateAsync: createLorebook,
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
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useDeleteLorebook() {
  const queryClient = useQueryClient();
  const {
    error,
    isPending,
    mutateAsync: deleteLorebook,
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
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useLorebook({
  initialLorebook,
  lorebookId,
}: UseLorebookParams) {
  const queryClient = useQueryClient();

  const {
    data: lorebook,
    error: loadingError,
    isLoading,
  } = useQuery({
    initialData: initialLorebook,
    queryFn: async () => {
      const results = await getLorebookAction(lorebookId);
      if (!results.success) {
        throw new Error(results.error);
      }

      return results.data;
    },
    queryKey: [LOREBOOK_CACHE_KEY],
  });

  const {
    error: refreshError,
    isPending: isRefreshPending,
    mutateAsync: refreshLorebook,
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
    error: loadingError
      ? (loadingError as Error).message
      : refreshError
        ? (refreshError as Error).message
        : null,
    isPending: isLoading || isRefreshPending,
    lorebook,
    refreshLorebook,
  };
}

export function useTestLorebookConnection() {
  const {
    error,
    isPending,
    mutateAsync: testLorebookConnection,
  } = useMutation({
    mutationFn: async (api: { apiKey: string; port: number; }) =>
      unwrapAction(await testConnectionAction({ api })),
  });

  return {
    error: error ? (error as Error).message : null,
    isPending,
    testLorebookConnection,
  };
}

export function useUpdateLorebook() {
  const queryClient = useQueryClient();
  const {
    error,
    isPending,
    mutateAsync: updateLorebook,
  } = useMutation({
    mutationFn: async ({
      data,
      lorebookId,
    }: {
      data: LorebookFormValues;
      lorebookId: string;
    }) => unwrapAction(await updateLorebookAction(lorebookId, data)),
    onSuccess: (updated, { lorebookId }) => {
      queryClient.invalidateQueries({
        queryKey: [LOREBOOK_CACHE_KEY, "list"],
      });
      queryClient.setQueryData([LOREBOOK_CACHE_KEY, lorebookId], updated);
    },
  });
  return {
    error: error ? (error as Error).message : null,
    isPending,
    updateLorebook,
  };
}
