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
        const res = await createCharacterAction(data);
        if (!res.success) onError?.(res.error);
        resolve(res);
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
        const res = await deleteCharacterAction(id);
        if (!res.success) onError?.(res.error);
        resolve(res);
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
        const res = await importCharacterFromPNGAction(data);
        if (!res.success) onError?.(res.error);
        resolve(res);
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
        const res = await updateCharacterAction(id, data);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    isPending,
    updateCharacter,
  };
}
