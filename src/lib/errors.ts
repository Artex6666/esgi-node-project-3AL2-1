/**
 * Shape mirrors http-errors' isHttpError() check (status === statusCode,
 * boolean expose) so express-zod-api's defaultResultHandler propagates
 * the original status instead of coercing to 500.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly status: number;
  readonly expose: boolean;

  constructor(statusCode: number, message: string, options?: { expose?: boolean; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.status = statusCode;
    this.expose = options?.expose ?? statusCode < 500;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", options?: { cause?: unknown }) {
    super(400, message, options);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", options?: { cause?: unknown }) {
    super(401, message, options);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", options?: { cause?: unknown }) {
    super(403, message, options);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", options?: { cause?: unknown }) {
    super(404, message, options);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", options?: { cause?: unknown }) {
    super(409, message, options);
  }
}

export class UnprocessableError extends AppError {
  constructor(message = "Unprocessable", options?: { cause?: unknown }) {
    super(422, message, options);
  }
}
