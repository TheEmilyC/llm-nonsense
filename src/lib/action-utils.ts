import { flattenError, ZodError } from "zod";

import {
  AppError,
  ErrorCode,
  LlmError,
  ObsidianError,
  ValidationError,
} from "@/lib/error";

export type ActionError = {
  code: ErrorCode;
  details?: Record<string, string[]>;
  message: string;
};

export type ActionResponse<T = void> =
  | { data?: T; success: true }
  | {
      error: ActionError;
      success: false;
    };

export function toActionResponseError<T>(error: unknown): ActionResponse<T> {
  if (error instanceof ZodError) {
    const { fieldErrors } = flattenError(error);
    return {
      error: {
        code: "VALIDATION_ERROR",
        details: Object.fromEntries(
          Object.entries(fieldErrors).filter(([, v]) => v !== undefined),
        ) as Record<string, string[]>,
        message: "Validation failed",
      },
      success: false,
    };
  }
  if (error instanceof ValidationError) {
    return {
      error: {
        code: error.code,
        details: error.details,
        message: error.message,
      },
      success: false,
    };
  }
  if (
    error instanceof AppError ||
    error instanceof LlmError ||
    error instanceof ObsidianError
  ) {
    return {
      error: { code: error.code, message: error.message },
      success: false,
    };
  }
  return {
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    success: false,
  };
}
