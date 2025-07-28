import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  PermissionError, 
  RateLimitError,
  ErrorCodes,
  logError,
  createErrorResponse
} from './errorHandling';
import { DatabaseResult, ErrorResponse } from '@/types';

// Enhanced database error types
export class DatabaseConnectionError extends AppError {
  constructor(message: string = 'Database connection failed') {
    super(message, ErrorCodes.DATABASE_ERROR, 503);
    this.name = 'DatabaseConnectionError';
  }
}

export class DatabaseTimeoutError extends AppError {
  constructor(message: string = 'Database operation timed out') {
    super(message, ErrorCodes.TIMEOUT_ERROR, 504);
    this.name = 'DatabaseTimeoutError';
  }
}

export class DatabaseConstraintError extends AppError {
  constructor(message: string = 'Database constraint violation') {
    super(message, ErrorCodes.DATABASE_ERROR, 409);
    this.name = 'DatabaseConstraintError';
  }
}

export class DatabaseTransactionError extends AppError {
  constructor(message: string = 'Database transaction failed') {
    super(message, ErrorCodes.DATABASE_ERROR, 500);
    this.name = 'DatabaseTransactionError';
  }
}

// Enhanced database error handler
export function handleDatabaseError(error: any, context?: Record<string, any>): never {
  logError(error, { ...context, source: 'database' });

  // Handle Firestore specific errors
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        throw new PermissionError('Access denied to this resource');
      
      case 'not-found':
        throw new NotFoundError('Requested document not found');
      
      case 'already-exists':
        throw new AppError('Document already exists', ErrorCodes.DOCUMENT_ALREADY_EXISTS, 409);
      
      case 'failed-precondition':
        throw new DatabaseConstraintError('Operation failed due to database constraint');
      
      case 'resource-exhausted':
        throw new RateLimitError('Database quota exceeded');
      
      case 'deadline-exceeded':
        throw new DatabaseTimeoutError('Database operation timed out');
      
      case 'unavailable':
        throw new DatabaseConnectionError('Database service is currently unavailable');
      
      case 'aborted':
        throw new DatabaseTransactionError('Database transaction was aborted');
      
      case 'out-of-range':
        throw new ValidationError('Database query parameters are out of range');
      
      case 'unimplemented':
        throw new AppError('Database operation not supported', ErrorCodes.DATABASE_ERROR, 501);
      
      case 'internal':
        throw new AppError('Internal database error', ErrorCodes.DATABASE_ERROR, 500);
      
      case 'data-loss':
        throw new AppError('Database data corruption detected', ErrorCodes.DATABASE_ERROR, 500);
      
      default:
        throw new AppError(
          `Database operation failed: ${error.message}`,
          ErrorCodes.DATABASE_ERROR,
          500,
          { originalCode: error.code }
        );
    }
  }

  // Handle network-related errors
  if (error.message?.includes('network') || error.message?.includes('connection')) {
    throw new DatabaseConnectionError('Database connection failed');
  }

  // Handle timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('deadline')) {
    throw new DatabaseTimeoutError('Database operation timed out');
  }

  // Generic database error
  throw new AppError(
    'Database operation failed',
    ErrorCodes.DATABASE_ERROR,
    500,
    { originalError: error.message }
  );
}

// Database operation wrapper with enhanced error handling
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<DatabaseResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError(
      error instanceof Error ? error.message : 'Unknown database error',
      ErrorCodes.DATABASE_ERROR,
      500
    );
    
    logError(appError, context);
    
    return {
      success: false,
      error: createErrorResponse(appError)
    };
  }
}

// Transaction wrapper with enhanced error handling
export async function withTransactionErrorHandling<T>(
  transactionFn: () => Promise<T>,
  context?: Record<string, any>
): Promise<DatabaseResult<T>> {
  try {
    const result = await transactionFn();
    return { success: true, data: result };
  } catch (error) {
    logError(error as Error, { ...context, operation: 'transaction' });

    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'aborted') {
      throw new DatabaseTransactionError('Transaction was aborted due to conflicts');
    }

    handleDatabaseError(error, context);
  }
}

// Batch operation error handler
export interface BatchOperationResult<T> {
  success: boolean;
  results: T[];
  errors: ErrorResponse[];
  successCount: number;
  failureCount: number;
}

export async function withBatchErrorHandling<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  context?: Record<string, any>
): Promise<BatchOperationResult<R>> {
  const results: R[] = [];
  const errors: ErrorResponse[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const result = await operation(items[i]);
      results.push(result);
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        error instanceof Error ? error.message : 'Batch operation failed',
        ErrorCodes.DATABASE_ERROR,
        500
      );
      
      logError(appError, { ...context, batchIndex: i, item: items[i] });
      errors.push(createErrorResponse(appError));
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
    successCount: results.length,
    failureCount: errors.length
  };
}

// Query validation and error handling
export interface QueryValidationOptions {
  maxLimit?: number;
  allowedFields?: string[];
  allowedOperators?: string[];
}

export function validateQueryParameters(
  filters: any[],
  options: QueryValidationOptions = {}
): void {
  const { maxLimit = 1000, allowedFields = [], allowedOperators = [] } = options;

  if (!Array.isArray(filters)) {
    throw new ValidationError('Query filters must be an array');
  }

  for (const filter of filters) {
    if (!filter.field || typeof filter.field !== 'string') {
      throw new ValidationError('Query filter field is required and must be a string');
    }

    if (allowedFields.length > 0 && !allowedFields.includes(filter.field)) {
      throw new ValidationError(`Query field '${filter.field}' is not allowed`);
    }

    if (!filter.operator || typeof filter.operator !== 'string') {
      throw new ValidationError('Query filter operator is required and must be a string');
    }

    if (allowedOperators.length > 0 && !allowedOperators.includes(filter.operator)) {
      throw new ValidationError(`Query operator '${filter.operator}' is not allowed`);
    }

    if (filter.value === undefined) {
      throw new ValidationError('Query filter value is required');
    }
  }
}

export function validateQueryOptions(options: any): void {
  if (options.limit !== undefined) {
    if (typeof options.limit !== 'number' || options.limit <= 0) {
      throw new ValidationError('Query limit must be a positive number');
    }
    if (options.limit > 1000) {
      throw new ValidationError('Query limit cannot exceed 1000');
    }
  }

  if (options.orderBy !== undefined) {
    if (!options.orderBy.field || typeof options.orderBy.field !== 'string') {
      throw new ValidationError('Query orderBy field is required and must be a string');
    }
    if (options.orderBy.direction && !['asc', 'desc'].includes(options.orderBy.direction)) {
      throw new ValidationError('Query orderBy direction must be "asc" or "desc"');
    }
  }
}

// Database health check utilities
export interface DatabaseHealthStatus {
  isHealthy: boolean;
  latency: number;
  errors: string[];
  timestamp: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const startTime = Date.now();
  const errors: string[] = [];
  let isHealthy = true;

  try {
    // Perform a simple read operation to test connectivity
    // This would be implemented based on your specific database setup
    // For now, we'll simulate a health check
    await new Promise(resolve => setTimeout(resolve, 10));
  } catch (error) {
    isHealthy = false;
    errors.push(error instanceof Error ? error.message : 'Database health check failed');
  }

  const latency = Date.now() - startTime;

  return {
    isHealthy,
    latency,
    errors,
    timestamp: new Date().toISOString()
  };
}

// Database metrics collection
export interface DatabaseMetrics {
  operationCount: number;
  averageLatency: number;
  errorRate: number;
  lastError?: ErrorResponse;
  timestamp: string;
}

class DatabaseMetricsCollector {
  private operations: { success: boolean; latency: number; timestamp: number }[] = [];
  private lastError?: ErrorResponse;

  recordOperation(success: boolean, latency: number): void {
    this.operations.push({
      success,
      latency,
      timestamp: Date.now()
    });

    // Keep only last 1000 operations
    if (this.operations.length > 1000) {
      this.operations = this.operations.slice(-1000);
    }
  }

  recordError(error: ErrorResponse): void {
    this.lastError = error;
  }

  getMetrics(): DatabaseMetrics {
    const now = Date.now();
    const recentOperations = this.operations.filter(op => now - op.timestamp < 300000); // Last 5 minutes

    const operationCount = recentOperations.length;
    const averageLatency = operationCount > 0 
      ? recentOperations.reduce((sum, op) => sum + op.latency, 0) / operationCount 
      : 0;
    const errorCount = recentOperations.filter(op => !op.success).length;
    const errorRate = operationCount > 0 ? errorCount / operationCount : 0;

    return {
      operationCount,
      averageLatency: Math.round(averageLatency * 100) / 100,
      errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimal places
      lastError: this.lastError,
      timestamp: new Date().toISOString()
    };
  }

  reset(): void {
    this.operations = [];
    this.lastError = undefined;
  }
}

export const databaseMetrics = new DatabaseMetricsCollector();

// Wrapper to collect metrics for database operations
export async function withMetricsCollection<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const latency = Date.now() - startTime;
    databaseMetrics.recordOperation(true, latency);
    return result;
  } catch (error) {
    const latency = Date.now() - startTime;
    databaseMetrics.recordOperation(false, latency);
    
    if (error instanceof AppError) {
      databaseMetrics.recordError(createErrorResponse(error));
    }
    
    throw error;
  }
}