/**
 * Custom Error Classes
 * Provides specific error types for better error handling
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONFIG_ERROR', cause);
  }
}

/**
 * API error
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    cause?: Error
  ) {
    super(message, 'API_ERROR', cause);
  }
}

/**
 * Trade execution error
 */
export class TradeExecutionError extends AppError {
  constructor(
    message: string,
    public readonly positionId?: string,
    cause?: Error
  ) {
    super(message, 'TRADE_EXECUTION_ERROR', cause);
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 'VALIDATION_ERROR', cause);
  }
}

