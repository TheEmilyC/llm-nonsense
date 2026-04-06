import { ApiError } from "@/lib/error";

export type ActionResponse<T> =
  | { data: T; success: true; }
  | { error: string; status?: number; success: false; };

export function unwrapAction<T>(result: ActionResponse<T>): T {
  if (!result.success) {
    throw new ApiError(result.error, result.status);
  }
  return result.data;
}

export async function withActionError<T>(
  fn: () => Promise<ActionResponse<T>>,
): Promise<ActionResponse<T>> {
  try {
    return await fn();
  } catch (err) {
    console.error(err);
    const error =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return { error, success: false };
  }
}
