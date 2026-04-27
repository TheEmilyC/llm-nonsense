import { AppError } from "@/lib/error";

type LogContext = Record<string, unknown>;

export function parseError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(error instanceof AppError && {
        code: error.code,
        statusCode: error.statusCode,
      }),
    };
  }

  return { raw: String(error) };
}

function formatMessage(level: string, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timeStamp: new Date().toISOString(),
    ...context,
  };
  return entry;
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    console.debug(formatMessage("debug", message, context)),
  error: (message: string, context?: LogContext) =>
    console.error(formatMessage("error", message, context)),
  info: (message: string, context?: LogContext) =>
    console.info(formatMessage("info", message, context)),
  warn: (message: string, context?: LogContext) =>
    console.warn(formatMessage("warn", message, context)),
};
