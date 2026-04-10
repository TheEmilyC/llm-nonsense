export type ErrorCode = "INTERNAL_ERROR" | "NOT_FOUND" | "VALIDATION_ERROR";

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

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
