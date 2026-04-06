"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createPersonaAction,
  deletePersonaAction,
  updatePersonaAction,
} from "@/app/persona/_lib/actions";
import {
  PERSONA_CACHE_KEY,
  PersonaFormValues,
} from "@/app/persona/_lib/schema";
import { unwrapAction } from "@/lib/action-utils";

export interface UpdatePersonaMutationParams {
  data: PersonaFormValues;
  personaId: string;
}

export function useCreatePersona() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: createPersona,
  } = useMutation({
    mutationFn: async (data: PersonaFormValues) =>
      unwrapAction(await createPersonaAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSONA_CACHE_KEY, "list"] });
    },
  });

  return {
    createPersona,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useDeletePersona() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: deletePersona,
  } = useMutation({
    mutationFn: async ({ personaId }: { personaId: string }) =>
      unwrapAction(await deletePersonaAction(personaId)),
    onSuccess: (_, { personaId }) => {
      queryClient.invalidateQueries({ queryKey: [PERSONA_CACHE_KEY, "list"] });
      queryClient.removeQueries({ queryKey: [PERSONA_CACHE_KEY, personaId] });
    },
  });

  return {
    deletePersona,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useUpdatePersona() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: updatePersona,
  } = useMutation({
    mutationFn: async ({ data, personaId }: UpdatePersonaMutationParams) =>
      unwrapAction(await updatePersonaAction(personaId, data)),
    onSuccess: (updated, { personaId }) => {
      queryClient.invalidateQueries({ queryKey: [PERSONA_CACHE_KEY, "list"] });
      queryClient.setQueryData([PERSONA_CACHE_KEY, personaId], updated);
    },
  });

  return {
    error: error ? (error as Error).message : null,
    isPending,
    updatePersona,
  };
}
