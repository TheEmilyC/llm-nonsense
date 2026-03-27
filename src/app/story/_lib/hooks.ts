import {
  createStoryAction,
  deleteStoryAction,
  updateStoryAction,
} from "@/app/story/_lib/actions";
import { STORY_CACHE_KEY, StoryFormValues } from "@/app/story/_lib/schema";
import { unwrapAction } from "@/lib/action-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateStory() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createStory,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (data: StoryFormValues) =>
      unwrapAction(await createStoryAction(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STORY_CACHE_KEY] });
    },
  });

  return {
    createStory,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export interface UpdateStoryMutationParams {
  storyId: string;
  data: StoryFormValues;
}

export function useUpdateStory() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updateStory,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ storyId, data }: UpdateStoryMutationParams) =>
      unwrapAction(await updateStoryAction(storyId, data)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [STORY_CACHE_KEY, "list"] });
      queryClient.invalidateQueries({
        queryKey: [STORY_CACHE_KEY, variables.storyId],
      });
    },
  });

  return {
    updateStory,
    isPending,
    error: error ? (error as Error).message : null,
  };
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deleteStory,
    isPending,
    error,
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
    isPending,
    error: error ? (error as Error).message : null,
  };
}
