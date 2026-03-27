"use client";

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
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createCharacter,
    isPending,
    error,
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
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export function useImportCharacterFromPNG() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: importCharacter,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (data: ImportFromPngForm) =>
      unwrapAction(await importCharacterFromPNGAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHARACTER_CACHE_KEY] });
    },
  });

  return {
    importCharacter,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export interface UpdateCharacterMutationParams {
  characterId: string;
  data: CharacterFormValues;
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updateCharacter,
    isPending,
    error,
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
    updateCharacter,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deleteCharacter,
    isPending,
    error,
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
    isPending,
    error: error ? (error as Error).message : null,
  };
}
