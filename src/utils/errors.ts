export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSeconds: number;

  constructor(message = 'Too many requests. Please try again later.', retryAfterSeconds = 60) {
    super(message, 429);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AIError extends AppError {
  public readonly isTransient: boolean;

  constructor(message: string, isTransient = false, statusCode = 502) {
    super(message, statusCode);
    this.isTransient = isTransient;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ModerationError extends AppError {
  public readonly reason: string;

  constructor(reason: string, message = 'Message rejected by moderation policy') {
    super(message, 400);
    this.reason = reason;
  }
}

