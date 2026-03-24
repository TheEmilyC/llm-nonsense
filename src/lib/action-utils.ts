export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string }
  | { success: undefined };

export async function withActionError<T>(
  fn: () => Promise<ActionResponse<T>>,
): Promise<ActionResponse<T>> {
  try {
    return await fn();
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { success: false, message };
  }
}
