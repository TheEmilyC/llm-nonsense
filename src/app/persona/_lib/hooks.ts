"use client";

import { useTransition } from "react";

import {
  createPersonaAction,
  deletePersonaAction,
  updatePersonaAction,
} from "@/app/persona/_lib/actions";
import {
  PersonaFormValues,
  UpdatePersonaActionParams,
} from "@/app/persona/_lib/schema";
import { ActionError, ActionResponse } from "@/lib/action-utils";

export interface UpdatePersonaMutationParams {
  data: PersonaFormValues;
  personaId: string;
}

export function useCreatePersona(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function createPersona(data: PersonaFormValues): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createPersonaAction(data);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    createPersona,
    isPending,
  };
}

export function useDeletePersona(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function deletePersona(id: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await deletePersonaAction(id);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    deletePersona,
    isPending,
  };
}

export function useUpdatePersona(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function updatePersona(
    params: UpdatePersonaActionParams,
  ): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updatePersonaAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    isPending,
    updatePersona,
  };
}
