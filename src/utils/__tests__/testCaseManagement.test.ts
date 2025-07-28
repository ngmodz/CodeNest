// Test suite for test case management utilities
import {
  compareOutputs,
  validateTestCase,
  validateTestCases,
  createTestResult,
  calculateSubmissionVerdict,
  getExecutionStats,
  filterTestCases,
  formatTestCaseForDisplay,
  createSubmissionSummary,
  validateTestCaseInput,
  validateTestCaseOutput
} from '../testCaseManagement';
import { TestCase, TestResult, SubmissionDocument } from '@/types';
import { Timestamp } from 'firebase/firestore';

describe('Test Case Management Utilities', () => {
  
  describe('compareOutputs', () => {
    it('should return true for identical outputs', () => {
      expect(compareOutputs('hello', 'hello')).toBe(true);
    });

    it('should handle whitespace normalization', () => {
      expect(compareOutputs('hello world', 'hello world ')).toBe(true);
      expect(compareOutputs('hello\nworld', 'hello\nworld\n')).toBe(true);
      expect(compareOutputs('hello\r\nworld', 'hello\nworld')).toBe(true);
    });

    it('should work in strict mode', () => {
      expect(compareOutputs('hello', 'hello ', true)).toBe(false);
      expect(compareOutputs('hello', 'hello', true)).toBe(true);
    });

    it('should handle multiline outputs', () => {
      const expected = 'line1\nline2\nline3';
      const actual = 'line1  \nline2\nline3\n\n';
      expect(compareOutputs(expected, actual)).toBe(true);
    });
  });

  describe('validateTestCaseInput', () => {
    it('should validate correct input', () => {
      const result = validateTestCaseInput('valid input');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-string input', () => {
      const result = validateTestCaseInput(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input must be a string');
    });

    it('should reject too long input', () => {
      const longInput = 'a'.repeat(10001);
      const result = validateTestCaseInput(longInput);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input is too long (max 10,000 characters)');
    });
  });

  describe('validateTestCaseOutput', () => {
    it('should validate correct output', () => {
      const result = validateTestCaseOutput('valid output');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-string output', () => {
      const result = validateTestCaseOutput(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Output must be a string');
    });
  });

  describe('validateTestCase', () => {
    const validTestCase: TestCase = {
      input: '5',
      expectedOutput: '25',
      isHidden: false
    };

    it('should validate correct test case', () => {
      const result = validateTestCase(validTestCase);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid input', () => {
      const invalidTestCase = { ...validTestCase, input: 123 as any };
      const result = validateTestCase(invalidTestCase);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input: Input must be a string');
    });

    it('should reject invalid isHidden value', () => {
      const invalidTestCase = { ...validTestCase, isHidden: 'yes' as any };
      const result = validateTestCase(invalidTestCase);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('isHidden must be a boolean value');
    });
  });

  describe('validateTestCases', () => {
    const validTestCases: TestCase[] = [
      { input: '1', expectedOutput: '1', isHidden: false },
      { input: '2', expectedOutput: '4', isHidden: true }
    ];

    it('should validate correct test cases', () => {
      const result = validateTestCases(validTestCases);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty array', () => {
      const result = validateTestCases([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one test case is required');
    });

    it('should reject non-array input', () => {
      const result = validateTestCases('not an array' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test cases must be an array');
    });

    it('should require at least one public test case', () => {
      const hiddenOnly = [{ input: '1', expectedOutput: '1', isHidden: true }];
      const result = validateTestCases(hiddenOnly);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one public test case is required');
    });
  });

  describe('createTestResult', () => {
    const testCase: TestCase = {
      input: '5',
      expectedOutput: '25',
      isHidden: false
    };

    it('should create passing test result', () => {
      const result = createTestResult(testCase, '25', 100, 1024);
      expect(result.passed).toBe(true);
      expect(result.input).toBe('5');
      expect(result.expectedOutput).toBe('25');
      expect(result.actualOutput).toBe('25');
      expect(result.executionTime).toBe(100);
      expect(result.memoryUsage).toBe(1024);
      expect(result.error).toBeUndefined();
    });

    it('should create failing test result', () => {
      const result = createTestResult(testCase, '24', 100, 1024);
      expect(result.passed).toBe(false);
      expect(result.actualOutput).toBe('24');
    });

    it('should handle error cases', () => {
      const result = createTestResult(testCase, '', 100, 1024, 'Runtime error');
      expect(result.passed).toBe(false);
      expect(result.error).toBe('Runtime error');
    });
  });

  describe('calculateSubmissionVerdict', () => {
    it('should return Accepted for all passing tests', () => {
      const testResults: TestResult[] = [
        { passed: true, input: '1', expectedOutput: '1', actualOutput: '1', executionTime: 100, memoryUsage: 1024 },
        { passed: true, input: '2', expectedOutput: '4', actualOutput: '4', executionTime: 150, memoryUsage: 2048 }
      ];
      
      const verdict = calculateSubmissionVerdict(testResults);
      expect(verdict.verdict).toBe('Accepted');
      expect(verdict.details).toBe('All 2 test cases passed');
    });

    it('should return Wrong Answer for failing tests', () => {
      const testResults: TestResult[] = [
        { passed: true, input: '1', expectedOutput: '1', actualOutput: '1', executionTime: 100, memoryUsage: 1024 },
        { passed: false, input: '2', expectedOutput: '4', actualOutput: '5', executionTime: 150, memoryUsage: 2048 }
      ];
      
      const verdict = calculateSubmissionVerdict(testResults);
      expect(verdict.verdict).toBe('Wrong Answer');
      expect(verdict.details).toBe('1/2 test cases passed');
    });

    it('should return Compilation Error for compilation issues', () => {
      const testResults: TestResult[] = [
        { passed: false, input: '1', expectedOutput: '1', actualOutput: '', executionTime: 0, memoryUsage: 0, error: 'compilation error: syntax error' }
      ];
      
      const verdict = calculateSubmissionVerdict(testResults);
      expect(verdict.verdict).toBe('Compilation Error');
    });

    it('should return Time Limit Exceeded for timeout errors', () => {
      const testResults: TestResult[] = [
        { passed: false, input: '1', expectedOutput: '1', actualOutput: '', executionTime: 5000, memoryUsage: 1024, error: 'time limit exceeded' }
      ];
      
      const verdict = calculateSubmissionVerdict(testResults);
      expect(verdict.verdict).toBe('Time Limit Exceeded');
    });

    it('should return Runtime Error for runtime issues', () => {
      const testResults: TestResult[] = [
        { passed: false, input: '1', expectedOutput: '1', actualOutput: '', executionTime: 100, memoryUsage: 1024, error: 'IndexError: list index out of range' }
      ];
      
      const verdict = calculateSubmissionVerdict(testResults);
      expect(verdict.verdict).toBe('Runtime Error');
    });
  });

  describe('getExecutionStats', () => {
    it('should calculate correct statistics', () => {
      const testResults: TestResult[] = [
        { passed: true, input: '1', expectedOutput: '1', actualOutput: '1', executionTime: 100, memoryUsage: 1024 },
        { passed: true, input: '2', expectedOutput: '4', actualOutput: '4', executionTime: 200, memoryUsage: 2048 },
        { passed: true, input: '3', expectedOutput: '9', actualOutput: '9', executionTime: 150, memoryUsage: 1536 }
      ];
      
      const stats = getExecutionStats(testResults);
      expect(stats.totalExecutionTime).toBe(450);
      expect(stats.averageExecutionTime).toBe(150);
      expect(stats.maxExecutionTime).toBe(200);
      expect(stats.totalMemoryUsage).toBe(4608);
      expect(stats.averageMemoryUsage).toBe(1536);
      expect(stats.maxMemoryUsage).toBe(2048);
    });

    it('should handle empty results', () => {
      const stats = getExecutionStats([]);
      expect(stats.totalExecutionTime).toBe(0);
      expect(stats.averageExecutionTime).toBe(0);
      expect(stats.maxExecutionTime).toBe(0);
    });
  });

  describe('filterTestCases', () => {
    const testCases: TestCase[] = [
      { input: '1', expectedOutput: '1', isHidden: false },
      { input: '2', expectedOutput: '4', isHidden: true },
      { input: '3', expectedOutput: '9', isHidden: false }
    ];

    it('should filter test cases correctly', () => {
      const result = filterTestCases(testCases, false);
      expect(result.publicTestCases).toHaveLength(2);
      expect(result.hiddenTestCases).toHaveLength(1);
      expect(result.visibleTestCases).toHaveLength(2);
    });

    it('should show all test cases when showHidden is true', () => {
      const result = filterTestCases(testCases, true);
      expect(result.visibleTestCases).toHaveLength(3);
    });
  });

  describe('formatTestCaseForDisplay', () => {
    it('should format test case correctly', () => {
      const testCase: TestCase = {
        input: '  5  ',
        expectedOutput: '  25  ',
        isHidden: false
      };
      
      const formatted = formatTestCaseForDisplay(testCase, 0);
      expect(formatted.title).toBe('Test Case 1');
      expect(formatted.formattedInput).toBe('5');
      expect(formatted.formattedOutput).toBe('25');
      expect(formatted.isHidden).toBe(false);
    });

    it('should mark hidden test cases', () => {
      const testCase: TestCase = {
        input: '5',
        expectedOutput: '25',
        isHidden: true
      };
      
      const formatted = formatTestCaseForDisplay(testCase, 1);
      expect(formatted.title).toBe('Test Case 2 (Hidden)');
      expect(formatted.isHidden).toBe(true);
    });
  });

  describe('createSubmissionSummary', () => {
    const mockTimestamp = { toDate: () => new Date() } as Timestamp;
    const mockSubmissions: SubmissionDocument[] = [
      {
        id: '1',
        uid: 'user1',
        problemId: 'prob1',
        code: 'print("hello")',
        language: 'Python',
        status: 'Accepted',
        executionTime: 100,
        memoryUsage: 1024,
        testResults: [],
        submittedAt: mockTimestamp
      },
      {
        id: '2',
        uid: 'user1',
        problemId: 'prob1',
        code: 'console.log("hello")',
        language: 'JavaScript',
        status: 'Wrong Answer',
        executionTime: 150,
        memoryUsage: 2048,
        testResults: [],
        submittedAt: mockTimestamp
      }
    ];

    it('should create correct summary', () => {
      const summary = createSubmissionSummary(mockSubmissions);
      expect(summary.totalSubmissions).toBe(2);
      expect(summary.acceptedSubmissions).toBe(1);
      expect(summary.successRate).toBe(50);
      expect(summary.languageDistribution).toEqual({ Python: 1, JavaScript: 1 });
      expect(summary.statusDistribution).toEqual({ Accepted: 1, 'Wrong Answer': 1 });
      expect(summary.averageExecutionTime).toBe(125);
      expect(summary.averageMemoryUsage).toBe(1536);
    });

    it('should handle empty submissions', () => {
      const summary = createSubmissionSummary([]);
      expect(summary.totalSubmissions).toBe(0);
      expect(summary.successRate).toBe(0);
    });
  });
});
