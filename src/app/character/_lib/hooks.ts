"use client";

import { useTransition } from "react";

import {
  createCharacterAction,
  deleteCharacterAction,
  importCharacterFromPNGAction,
  updateCharacterAction,
} from "@/app/character/_lib/actions";
import {
  CharacterFormValues,
  ImportFromPngForm,
} from "@/app/character/_lib/schema";
import { ActionError, ActionResponse } from "@/lib/action-utils";

export interface UpdateCharacterMutationParams {
  data: CharacterFormValues;
  id: string;
}

export function useCreateCharacter(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function createCharacter(data: CharacterFormValues): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await createCharacterAction(data);
        if (!result.success) onError?.(result.error);
        resolve(result);
      });
    });
  }

  return { createCharacter, isPending };
}

export function useDeleteCharacter(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function deleteCharacter(id: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await deleteCharacterAction(id);
        if (!result.success) onError?.(result.error);
        resolve(result);
      });
    });
  }

  return {
    deleteCharacter,
    isPending,
  };
}

export function useImportCharacterFromPNG(
  onError?: (error: ActionError) => void,
) {
  const [isPending, startTransition] = useTransition();

  function importCharacter(data: ImportFromPngForm): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await importCharacterFromPNGAction(data);
        if (!result.success) onError?.(result.error);
        resolve(result);
      });
    });
  }

  return {
    importCharacter,
    isPending,
  };
}

export function useUpdateCharacter(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function updateCharacter({
    data,
    id,
  }: UpdateCharacterMutationParams): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await updateCharacterAction(id, data);
        if (!result.success) onError?.(result.error);
        resolve(result);
      });
    });
  }

  return {
    isPending,
    updateCharacter,
  };
}
