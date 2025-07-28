import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  DatabaseConnectionError,
  DatabaseTimeoutError,
  DatabaseConstraintError,
  DatabaseTransactionError,
  handleDatabaseError,
  withDatabaseErrorHandling,
  withTransactionErrorHandling,
  withBatchErrorHandling,
  validateQueryParameters,
  validateQueryOptions,
  checkDatabaseHealth,
  databaseMetrics,
  withMetricsCollection
} from '../databaseErrorHandling';
import {
  AppError,
  ValidationError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  ErrorCodes
} from '../errorHandling';

describe('Database Error Classes', () => {
  describe('DatabaseConnectionError', () => {
    it('should create error with correct properties', () => {
      const error = new DatabaseConnectionError();
      expect(error.name).toBe('DatabaseConnectionError');
      expect(error.code).toBe(ErrorCodes.DATABASE_ERROR);
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Database connection failed');
    });

    it('should accept custom message', () => {
      const error = new DatabaseConnectionError('Custom connection error');
      expect(error.message).toBe('Custom connection error');
    });
  });

  describe('DatabaseTimeoutError', () => {
    it('should create error with correct properties', () => {
      const error = new DatabaseTimeoutError();
      expect(error.name).toBe('DatabaseTimeoutError');
      expect(error.code).toBe(ErrorCodes.TIMEOUT_ERROR);
      expect(error.statusCode).toBe(504);
    });
  });

  describe('DatabaseConstraintError', () => {
    it('should create error with correct properties', () => {
      const error = new DatabaseConstraintError();
      expect(error.name).toBe('DatabaseConstraintError');
      expect(error.code).toBe(ErrorCodes.DATABASE_ERROR);
      expect(error.statusCode).toBe(409);
    });
  });

  describe('DatabaseTransactionError', () => {
    it('should create error with correct properties', () => {
      const error = new DatabaseTransactionError();
      expect(error.name).toBe('DatabaseTransactionError');
      expect(error.code).toBe(ErrorCodes.DATABASE_ERROR);
      expect(error.statusCode).toBe(500);
    });
  });
});

describe('handleDatabaseError', () => {
  it('should handle permission-denied error', () => {
    const error = { code: 'permission-denied' };
    expect(() => handleDatabaseError(error)).toThrow(PermissionError);
  });

  it('should handle not-found error', () => {
    const error = { code: 'not-found' };
    expect(() => handleDatabaseError(error)).toThrow(NotFoundError);
  });

  it('should handle already-exists error', () => {
    const error = { code: 'already-exists' };
    expect(() => handleDatabaseError(error)).toThrow(AppError);
    
    try {
      handleDatabaseError(error);
    } catch (e) {
      const appError = e as AppError;
      expect(appError.code).toBe(ErrorCodes.DOCUMENT_ALREADY_EXISTS);
      expect(appError.statusCode).toBe(409);
    }
  });

  it('should handle failed-precondition error', () => {
    const error = { code: 'failed-precondition' };
    expect(() => handleDatabaseError(error)).toThrow(DatabaseConstraintError);
  });

  it('should handle resource-exhausted error', () => {
    const error = { code: 'resource-exhausted' };
    expect(() => handleDatabaseError(error)).toThrow(RateLimitError);
  });

  it('should handle deadline-exceeded error', () => {
    const error = { code: 'deadline-exceeded' };
    expect(() => handleDatabaseError(error)).toThrow(DatabaseTimeoutError);
  });

  it('should handle unavailable error', () => {
    const error = { code: 'unavailable' };
    expect(() => handleDatabaseError(error)).toThrow(DatabaseConnectionError);
  });

  it('should handle aborted error', () => {
    const error = { code: 'aborted' };
    expect(() => handleDatabaseError(error)).toThrow(DatabaseTransactionError);
  });

  it('should handle out-of-range error', () => {
    const error = { code: 'out-of-range' };
    expect(() => handleDatabaseError(error)).toThrow(ValidationError);
  });

  it('should handle network-related errors', () => {
    const error = { message: 'network error occurred' };
    expect(() => handleDatabaseError(error)).toThrow(DatabaseConnectionError);
  });

  it('should handle timeout-related errors', () => {
    const error = { message: 'operation timeout' };
    expect(() => handleDatabaseError(error)).toThrow(DatabaseTimeoutError);
  });

  it('should handle unknown errors', () => {
    const error = { code: 'unknown-error', message: 'Unknown error' };
    expect(() => handleDatabaseError(error)).toThrow(AppError);
    
    try {
      handleDatabaseError(error);
    } catch (e) {
      const appError = e as AppError;
      expect(appError.code).toBe(ErrorCodes.DATABASE_ERROR);
      expect(appError.message).toContain('Database operation failed');
    }
  });

  it('should handle generic errors', () => {
    const error = { message: 'Generic error' };
    expect(() => handleDatabaseError(error)).toThrow(AppError);
  });
});

describe('withDatabaseErrorHandling', () => {
  it('should return success result for successful operation', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const result = await withDatabaseErrorHandling(operation);
    
    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.error).toBeUndefined();
  });

  it('should return error result for failed operation', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
    const result = await withDatabaseErrorHandling(operation);
    
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error!.message).toBe('Operation failed');
  });

  it('should handle AppError correctly', async () => {
    const appError = new ValidationError('Validation failed');
    const operation = jest.fn().mockRejectedValue(appError);
    const result = await withDatabaseErrorHandling(operation);
    
    expect(result.success).toBe(false);
    expect(result.error!.code).toBe(ErrorCodes.VALIDATION_FAILED);
  });
});

describe('withTransactionErrorHandling', () => {
  it('should return success result for successful transaction', async () => {
    const transactionFn = jest.fn().mockResolvedValue('transaction success');
    const result = await withTransactionErrorHandling(transactionFn);
    
    expect(result.success).toBe(true);
    expect(result.data).toBe('transaction success');
  });

  it('should handle aborted transaction', async () => {
    const transactionFn = jest.fn().mockRejectedValue({ code: 'aborted' });
    
    await expect(withTransactionErrorHandling(transactionFn)).rejects.toThrow(DatabaseTransactionError);
  });

  it('should handle other transaction errors', async () => {
    const transactionFn = jest.fn().mockRejectedValue({ code: 'permission-denied' });
    
    await expect(withTransactionErrorHandling(transactionFn)).rejects.toThrow(PermissionError);
  });
});

describe('withBatchErrorHandling', () => {
  it('should handle successful batch operations', async () => {
    const items = ['item1', 'item2', 'item3'];
    const operation = jest.fn().mockImplementation((item) => Promise.resolve(`processed-${item}`));
    
    const result = await withBatchErrorHandling(items, operation);
    
    expect(result.success).toBe(true);
    expect(result.results).toEqual(['processed-item1', 'processed-item2', 'processed-item3']);
    expect(result.errors).toHaveLength(0);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
  });

  it('should handle mixed success and failure', async () => {
    const items = ['item1', 'item2', 'item3'];
    const operation = jest.fn()
      .mockResolvedValueOnce('processed-item1')
      .mockRejectedValueOnce(new Error('Failed item2'))
      .mockResolvedValueOnce('processed-item3');
    
    const result = await withBatchErrorHandling(items, operation);
    
    expect(result.success).toBe(false);
    expect(result.results).toEqual(['processed-item1', 'processed-item3']);
    expect(result.errors).toHaveLength(1);
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(1);
  });

  it('should handle all failures', async () => {
    const items = ['item1', 'item2'];
    const operation = jest.fn().mockRejectedValue(new Error('All failed'));
    
    const result = await withBatchErrorHandling(items, operation);
    
    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(2);
  });
});

describe('validateQueryParameters', () => {
  it('should validate correct query parameters', () => {
    const filters = [
      { field: 'name', operator: '==', value: 'test' },
      { field: 'age', operator: '>', value: 18 }
    ];
    
    expect(() => validateQueryParameters(filters)).not.toThrow();
  });

  it('should reject non-array filters', () => {
    expect(() => validateQueryParameters('not-array' as any)).toThrow(ValidationError);
  });

  it('should reject filters without field', () => {
    const filters = [{ operator: '==', value: 'test' }];
    expect(() => validateQueryParameters(filters as any)).toThrow(ValidationError);
  });

  it('should reject filters without operator', () => {
    const filters = [{ field: 'name', value: 'test' }];
    expect(() => validateQueryParameters(filters as any)).toThrow(ValidationError);
  });

  it('should reject filters without value', () => {
    const filters = [{ field: 'name', operator: '==' }];
    expect(() => validateQueryParameters(filters as any)).toThrow(ValidationError);
  });

  it('should validate allowed fields', () => {
    const filters = [{ field: 'name', operator: '==', value: 'test' }];
    const options = { allowedFields: ['age', 'email'] };
    
    expect(() => validateQueryParameters(filters, options)).toThrow(ValidationError);
  });

  it('should validate allowed operators', () => {
    const filters = [{ field: 'name', operator: '==', value: 'test' }];
    const options = { allowedOperators: ['>', '<'] };
    
    expect(() => validateQueryParameters(filters, options)).toThrow(ValidationError);
  });
});

describe('validateQueryOptions', () => {
  it('should validate correct query options', () => {
    const options = {
      limit: 10,
      orderBy: { field: 'createdAt', direction: 'desc' as const }
    };
    
    expect(() => validateQueryOptions(options)).not.toThrow();
  });

  it('should reject invalid limit', () => {
    expect(() => validateQueryOptions({ limit: -1 })).toThrow(ValidationError);
    expect(() => validateQueryOptions({ limit: 0 })).toThrow(ValidationError);
    expect(() => validateQueryOptions({ limit: 1001 })).toThrow(ValidationError);
    expect(() => validateQueryOptions({ limit: 'invalid' })).toThrow(ValidationError);
  });

  it('should reject invalid orderBy', () => {
    expect(() => validateQueryOptions({ orderBy: { direction: 'desc' } })).toThrow(ValidationError);
    expect(() => validateQueryOptions({ orderBy: { field: 'name', direction: 'invalid' } })).toThrow(ValidationError);
  });
});

describe('checkDatabaseHealth', () => {
  it('should return healthy status', async () => {
    const health = await checkDatabaseHealth();
    
    expect(health.isHealthy).toBe(true);
    expect(typeof health.latency).toBe('number');
    expect(health.latency).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(health.errors)).toBe(true);
    expect(typeof health.timestamp).toBe('string');
  });
});

describe('DatabaseMetricsCollector', () => {
  beforeEach(() => {
    databaseMetrics.reset();
  });

  it('should record successful operations', () => {
    databaseMetrics.recordOperation(true, 100);
    databaseMetrics.recordOperation(true, 200);
    
    const metrics = databaseMetrics.getMetrics();
    expect(metrics.operationCount).toBe(2);
    expect(metrics.averageLatency).toBe(150);
    expect(metrics.errorRate).toBe(0);
  });

  it('should record failed operations', () => {
    databaseMetrics.recordOperation(true, 100);
    databaseMetrics.recordOperation(false, 200);
    
    const metrics = databaseMetrics.getMetrics();
    expect(metrics.operationCount).toBe(2);
    expect(metrics.errorRate).toBe(50);
  });

  it('should record errors', () => {
    const error = {
      code: 'TEST_ERROR',
      message: 'Test error',
      timestamp: new Date().toISOString()
    };
    
    databaseMetrics.recordError(error);
    
    const metrics = databaseMetrics.getMetrics();
    expect(metrics.lastError).toEqual(error);
  });

  it('should handle empty metrics', () => {
    const metrics = databaseMetrics.getMetrics();
    expect(metrics.operationCount).toBe(0);
    expect(metrics.averageLatency).toBe(0);
    expect(metrics.errorRate).toBe(0);
  });

  it('should limit operation history', () => {
    // Record more than 1000 operations
    for (let i = 0; i < 1200; i++) {
      databaseMetrics.recordOperation(true, 100);
    }
    
    // Should only keep last 1000
    const metrics = databaseMetrics.getMetrics();
    expect(metrics.operationCount).toBeLessThanOrEqual(1000);
  });

  it('should reset metrics', () => {
    databaseMetrics.recordOperation(true, 100);
    databaseMetrics.recordError({
      code: 'TEST',
      message: 'Test',
      timestamp: new Date().toISOString()
    });
    
    databaseMetrics.reset();
    
    const metrics = databaseMetrics.getMetrics();
    expect(metrics.operationCount).toBe(0);
    expect(metrics.lastError).toBeUndefined();
  });
});

describe('withMetricsCollection', () => {
  beforeEach(() => {
    databaseMetrics.reset();
  });

  it('should collect metrics for successful operations', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    
    const result = await withMetricsCollection(operation, 'test-operation');
    
    expect(result).toBe('success');
    
    const metrics = databaseMetrics.getMetrics();
    expect(metrics.operationCount).toBe(1);
    expect(metrics.errorRate).toBe(0);
  });

  it('should collect metrics for failed operations', async () => {
    const operation = jest.fn().mockRejectedValue(new AppError('Test error'));
    
    await expect(withMetricsCollection(operation, 'test-operation')).rejects.toThrow('Test error');
    
    const metrics = databaseMetrics.getMetrics();
    expect(metrics.operationCount).toBe(1);
    expect(metrics.errorRate).toBe(100);
    expect(metrics.lastError).toBeDefined();
  });

  it('should measure operation latency', async () => {
    const operation = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('success'), 50))
    );
    
    await withMetricsCollection(operation, 'test-operation');
    
    const metrics = databaseMetrics.getMetrics();
    expect(metrics.averageLatency).toBeGreaterThan(40); // Should be around 50ms
  });
});