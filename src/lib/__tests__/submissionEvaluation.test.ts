// Test suite for submission evaluation service
import { SubmissionEvaluationService } from '../submissionEvaluation';
import { TestCase, TestResult } from '@/types';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the firestore service
jest.mock('../firestore', () => ({
  submissionService: {
    createSubmission: jest.fn()
  }
}));

describe('SubmissionEvaluationService', () => {
  let service: SubmissionEvaluationService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    service = new SubmissionEvaluationService();
    mockFetch.mockClear();
  });

  const sampleTestCases: TestCase[] = [
    { input: '5', expectedOutput: '25', isHidden: false },
    { input: '3', expectedOutput: '9', isHidden: false },
    { input: '7', expectedOutput: '49', isHidden: true }
  ];

  const sampleTestResults: TestResult[] = [
    {
      passed: true,
      input: '5',
      expectedOutput: '25',
      actualOutput: '25',
      executionTime: 100,
      memoryUsage: 1024
    },
    {
      passed: true,
      input: '3',
      expectedOutput: '9',
      actualOutput: '9',
      executionTime: 120,
      memoryUsage: 1536
    },
    {
      passed: true,
      input: '7',
      expectedOutput: '49',
      actualOutput: '49',
      executionTime: 110,
      memoryUsage: 1280
    }
  ];

  describe('runCode', () => {
    it('should execute code successfully for run action', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          testResults: sampleTestResults.slice(0, 2), // Only public tests
          executionTime: 110,
          memoryUsage: 1280
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.runCode({
        code: 'def square(x): return x * x',
        language: 'Python',
        testCases: sampleTestCases,
        action: 'run'
      });

      expect(result.success).toBe(true);
      expect(result.testResults).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'def square(x): return x * x',
          language: 'Python',
          testCases: sampleTestCases.filter(tc => !tc.isHidden),
          action: 'run'
        })
      });
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.runCode({
        code: 'invalid code',
        language: 'Python',
        testCases: sampleTestCases,
        action: 'run'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });

    it('should validate code request', async () => {
      const result = await service.runCode({
        code: '',
        language: 'Python',
        testCases: sampleTestCases,
        action: 'run'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Code is required');
    });

    it('should reject unsupported languages', async () => {
      const result = await service.runCode({
        code: 'console.log("hello")',
        language: 'Ruby',
        testCases: sampleTestCases,
        action: 'run'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported language: Ruby');
    });

    it('should reject invalid actions', async () => {
      const result = await service.runCode({
        code: 'console.log("hello")',
        language: 'JavaScript',
        testCases: sampleTestCases,
        action: 'invalid' as any
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Action must be either "run" or "submit"');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await service.runCode({
        code: 'console.log("hello")',
        language: 'JavaScript',
        testCases: sampleTestCases,
        action: 'run'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle empty test cases', async () => {
      const result = await service.runCode({
        code: 'console.log("hello")',
        language: 'JavaScript',
        testCases: [],
        action: 'run'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one test case is required');
    });
  });

  describe('evaluateSubmission', () => {
    beforeEach(() => {
      const { submissionService } = require('../firestore');
      submissionService.createSubmission.mockResolvedValue({
        success: true,
        data: 'submission-123'
      });
    });

    it('should evaluate submission successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          testResults: sampleTestResults,
          executionTime: 110,
          memoryUsage: 1280
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.evaluateSubmission({
        uid: 'user-123',
        problemId: 'problem-456',
        code: 'def square(x): return x * x',
        language: 'Python',
        testCases: sampleTestCases
      });

      expect(result.success).toBe(true);
      expect(result.submissionId).toBe('submission-123');
      expect(result.verdict).toBe('Accepted');
      expect(result.testResults).toHaveLength(3);
      expect(result.executionStats).toBeDefined();
    });

    it('should validate submission request', async () => {
      const result = await service.evaluateSubmission({
        uid: '',
        problemId: 'problem-456',
        code: 'def square(x): return x * x',
        language: 'Python',
        testCases: sampleTestCases
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Valid user ID is required');
    });

    it('should handle database save errors', async () => {
      const { submissionService } = require('../firestore');
      submissionService.createSubmission.mockResolvedValue({
        success: false,
        error: { message: 'Database error' }
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          testResults: sampleTestResults,
          executionTime: 110,
          memoryUsage: 1280
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.evaluateSubmission({
        uid: 'user-123',
        problemId: 'problem-456',
        code: 'def square(x): return x * x',
        language: 'Python',
        testCases: sampleTestCases
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DATABASE_ERROR');
    });

    it('should handle wrong answer verdict', async () => {
      const failingResults = [
        { ...sampleTestResults[0], passed: false, actualOutput: '24' },
        sampleTestResults[1],
        sampleTestResults[2]
      ];

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          testResults: failingResults,
          executionTime: 110,
          memoryUsage: 1280
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.evaluateSubmission({
        uid: 'user-123',
        problemId: 'problem-456',
        code: 'def square(x): return x * x',
        language: 'Python',
        testCases: sampleTestCases
      });

      expect(result.success).toBe(true);
      expect(result.verdict).toBe('Wrong Answer');
    });

    it('should handle compilation errors', async () => {
      const compilationErrorResults = sampleTestResults.map(result => ({
        ...result,
        passed: false,
        error: 'compilation error: syntax error'
      }));

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          testResults: compilationErrorResults,
          executionTime: 0,
          memoryUsage: 0
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.evaluateSubmission({
        uid: 'user-123',
        problemId: 'problem-456',
        code: 'invalid syntax',
        language: 'Python',
        testCases: sampleTestCases
      });

      expect(result.success).toBe(true);
      expect(result.verdict).toBe('Compilation Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutResults = sampleTestResults.map(result => ({
        ...result,
        passed: false,
        error: 'time limit exceeded'
      }));

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          testResults: timeoutResults,
          executionTime: 5000,
          memoryUsage: 1280
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.evaluateSubmission({
        uid: 'user-123',
        problemId: 'problem-456',
        code: 'while True: pass',
        language: 'Python',
        testCases: sampleTestCases
      });

      expect(result.success).toBe(true);
      expect(result.verdict).toBe('Time Limit Exceeded');
    });

    it('should handle runtime errors', async () => {
      const runtimeErrorResults = sampleTestResults.map(result => ({
        ...result,
        passed: false,
        error: 'IndexError: list index out of range'
      }));

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          testResults: runtimeErrorResults,
          executionTime: 100,
          memoryUsage: 1280
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.evaluateSubmission({
        uid: 'user-123',
        problemId: 'problem-456',
        code: 'arr = []; print(arr[0])',
        language: 'Python',
        testCases: sampleTestCases
      });

      expect(result.success).toBe(true);
      expect(result.verdict).toBe('Runtime Error');
    });

    it('should reject code that is too long', async () => {
      const longCode = 'a'.repeat(100001);
      
      const result = await service.evaluateSubmission({
        uid: 'user-123',
        problemId: 'problem-456',
        code: longCode,
        language: 'Python',
        testCases: sampleTestCases
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Code is too long');
    });

    it('should handle empty problem ID', async () => {
      const result = await service.evaluateSubmission({
        uid: 'user-123',
        problemId: '',
        code: 'def square(x): return x * x',
        language: 'Python',
        testCases: sampleTestCases
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Valid problem ID is required');
    });
  });

  describe('edge cases', () => {
    it('should handle invalid test cases', async () => {
      const invalidTestCases = [
        { input: 123, expectedOutput: '25', isHidden: false } as any
      ];

      const result = await service.runCode({
        code: 'def square(x): return x * x',
        language: 'Python',
        testCases: invalidTestCases,
        action: 'run'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Test case validation failed');
    });

    it('should handle unexpected errors', async () => {
      // Mock an unexpected error in the execution path
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Force an error by making fetch throw an unexpected error
      mockFetch.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await service.runCode({
        code: 'def square(x): return x * x',
        language: 'Python',
        testCases: sampleTestCases,
        action: 'run'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');

      console.error = originalConsoleError;
    });
  });
});
