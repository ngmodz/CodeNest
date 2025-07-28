import { SubmissionDocument, TestResult, ValidationError, ValidationResult, PROGRAMMING_LANGUAGES, SUBMISSION_STATUSES } from '@/types';

export function validateSubmissionData(data: Partial<SubmissionDocument>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate uid
  if (data.uid !== undefined) {
    if (typeof data.uid !== 'string') {
      errors.push({ field: 'uid', message: 'User ID is required and must be a string' });
    } else if (data.uid.trim().length === 0) {
      errors.push({ field: 'uid', message: 'User ID cannot be empty' });
    }
  }

  // Validate problemId
  if (data.problemId !== undefined) {
    if (typeof data.problemId !== 'string') {
      errors.push({ field: 'problemId', message: 'Problem ID is required and must be a string' });
    } else if (data.problemId.trim().length === 0) {
      errors.push({ field: 'problemId', message: 'Problem ID cannot be empty' });
    }
  }

  // Validate code
  if (data.code !== undefined) {
    if (typeof data.code !== 'string') {
      errors.push({ field: 'code', message: 'Code is required and must be a string' });
    } else if (data.code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Code cannot be empty' });
    } else if (data.code.length > 50000) {
      errors.push({ field: 'code', message: 'Code must be less than 50,000 characters' });
    }
  }

  // Validate language
  if (data.language !== undefined) {
    if (!data.language) {
      errors.push({ field: 'language', message: 'Programming language is required' });
    } else if (!PROGRAMMING_LANGUAGES.includes(data.language as any)) {
      errors.push({ field: 'language', message: 'Invalid programming language' });
    }
  }

  // Validate status
  if (data.status !== undefined) {
    if (!data.status) {
      errors.push({ field: 'status', message: 'Status is required' });
    } else if (!SUBMISSION_STATUSES.includes(data.status as any)) {
      errors.push({ field: 'status', message: 'Invalid submission status' });
    }
  }

  // Validate executionTime (optional)
  if (data.executionTime !== undefined) {
    if (typeof data.executionTime !== 'number' || data.executionTime < 0) {
      errors.push({ field: 'executionTime', message: 'Execution time must be a non-negative number' });
    }
  }

  // Validate memoryUsage (optional)
  if (data.memoryUsage !== undefined) {
    if (typeof data.memoryUsage !== 'number' || data.memoryUsage < 0) {
      errors.push({ field: 'memoryUsage', message: 'Memory usage must be a non-negative number' });
    }
  }

  // Validate testResults
  if (data.testResults !== undefined) {
    if (!Array.isArray(data.testResults)) {
      errors.push({ field: 'testResults', message: 'Test results must be an array' });
    } else {
      data.testResults.forEach((result, index) => {
        const resultErrors = validateTestResult(result);
        resultErrors.forEach(error => {
          errors.push({
            field: `testResults[${index}].${error.field}`,
            message: error.message
          });
        });
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateCompleteSubmission(submission: Omit<SubmissionDocument, 'id' | 'submittedAt'>): ValidationResult {
  const requiredFields = ['uid', 'problemId', 'code', 'language', 'status', 'testResults'];
  const errors: ValidationError[] = [];

  // Check for required fields
  for (const field of requiredFields) {
    if (!(field in submission) || submission[field as keyof typeof submission] === undefined) {
      errors.push({ field, message: `${field} is required` });
    }
  }

  // If all required fields are present, validate the data
  if (errors.length === 0) {
    const validationResult = validateSubmissionData(submission);
    errors.push(...validationResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateTestResult(result: TestResult): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate passed flag
  if (typeof result.passed !== 'boolean') {
    errors.push({ field: 'passed', message: 'Passed must be a boolean' });
  }

  // Validate input
  if (result.input === undefined || typeof result.input !== 'string') {
    errors.push({ field: 'input', message: 'Input is required and must be a string' });
  }

  // Validate expectedOutput
  if (result.expectedOutput === undefined || typeof result.expectedOutput !== 'string') {
    errors.push({ field: 'expectedOutput', message: 'Expected output is required and must be a string' });
  }

  // Validate actualOutput
  if (result.actualOutput === undefined || typeof result.actualOutput !== 'string') {
    errors.push({ field: 'actualOutput', message: 'Actual output is required and must be a string' });
  }

  // Validate executionTime
  if (typeof result.executionTime !== 'number' || result.executionTime < 0) {
    errors.push({ field: 'executionTime', message: 'Execution time must be a non-negative number' });
  }

  // Validate memoryUsage
  if (typeof result.memoryUsage !== 'number' || result.memoryUsage < 0) {
    errors.push({ field: 'memoryUsage', message: 'Memory usage must be a non-negative number' });
  }

  // Validate error (optional)
  if (result.error !== undefined && typeof result.error !== 'string') {
    errors.push({ field: 'error', message: 'Error must be a string' });
  }

  return errors;
}

export function sanitizeSubmissionData(data: Partial<SubmissionDocument>): Partial<SubmissionDocument> {
  const sanitized: Partial<SubmissionDocument> = {};

  if (data.uid && typeof data.uid === 'string') {
    sanitized.uid = data.uid.trim();
  }

  if (data.problemId && typeof data.problemId === 'string') {
    sanitized.problemId = data.problemId.trim();
  }

  if (data.code && typeof data.code === 'string') {
    sanitized.code = data.code; // Don't trim code as whitespace might be significant
  }

  if (data.language && PROGRAMMING_LANGUAGES.includes(data.language as any)) {
    sanitized.language = data.language;
  }

  if (data.status && SUBMISSION_STATUSES.includes(data.status as any)) {
    sanitized.status = data.status;
  }

  if (typeof data.executionTime === 'number' && data.executionTime >= 0) {
    sanitized.executionTime = data.executionTime;
  }

  if (typeof data.memoryUsage === 'number' && data.memoryUsage >= 0) {
    sanitized.memoryUsage = data.memoryUsage;
  }

  if (Array.isArray(data.testResults)) {
    sanitized.testResults = data.testResults.map(result => ({
      passed: Boolean(result.passed),
      input: String(result.input || ''),
      expectedOutput: String(result.expectedOutput || ''),
      actualOutput: String(result.actualOutput || ''),
      executionTime: Math.max(0, Number(result.executionTime) || 0),
      memoryUsage: Math.max(0, Number(result.memoryUsage) || 0),
      error: result.error ? String(result.error) : undefined
    }));
  }

  return sanitized;
}

export function calculateSubmissionScore(testResults: TestResult[]): number {
  if (testResults.length === 0) return 0;
  
  const passedTests = testResults.filter(result => result.passed).length;
  return Math.round((passedTests / testResults.length) * 100);
}

export function getSubmissionSummary(submission: SubmissionDocument): {
  totalTests: number;
  passedTests: number;
  score: number;
  averageExecutionTime: number;
  averageMemoryUsage: number;
} {
  const totalTests = submission.testResults.length;
  const passedTests = submission.testResults.filter(result => result.passed).length;
  const score = calculateSubmissionScore(submission.testResults);
  
  const averageExecutionTime = totalTests > 0 
    ? submission.testResults.reduce((sum, result) => sum + result.executionTime, 0) / totalTests
    : 0;
    
  const averageMemoryUsage = totalTests > 0
    ? submission.testResults.reduce((sum, result) => sum + result.memoryUsage, 0) / totalTests
    : 0;

  return {
    totalTests,
    passedTests,
    score,
    averageExecutionTime: Math.round(averageExecutionTime * 1000) / 1000, // Round to 3 decimal places
    averageMemoryUsage: Math.round(averageMemoryUsage * 100) / 100 // Round to 2 decimal places
  };
}