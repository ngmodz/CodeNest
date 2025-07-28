import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  PermissionError, 
  NotFoundError, 
  RateLimitError,
  createErrorResponse,
  handleDatabaseError,
  handleExternalServiceError,
  isRetryableError,
  withRetry,
  sanitizeErrorForClient,
  ErrorCodes
} from '../errorHandling';

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AppError', () => {
    it('should create AppError with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should create AppError with custom values', () => {
      const error = new AppError('Custom error', ErrorCodes.VALIDATION_FAILED, 400, { field: 'test' });
      
      expect(error.message).toBe('Custom error');
      expect(error.code).toBe(ErrorCodes.VALIDATION_FAILED);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
    });
  });

  describe('Specific Error Types', () => {
    it('should create ValidationError', () => {
      const error = new ValidationError('Validation failed', { field: 'email' });
      
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe(ErrorCodes.VALIDATION_FAILED);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create AuthenticationError', () => {
      const error = new AuthenticationError();
      
      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe(ErrorCodes.AUTH_REQUIRED);
      expect(error.statusCode).toBe(401);
    });

    it('should create PermissionError', () => {
      const error = new PermissionError();
      
      expect(error.name).toBe('PermissionError');
      expect(error.code).toBe(ErrorCodes.PERMISSION_DENIED);
      expect(error.statusCode).toBe(403);
    });

    it('should create NotFoundError', () => {
      const error = new NotFoundError();
      
      expect(error.name).toBe('NotFoundError');
      expect(error.code).toBe(ErrorCodes.DOCUMENT_NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('should create RateLimitError', () => {
      const error = new RateLimitError();
      
      expect(error.name).toBe('RateLimitError');
      expect(error.code).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response from AppError', () => {
      const error = new AppError('Test error', ErrorCodes.VALIDATION_FAILED, 400, { field: 'test' });
      const response = createErrorResponse(error);
      
      expect(response.code).toBe(ErrorCodes.VALIDATION_FAILED);
      expect(response.message).toBe('Test error');
      expect(response.details).toEqual({ field: 'test' });
      expect(response.timestamp).toBeDefined();
    });

    it('should create error response from regular Error', () => {
      const error = new Error('Regular error');
      const response = createErrorResponse(error);
      
      expect(response.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(response.message).toBe('Regular error');
      expect(response.timestamp).toBeDefined();
    });

    it('should handle Firebase permission-denied error', () => {
      const error = new Error('permission-denied: Access denied');
      const response = createErrorResponse(error);
      
      expect(response.code).toBe(ErrorCodes.PERMISSION_DENIED);
      expect(response.message).toBe('Permission denied');
    });

    it('should handle Firebase not-found error', () => {
      const error = new Error('not-found: Document not found');
      const response = createErrorResponse(error);
      
      expect(response.code).toBe(ErrorCodes.DOCUMENT_NOT_FOUND);
      expect(response.message).toBe('Document not found');
    });
  });

  describe('handleDatabaseError', () => {
    it('should throw PermissionError for permission-denied', () => {
      const error = { code: 'permission-denied' };
      
      expect(() => handleDatabaseError(error)).toThrow(PermissionError);
    });

    it('should throw NotFoundError for not-found', () => {
      const error = { code: 'not-found' };
      
      expect(() => handleDatabaseError(error)).toThrow(NotFoundError);
    });

    it('should throw AppError for already-exists', () => {
      const error = { code: 'already-exists' };
      
      expect(() => handleDatabaseError(error)).toThrow(AppError);
    });

    it('should throw RateLimitError for resource-exhausted', () => {
      const error = { code: 'resource-exhausted' };
      
      expect(() => handleDatabaseError(error)).toThrow(RateLimitError);
    });

    it('should throw generic AppError for unknown errors', () => {
      const error = { code: 'unknown-error', message: 'Unknown error' };
      
      expect(() => handleDatabaseError(error)).toThrow(AppError);
    });
  });

  describe('handleExternalServiceError', () => {
    it('should throw Judge0 error', () => {
      const error = new Error('Service unavailable');
      
      expect(() => handleExternalServiceError('judge0', error)).toThrow(AppError);
      
      try {
        handleExternalServiceError('judge0', error);
      } catch (e) {
        const appError = e as AppError;
        expect(appError.code).toBe(ErrorCodes.JUDGE0_ERROR);
        expect(appError.message).toBe('Code execution service is currently unavailable');
      }
    });

    it('should throw Gemini error', () => {
      const error = new Error('API error');
      
      expect(() => handleExternalServiceError('gemini', error)).toThrow(AppError);
      
      try {
        handleExternalServiceError('gemini', error);
      } catch (e) {
        const appError = e as AppError;
        expect(appError.code).toBe(ErrorCodes.GEMINI_ERROR);
        expect(appError.message).toBe('AI service is currently unavailable');
      }
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable AppErrors', () => {
      const networkError = new AppError('Network error', ErrorCodes.NETWORK_ERROR);
      const timeoutError = new AppError('Timeout', ErrorCodes.TIMEOUT_ERROR);
      const validationError = new ValidationError('Invalid data');
      
      expect(isRetryableError(networkError)).toBe(true);
      expect(isRetryableError(timeoutError)).toBe(true);
      expect(isRetryableError(validationError)).toBe(false);
    });

    it('should identify retryable regular errors', () => {
      const networkError = new Error('network error occurred');
      const timeoutError = new Error('request timeout');
      const validationError = new Error('invalid input');
      
      expect(isRetryableError(networkError)).toBe(true);
      expect(isRetryableError(timeoutError)).toBe(true);
      expect(isRetryableError(validationError)).toBe(false);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation, 3, 100);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');
      
      const result = await withRetry(operation, 3, 10); // Short delay for testing
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new ValidationError('Invalid data'));
      
      await expect(withRetry(operation, 3, 10)).rejects.toThrow(ValidationError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('network error'));
      
      await expect(withRetry(operation, 2, 10)).rejects.toThrow('network error');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('sanitizeErrorForClient', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should sanitize error in production', () => {
      process.env.NODE_ENV = 'production';
      
      const error = new AppError('Internal error', ErrorCodes.INTERNAL_ERROR, 500, { sensitive: 'data' });
      const sanitized = sanitizeErrorForClient(error);
      
      expect(sanitized.details).toBeUndefined();
      expect(sanitized.message).toBe('An unexpected error occurred');
    });

    it('should not sanitize error in development', () => {
      process.env.NODE_ENV = 'development';
      
      const error = new AppError('Internal error', ErrorCodes.INTERNAL_ERROR, 500, { debug: 'info' });
      const sanitized = sanitizeErrorForClient(error);
      
      expect(sanitized.details).toEqual({ debug: 'info' });
      expect(sanitized.message).toBe('Internal error');
    });

    it('should preserve validation errors in production', () => {
      process.env.NODE_ENV = 'production';
      
      const error = new ValidationError('Invalid email format');
      const sanitized = sanitizeErrorForClient(error);
      
      expect(sanitized.message).toBe('Invalid email format');
      expect(sanitized.code).toBe(ErrorCodes.VALIDATION_FAILED);
    });
  });
});