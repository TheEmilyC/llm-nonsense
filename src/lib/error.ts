export type ErrorCode =
  | "CONSTRAINT_ERROR"
  | "INTERNAL_ERROR"
  | "LLM_ERROR"
  | "NOT_FOUND"
  | "OBSIDIAN_ERROR"
  | "VALIDATION_ERROR";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class LlmError extends AppError {
  constructor(message: string) {
    super(message, "LLM_ERROR");
    Object.setPrototypeOf(this, LlmError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} ${id} not found` : `${resource} not found`,
      "NOT_FOUND",
      404,
    );
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ObsidianError extends AppError {
  constructor(message: string, statusCode?: number) {
    super(message, "OBSIDIAN_ERROR", statusCode);
    Object.setPrototypeOf(this, ObsidianError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
