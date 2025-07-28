// Submission evaluation service
import { TestResult, TestCase, SubmissionDocument } from '@/types';
import { submissionService } from '@/lib/firestore';
import { 
  calculateSubmissionVerdict, 
  getExecutionStats, 
  createTestResult,
  validateTestCases 
} from '@/utils/testCaseManagement';

export interface SubmissionEvaluationRequest {
  uid: string;
  problemId: string;
  code: string;
  language: string;
  testCases: TestCase[];
}

export interface SubmissionEvaluationResult {
  success: boolean;
  submissionId?: string;
  verdict?: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  testResults?: TestResult[];
  executionStats?: {
    totalExecutionTime: number;
    averageExecutionTime: number;
    maxExecutionTime: number;
    totalMemoryUsage: number;
    averageMemoryUsage: number;
    maxMemoryUsage: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface CodeExecutionRequest {
  code: string;
  language: string;
  testCases: TestCase[];
  action: 'run' | 'submit';
}

export interface CodeExecutionResponse {
  success: boolean;
  testResults?: TestResult[];
  executionTime?: number;
  memoryUsage?: number;
  error?: string;
}

/**
 * Main submission evaluation service
 */
export class SubmissionEvaluationService {
  private readonly MAX_EXECUTION_TIME = 5000; // 5 seconds in milliseconds
  private readonly MAX_MEMORY_USAGE = 128 * 1024 * 1024; // 128MB in bytes
  private readonly MAX_OUTPUT_LENGTH = 10000; // 10KB max output per test case

  /**
   * Process a complete submission evaluation
   */
  async evaluateSubmission(request: SubmissionEvaluationRequest): Promise<SubmissionEvaluationResult> {
    try {
      // Validate input
      const validation = this.validateSubmissionRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error || 'Invalid submission request'
          }
        };
      }

      // Execute code against test cases
      const executionResult = await this.executeCode({
        code: request.code,
        language: request.language,
        testCases: request.testCases,
        action: 'submit'
      });

      if (!executionResult.success) {
        return {
          success: false,
          error: {
            code: 'EXECUTION_ERROR',
            message: executionResult.error || 'Code execution failed'
          }
        };
      }

      const testResults = executionResult.testResults || [];
      
      // Calculate verdict and statistics
      const verdictResult = calculateSubmissionVerdict(testResults);
      const executionStats = getExecutionStats(testResults);

      // Create submission document
      const submissionData: Omit<SubmissionDocument, 'id' | 'submittedAt'> = {
        uid: request.uid,
        problemId: request.problemId,
        code: request.code,
        language: request.language,
        status: verdictResult.verdict,
        executionTime: executionStats.averageExecutionTime,
        memoryUsage: executionStats.averageMemoryUsage,
        testResults
      };

      // Save submission to database
      const saveResult = await submissionService.createSubmission(submissionData);
      if (!saveResult.success) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: saveResult.error?.message || 'Failed to save submission'
          }
        };
      }

      return {
        success: true,
        submissionId: saveResult.data,
        verdict: verdictResult.verdict,
        testResults,
        executionStats
      };

    } catch (error) {
      console.error('Submission evaluation error:', error);
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      };
    }
  }

  /**
   * Execute code for testing (without saving to database)
   */
  async runCode(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    try {
      const validation = this.validateCodeRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Invalid code execution request'
        };
      }

      return await this.executeCode(request);
    } catch (error) {
      console.error('Code execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Code execution failed'
      };
    }
  }

  /**
   * Execute code against test cases using the compile API
   */
  private async executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    try {
      // Filter test cases based on action
      const testCasesToRun = request.action === 'run' 
        ? request.testCases.filter(tc => !tc.isHidden) // Only public test cases for run
        : request.testCases; // All test cases for submit

      if (testCasesToRun.length === 0) {
        return {
          success: false,
          error: 'No test cases available for execution'
        };
      }

      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: request.code,
          language: request.language,
          testCases: testCasesToRun,
          action: request.action
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        testResults: result.testResults,
        executionTime: result.executionTime,
        memoryUsage: result.memoryUsage
      };

    } catch (error) {
      console.error('Code execution API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute code'
      };
    }
  }

  /**
   * Validate submission request
   */
  private validateSubmissionRequest(request: SubmissionEvaluationRequest): { isValid: boolean; error?: string } {
    if (!request.uid || typeof request.uid !== 'string') {
      return { isValid: false, error: 'Valid user ID is required' };
    }

    if (!request.problemId || typeof request.problemId !== 'string') {
      return { isValid: false, error: 'Valid problem ID is required' };
    }

    if (!request.code || typeof request.code !== 'string') {
      return { isValid: false, error: 'Code is required' };
    }

    if (request.code.length > 100000) {
      return { isValid: false, error: 'Code is too long (max 100,000 characters)' };
    }

    const supportedLanguages = ['Python', 'JavaScript', 'Java', 'C++', 'C'];
    if (!supportedLanguages.includes(request.language)) {
      return { isValid: false, error: `Unsupported language: ${request.language}` };
    }

    const testCaseValidation = validateTestCases(request.testCases);
    if (!testCaseValidation.isValid) {
      return { isValid: false, error: `Test case validation failed: ${testCaseValidation.errors.join(', ')}` };
    }

    return { isValid: true };
  }

  /**
   * Validate code execution request
   */
  private validateCodeRequest(request: CodeExecutionRequest): { isValid: boolean; error?: string } {
    if (!request.code || typeof request.code !== 'string') {
      return { isValid: false, error: 'Code is required' };
    }

    if (request.code.length > 100000) {
      return { isValid: false, error: 'Code is too long (max 100,000 characters)' };
    }

    const supportedLanguages = ['Python', 'JavaScript', 'Java', 'C++', 'C'];
    if (!supportedLanguages.includes(request.language)) {
      return { isValid: false, error: `Unsupported language: ${request.language}` };
    }

    if (!['run', 'submit'].includes(request.action)) {
      return { isValid: false, error: 'Action must be either "run" or "submit"' };
    }

    const testCaseValidation = validateTestCases(request.testCases);
    if (!testCaseValidation.isValid) {
      return { isValid: false, error: `Test case validation failed: ${testCaseValidation.errors.join(', ')}` };
    }

    return { isValid: true };
  }

  /**
   * Check if execution time exceeds limit
   */
  private isTimeoutError(testResults: TestResult[]): boolean {
    return testResults.some(result => 
      result.executionTime > this.MAX_EXECUTION_TIME ||
      (result.error && result.error.toLowerCase().includes('time limit'))
    );
  }

  /**
   * Check if memory usage exceeds limit
   */
  private isMemoryError(testResults: TestResult[]): boolean {
    return testResults.some(result => 
      result.memoryUsage > this.MAX_MEMORY_USAGE ||
      (result.error && result.error.toLowerCase().includes('memory'))
    );
  }

  /**
   * Process test results to apply time and memory limits
   */
  private processTestResults(testResults: TestResult[]): TestResult[] {
    return testResults.map(result => {
      // Check for timeout
      if (result.executionTime > this.MAX_EXECUTION_TIME) {
        return {
          ...result,
          passed: false,
          error: `Time Limit Exceeded (${result.executionTime}ms > ${this.MAX_EXECUTION_TIME}ms)`
        };
      }

      // Check for memory limit
      if (result.memoryUsage > this.MAX_MEMORY_USAGE) {
        return {
          ...result,
          passed: false,
          error: `Memory Limit Exceeded (${result.memoryUsage} bytes > ${this.MAX_MEMORY_USAGE} bytes)`
        };
      }

      // Check for output length limit
      if (result.actualOutput.length > this.MAX_OUTPUT_LENGTH) {
        return {
          ...result,
          passed: false,
          actualOutput: result.actualOutput.substring(0, this.MAX_OUTPUT_LENGTH) + '... (truncated)',
          error: 'Output Limit Exceeded'
        };
      }

      return result;
    });
  }
}

// Export singleton instance
export const submissionEvaluationService = new SubmissionEvaluationService();
