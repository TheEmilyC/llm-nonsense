"use client";

import {
  createPersonaAction,
  deletePersonaAction,
  updatePersonaAction,
} from "@/app/persona/actions";
import {
  PERSONA_CACHE_KEY,
  PersonaFormValues,
} from "@/app/persona/schema";
import { unwrapAction } from "@/lib/action-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreatePersona() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createPersona,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (data: PersonaFormValues) =>
      unwrapAction(await createPersonaAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSONA_CACHE_KEY, "list"] });
    },
  });

  return {
    createPersona,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export interface UpdatePersonaMutationParams {
  personaId: string;
  data: PersonaFormValues;
}

export function useUpdatePersona() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updatePersona,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ personaId, data }: UpdatePersonaMutationParams) =>
      unwrapAction(await updatePersonaAction(personaId, data)),
    onSuccess: (updated, { personaId }) => {
      queryClient.invalidateQueries({ queryKey: [PERSONA_CACHE_KEY, "list"] });
      queryClient.setQueryData([PERSONA_CACHE_KEY, personaId], updated);
    },
  });

  return {
    updatePersona,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export function useDeletePersona() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deletePersona,
    isPending,
    error,
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
    isPending,
    error: error ? (error as Error).message : null,
  };
}
