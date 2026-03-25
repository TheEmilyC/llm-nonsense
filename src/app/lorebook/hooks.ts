"use client";

import {
  getLorebookAction,
  initializeLorebookAction,
} from "@/app/lorebook/actions";
import {
  InitializeLorebookFormValues,
  LOREBOOK_CACHE,
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
    mutationFn: (data: InitializeLorebookFormValues) =>
      initializeLorebookAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOREBOOK_CACHE] });
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
    queryKey: [LOREBOOK_CACHE],
    initialData: initialLorebook,
    queryFn: getLorebookAction,
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
    mutationFn: () => getLorebookAction(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOREBOOK_CACHE] });
    },
  });

  return {
    refreshLorebook,
    isPending,
    error: error ? (error as Error).message : null,
  };
}
