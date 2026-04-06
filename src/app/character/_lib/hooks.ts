"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createCharacterAction,
  deleteCharacterAction,
  importCharacterFromPNGAction,
  updateCharacterAction,
} from "@/app/character/_lib/actions";
import {
  CHARACTER_CACHE_KEY,
  CharacterFormValues,
  ImportFromPngForm,
} from "@/app/character/_lib/schema";
import { unwrapAction } from "@/lib/action-utils";

export interface UpdateCharacterMutationParams {
  characterId: string;
  data: CharacterFormValues;
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: createCharacter,
  } = useMutation({
    mutationFn: async (data: CharacterFormValues) =>
      unwrapAction(await createCharacterAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CHARACTER_CACHE_KEY, "list"],
      });
    },
  });

  return {
    createCharacter,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: deleteCharacter,
  } = useMutation({
    mutationFn: async ({ characterId }: { characterId: string }) =>
      unwrapAction(await deleteCharacterAction(characterId)),
    onSuccess: (data, { characterId }) => {
      queryClient.invalidateQueries({
        queryKey: [CHARACTER_CACHE_KEY, "list"],
      });
      queryClient.setQueryData([CHARACTER_CACHE_KEY, characterId], data);
    },
  });

  return {
    deleteCharacter,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useImportCharacterFromPNG() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: importCharacter,
  } = useMutation({
    mutationFn: async (data: ImportFromPngForm) =>
      unwrapAction(await importCharacterFromPNGAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHARACTER_CACHE_KEY] });
    },
  });

  return {
    error: error ? (error as Error).message : null,
    importCharacter,
    isPending,
  };
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: updateCharacter,
  } = useMutation({
    mutationFn: async ({ characterId, data }: UpdateCharacterMutationParams) =>
      unwrapAction(await updateCharacterAction(characterId, data)),
    onSuccess: (data, { characterId }) => {
      queryClient.invalidateQueries({
        queryKey: [CHARACTER_CACHE_KEY, "list"],
      });
      queryClient.setQueryData([CHARACTER_CACHE_KEY, characterId], data);
    },
  });

  return {
    error: error ? (error as Error).message : null,
    isPending,
    updateCharacter,
  };
}
