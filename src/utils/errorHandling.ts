import { ErrorResponse } from '@/types';

export enum ErrorCodes {
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Database errors
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DOCUMENT_ALREADY_EXISTS = 'DOCUMENT_ALREADY_EXISTS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  JUDGE0_ERROR = 'JUDGE0_ERROR',
  GEMINI_ERROR = 'GEMINI_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    code: string = ErrorCodes.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorCodes.VALIDATION_FAILED, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', code: string = ErrorCodes.AUTH_REQUIRED) {
    super(message, code, 401);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, ErrorCodes.PERMISSION_DENIED, 403);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, ErrorCodes.DOCUMENT_NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, ErrorCodes.RATE_LIMIT_EXCEEDED, 429);
    this.name = 'RateLimitError';
  }
}

export function createErrorResponse(error: Error | AppError): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp
    };
  }

  // Handle Firebase errors
  if (error.message.includes('permission-denied')) {
    return {
      code: ErrorCodes.PERMISSION_DENIED,
      message: 'Permission denied',
      timestamp
    };
  }

  if (error.message.includes('not-found')) {
    return {
      code: ErrorCodes.DOCUMENT_NOT_FOUND,
      message: 'Document not found',
      timestamp
    };
  }

  if (error.message.includes('already-exists')) {
    return {
      code: ErrorCodes.DOCUMENT_ALREADY_EXISTS,
      message: 'Document already exists',
      timestamp
    };
  }

  // Default error response
  return {
    code: ErrorCodes.INTERNAL_ERROR,
    message: process.env.NODE_ENV === 'production' 
      ? 'An internal error occurred' 
      : error.message,
    details: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    timestamp
  };
}

export function handleDatabaseError(error: any): never {
  console.error('Database error:', error);

  if (error.code === 'permission-denied') {
    throw new PermissionError('Access denied to this resource');
  }

  if (error.code === 'not-found') {
    throw new NotFoundError('Requested document not found');
  }

  if (error.code === 'already-exists') {
    throw new AppError('Document already exists', ErrorCodes.DOCUMENT_ALREADY_EXISTS, 409);
  }

  if (error.code === 'failed-precondition') {
    throw new AppError('Operation failed due to precondition', ErrorCodes.DATABASE_ERROR, 400);
  }

  if (error.code === 'resource-exhausted') {
    throw new RateLimitError('Database quota exceeded');
  }

  // Generic database error
  throw new AppError(
    'Database operation failed',
    ErrorCodes.DATABASE_ERROR,
    500,
    { originalError: error.message }
  );
}

export function handleExternalServiceError(serviceName: string, error: any): never {
  console.error(`${serviceName} service error:`, error);

  let code: string;
  let message: string;

  switch (serviceName.toLowerCase()) {
    case 'judge0':
      code = ErrorCodes.JUDGE0_ERROR;
      message = 'Code execution service is currently unavailable';
      break;
    case 'openrouter':
      code = ErrorCodes.GEMINI_ERROR; // Keep the same error code for compatibility
      message = 'AI service is currently unavailable';
      break;
    default:
      code = ErrorCodes.EXTERNAL_SERVICE_ERROR;
      message = `${serviceName} service is currently unavailable`;
  }

  throw new AppError(message, code, 503, { service: serviceName, originalError: error.message });
}

export function isRetryableError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return [
      ErrorCodes.NETWORK_ERROR,
      ErrorCodes.TIMEOUT_ERROR,
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      ErrorCodes.JUDGE0_ERROR,
      ErrorCodes.GEMINI_ERROR
    ].includes(error.code as ErrorCodes);
  }

  // Check for network-related errors
  const networkErrorMessages = [
    'network error',
    'timeout',
    'connection refused',
    'service unavailable',
    'internal server error'
  ];

  return networkErrorMessages.some(msg => 
    error.message.toLowerCase().includes(msg)
  );
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries || !isRetryableError(lastError)) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export function logError(error: Error | AppError, context?: Record<string, any>): void {
  const errorInfo: Record<string, any> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context
  };

  if (error instanceof AppError) {
    errorInfo.code = error.code;
    errorInfo.statusCode = error.statusCode;
    errorInfo.details = error.details;
  }

  console.error('Application Error:', JSON.stringify(errorInfo, null, 2));
}

export function sanitizeErrorForClient(error: Error | AppError): ErrorResponse {
  const errorResponse = createErrorResponse(error);

  // In production, don't expose sensitive information
  if (process.env.NODE_ENV === 'production') {
    delete errorResponse.details;
    
    // Use generic messages for internal errors
    if (errorResponse.code === ErrorCodes.INTERNAL_ERROR) {
      errorResponse.message = 'An unexpected error occurred';
    }
  }

  return errorResponse;
}