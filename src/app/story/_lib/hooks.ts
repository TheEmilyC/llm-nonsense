import { useTransition } from "react";

import {
  createStoryAction,
  deleteStoryAction,
  updateStoryAction,
} from "@/app/story/_lib/actions";
import {
  StoryFormValues,
  UpdateStoryActionParams,
} from "@/app/story/_lib/schema";
import { ActionError, ActionResponse } from "@/lib/action-utils";

export interface UpdateStoryMutationParams {
  data: StoryFormValues;
  storyId: string;
}

export function useCreateStory(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function createStory(data: StoryFormValues): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createStoryAction(data);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    createStory,
    isPending,
  };
}

export function useDeleteStory(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function deleteStory(id: string): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await deleteStoryAction(id);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    deleteStory,
    isPending,
  };
}

export function useUpdateStory(onError?: (error: ActionError) => void) {
  const [isPending, startTransition] = useTransition();

  function updateStory(
    params: UpdateStoryActionParams,
  ): Promise<ActionResponse> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateStoryAction(params);
        if (!res.success) onError?.(res.error);
        resolve(res);
      });
    });
  }

  return {
    isPending,
    updateStory,
  };
}
