// Test case management utilities
import { TestCase, TestResult, SubmissionDocument } from '@/types';

/**
 * Compare expected output with actual output
 * Handles different types of output comparison including whitespace normalization
 */
export function compareOutputs(expected: string, actual: string, strict: boolean = false): boolean {
  if (strict) {
    return expected === actual;
  }
  
  // Normalize whitespace and remove trailing newlines/spaces
  const normalizeOutput = (output: string): string => {
    return output
      .trim()
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\s+$/gm, '')  // Remove trailing whitespace from each line
      .replace(/\n+$/, '');   // Remove trailing newlines
  };

  const normalizedExpected = normalizeOutput(expected);
  const normalizedActual = normalizeOutput(actual);
  
  return normalizedExpected === normalizedActual;
}

/**
 * Validate test case input format
 */
export function validateTestCaseInput(input: string): { isValid: boolean; error?: string } {
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Input must be a string' };
  }
  
  if (input.length > 10000) {
    return { isValid: false, error: 'Input is too long (max 10,000 characters)' };
  }
  
  return { isValid: true };
}

/**
 * Validate test case expected output format
 */
export function validateTestCaseOutput(output: string): { isValid: boolean; error?: string } {
  if (typeof output !== 'string') {
    return { isValid: false, error: 'Output must be a string' };
  }
  
  if (output.length > 10000) {
    return { isValid: false, error: 'Output is too long (max 10,000 characters)' };
  }
  
  return { isValid: true };
}

/**
 * Validate a complete test case
 */
export function validateTestCase(testCase: TestCase): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const inputValidation = validateTestCaseInput(testCase.input);
  if (!inputValidation.isValid) {
    errors.push(`Input: ${inputValidation.error}`);
  }
  
  const outputValidation = validateTestCaseOutput(testCase.expectedOutput);
  if (!outputValidation.isValid) {
    errors.push(`Expected Output: ${outputValidation.error}`);
  }
  
  if (typeof testCase.isHidden !== 'boolean') {
    errors.push('isHidden must be a boolean value');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate multiple test cases
 */
export function validateTestCases(testCases: TestCase[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(testCases)) {
    return { isValid: false, errors: ['Test cases must be an array'] };
  }
  
  if (testCases.length === 0) {
    return { isValid: false, errors: ['At least one test case is required'] };
  }
  
  if (testCases.length > 100) {
    return { isValid: false, errors: ['Too many test cases (max 100)'] };
  }
  
  // Check for at least one public test case
  const publicTestCases = testCases.filter(tc => !tc.isHidden);
  if (publicTestCases.length === 0) {
    errors.push('At least one public test case is required');
  }
  
  // Validate each test case
  testCases.forEach((testCase, index) => {
    const validation = validateTestCase(testCase);
    if (!validation.isValid) {
      errors.push(`Test case ${index + 1}: ${validation.errors.join(', ')}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a test result from execution
 */
export function createTestResult(
  testCase: TestCase,
  actualOutput: string,
  executionTime: number,
  memoryUsage: number,
  error?: string
): TestResult {
  const passed = !error && compareOutputs(testCase.expectedOutput, actualOutput);
  
  return {
    passed,
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput: actualOutput || '',
    executionTime,
    memoryUsage,
    error
  };
}

/**
 * Calculate submission verdict based on test results
 */
export function calculateSubmissionVerdict(testResults: TestResult[]): {
  verdict: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  details: string;
} {
  if (testResults.length === 0) {
    return {
      verdict: 'Runtime Error',
      details: 'No test results available'
    };
  }

  // Check for compilation errors (indicated by error in all tests)
  const hasCompilationError = testResults.every(result => 
    result.error && result.error.toLowerCase().includes('compilation')
  );
  
  if (hasCompilationError) {
    return {
      verdict: 'Compilation Error',
      details: testResults[0].error || 'Code failed to compile'
    };
  }

  // Check for runtime errors
  const runtimeErrorCount = testResults.filter(result => 
    result.error && !result.error.toLowerCase().includes('time limit')
  ).length;
  
  if (runtimeErrorCount > 0) {
    return {
      verdict: 'Runtime Error',
      details: `${runtimeErrorCount} test(s) failed with runtime errors`
    };
  }

  // Check for time limit exceeded
  const timeoutCount = testResults.filter(result => 
    result.error && result.error.toLowerCase().includes('time limit')
  ).length;
  
  if (timeoutCount > 0) {
    return {
      verdict: 'Time Limit Exceeded',
      details: `${timeoutCount} test(s) exceeded time limit`
    };
  }

  // Check if all tests passed
  const passedCount = testResults.filter(result => result.passed).length;
  const totalCount = testResults.length;
  
  if (passedCount === totalCount) {
    return {
      verdict: 'Accepted',
      details: `All ${totalCount} test cases passed`
    };
  }

  return {
    verdict: 'Wrong Answer',
    details: `${passedCount}/${totalCount} test cases passed`
  };
}

/**
 * Get execution statistics from test results
 */
export function getExecutionStats(testResults: TestResult[]): {
  totalExecutionTime: number;
  averageExecutionTime: number;
  maxExecutionTime: number;
  totalMemoryUsage: number;
  averageMemoryUsage: number;
  maxMemoryUsage: number;
} {
  if (testResults.length === 0) {
    return {
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      totalMemoryUsage: 0,
      averageMemoryUsage: 0,
      maxMemoryUsage: 0
    };
  }

  const executionTimes = testResults.map(r => r.executionTime);
  const memoryUsages = testResults.map(r => r.memoryUsage);

  return {
    totalExecutionTime: executionTimes.reduce((sum, time) => sum + time, 0),
    averageExecutionTime: executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length,
    maxExecutionTime: Math.max(...executionTimes),
    totalMemoryUsage: memoryUsages.reduce((sum, mem) => sum + mem, 0),
    averageMemoryUsage: memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length,
    maxMemoryUsage: Math.max(...memoryUsages)
  };
}

/**
 * Filter test cases based on visibility
 */
export function filterTestCases(testCases: TestCase[], showHidden: boolean = false): {
  publicTestCases: TestCase[];
  hiddenTestCases: TestCase[];
  visibleTestCases: TestCase[];
} {
  const publicTestCases = testCases.filter(tc => !tc.isHidden);
  const hiddenTestCases = testCases.filter(tc => tc.isHidden);
  const visibleTestCases = showHidden ? testCases : publicTestCases;

  return {
    publicTestCases,
    hiddenTestCases,
    visibleTestCases
  };
}

/**
 * Format test case for display
 */
export function formatTestCaseForDisplay(testCase: TestCase, index: number): {
  title: string;
  formattedInput: string;
  formattedOutput: string;
  isHidden: boolean;
} {
  return {
    title: `Test Case ${index + 1}${testCase.isHidden ? ' (Hidden)' : ''}`,
    formattedInput: testCase.input.trim(),
    formattedOutput: testCase.expectedOutput.trim(),
    isHidden: testCase.isHidden
  };
}

/**
 * Create summary statistics for submission history
 */
export function createSubmissionSummary(submissions: SubmissionDocument[]): {
  totalSubmissions: number;
  acceptedSubmissions: number;
  successRate: number;
  languageDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  averageExecutionTime: number;
  averageMemoryUsage: number;
} {
  if (submissions.length === 0) {
    return {
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      successRate: 0,
      languageDistribution: {},
      statusDistribution: {},
      averageExecutionTime: 0,
      averageMemoryUsage: 0
    };
  }

  const acceptedSubmissions = submissions.filter(s => s.status === 'Accepted').length;
  const languageDistribution: Record<string, number> = {};
  const statusDistribution: Record<string, number> = {};
  
  let totalExecutionTime = 0;
  let totalMemoryUsage = 0;
  let validExecutionCount = 0;
  let validMemoryCount = 0;

  submissions.forEach(submission => {
    // Language distribution
    languageDistribution[submission.language] = (languageDistribution[submission.language] || 0) + 1;
    
    // Status distribution
    statusDistribution[submission.status] = (statusDistribution[submission.status] || 0) + 1;
    
    // Execution time statistics
    if (submission.executionTime !== undefined) {
      totalExecutionTime += submission.executionTime;
      validExecutionCount++;
    }
    
    // Memory usage statistics
    if (submission.memoryUsage !== undefined) {
      totalMemoryUsage += submission.memoryUsage;
      validMemoryCount++;
    }
  });

  return {
    totalSubmissions: submissions.length,
    acceptedSubmissions,
    successRate: (acceptedSubmissions / submissions.length) * 100,
    languageDistribution,
    statusDistribution,
    averageExecutionTime: validExecutionCount > 0 ? totalExecutionTime / validExecutionCount : 0,
    averageMemoryUsage: validMemoryCount > 0 ? totalMemoryUsage / validMemoryCount : 0
  };
}
