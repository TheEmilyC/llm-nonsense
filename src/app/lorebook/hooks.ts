"use client";

import {
  getLorebookAction,
  initializeLorebookAction,
} from "@/app/lorebook/actions";
import {
  InitializeLorebookFormValues,
  LOREBOOK_CACHE_KEY,
  LorebookDto,
} from "@/app/lorebook/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
