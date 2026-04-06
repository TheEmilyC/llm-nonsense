import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createStoryAction,
  deleteStoryAction,
  updateStoryAction,
} from "@/app/story/_lib/actions";
import { STORY_CACHE_KEY, StoryFormValues } from "@/app/story/_lib/schema";
import { unwrapAction } from "@/lib/action-utils";

export interface UpdateStoryMutationParams {
  data: StoryFormValues;
  storyId: string;
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: createStory,
  } = useMutation({
    mutationFn: async (data: StoryFormValues) =>
      unwrapAction(await createStoryAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STORY_CACHE_KEY] });
    },
  });

  return {
    createStory,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: deleteStory,
  } = useMutation({
    mutationFn: async ({ storyId }: { storyId: string }) =>
      unwrapAction(await deleteStoryAction(storyId)),
    onSuccess: (_, { storyId }) => {
      queryClient.invalidateQueries({ queryKey: [STORY_CACHE_KEY, "list"] });
      queryClient.invalidateQueries({
        queryKey: [STORY_CACHE_KEY, storyId],
      });
    },
  });

  return {
    deleteStory,
    error: error ? (error as Error).message : null,
    isPending,
  };
}

export function useUpdateStory() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutateAsync: updateStory,
  } = useMutation({
    mutationFn: async ({ data, storyId }: UpdateStoryMutationParams) =>
      unwrapAction(await updateStoryAction(storyId, data)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [STORY_CACHE_KEY, "list"] });
      queryClient.invalidateQueries({
        queryKey: [STORY_CACHE_KEY, variables.storyId],
      });
    },
  });

  return {
    error: error ? (error as Error).message : null,
    isPending,
    updateStory,
  };
}
