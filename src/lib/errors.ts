/** Errors whose messages are safe to show to the user. Anything else is logged and hidden. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Please sign in to continue.") {
    super(message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that.") {
    super(message, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "That item could not be found.") {
    super(message, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "That change conflicts with existing data.") {
    super(message, "CONFLICT");
  }
}
