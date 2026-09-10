import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/** Shape returned for every API error. */
export type ApiError = {
  error: {
    code: string;
    message: string;
    /** Field-level messages for validation failures, keyed by dotted path. */
    fields?: Record<string, string>;
  };
};

export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): NextResponse<ApiError> {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

/** Thrown by guards / services to short-circuit a request with a status. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Wraps a route handler so thrown `HttpError`s and `ZodError`s become the
 * standard error response and anything else becomes a 500.
 */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return apiError(err.status, err.code, err.message, err.fields);
      }
      if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of err.issues) fields[issue.path.join('.')] = issue.message;
        return apiError(422, 'validation_error', 'La solicitud no es válida.', fields);
      }
      console.error(err);
      return apiError(500, 'internal_error', 'Se produjo un error inesperado.');
    }
  };
}
