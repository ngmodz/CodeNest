import { describe, it, expect } from '@jest/globals';
import { 
  validateSubmissionData, 
  validateCompleteSubmission, 
  sanitizeSubmissionData,
  calculateSubmissionScore,
  getSubmissionSummary
} from '../submissionValidation';
import { SubmissionDocument, TestResult } from '@/types';

describe('Submission Validation', () => {
  const validSubmission: Omit<SubmissionDocument, 'id' | 'submittedAt'> = {
    uid: 'test-user-123',
    problemId: 'problem-123',
    code: 'def two_sum(nums, target):\n    return [0, 1]',
    language: 'Python',
    status: 'Accepted',
    executionTime: 45,
    memoryUsage: 14.2,
    testResults: [
      {
        passed: true,
        input: '[2,7,11,15], 9',
        expectedOutput: '[0,1]',
        actualOutput: '[0,1]',
        executionTime: 45,
        memoryUsage: 14.2
      }
    ]
  };

  describe('validateSubmissionData', () => {
    it('should validate correct submission data', () => {
      const result = validateSubmissionData(validSubmission);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty uid', () => {
      const result = validateSubmissionData({ uid: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'uid',
        message: 'User ID cannot be empty'
      });
    });

    it('should reject empty problemId', () => {
      const result = validateSubmissionData({ problemId: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'problemId',
        message: 'Problem ID cannot be empty'
      });
    });

    it('should reject empty code', () => {
      const result = validateSubmissionData({ code: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'code',
        message: 'Code cannot be empty'
      });
    });

    it('should reject code that is too long', () => {
      const longCode = 'a'.repeat(50001);
      const result = validateSubmissionData({ code: longCode });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'code',
        message: 'Code must be less than 50,000 characters'
      });
    });

    it('should reject invalid language', () => {
      const result = validateSubmissionData({ language: 'InvalidLanguage' as any });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'language',
        message: 'Invalid programming language'
      });
    });

    it('should reject invalid status', () => {
      const result = validateSubmissionData({ status: 'InvalidStatus' as any });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'status',
        message: 'Invalid submission status'
      });
    });

    it('should reject negative execution time', () => {
      const result = validateSubmissionData({ executionTime: -1 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'executionTime',
        message: 'Execution time must be a non-negative number'
      });
    });

    it('should reject negative memory usage', () => {
      const result = validateSubmissionData({ memoryUsage: -1 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'memoryUsage',
        message: 'Memory usage must be a non-negative number'
      });
    });

    it('should validate test results', () => {
      const invalidTestResult = {
        passed: 'not-boolean' as any,
        input: '',
        expectedOutput: 'valid',
        actualOutput: 'valid',
        executionTime: -1,
        memoryUsage: 10
      };

      const result = validateSubmissionData({ testResults: [invalidTestResult] });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field.includes('testResults[0]'))).toBe(true);
    });
  });

  describe('validateCompleteSubmission', () => {
    it('should validate complete submission', () => {
      const result = validateCompleteSubmission(validSubmission);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject incomplete submission', () => {
      const incompleteSubmission = {
        uid: 'test-user',
        code: 'print("hello")'
        // Missing required fields
      };
      
      const result = validateCompleteSubmission(incompleteSubmission as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeSubmissionData', () => {
    it('should sanitize submission data', () => {
      const dirtyData = {
        uid: '  test-user-123  ',
        problemId: '  problem-123  ',
        code: 'def hello():\n    print("world")',
        language: 'Python' as const,
        status: 'Accepted' as const,
        executionTime: 45.7,
        memoryUsage: 14.2
      };

      const result = sanitizeSubmissionData(dirtyData);
      
      expect(result.uid).toBe('test-user-123');
      expect(result.problemId).toBe('problem-123');
      expect(result.code).toBe('def hello():\n    print("world")'); // Code should not be trimmed
      expect(result.executionTime).toBe(45.7);
      expect(result.memoryUsage).toBe(14.2);
    });

    it('should sanitize test results', () => {
      const dirtyTestResults = [
        {
          passed: true,
          input: 'test input',
          expectedOutput: 'expected',
          actualOutput: 'actual',
          executionTime: '45' as any, // String instead of number
          memoryUsage: '14.2' as any, // String instead of number
          error: 'some error'
        }
      ];

      const result = sanitizeSubmissionData({ testResults: dirtyTestResults });
      
      expect(result.testResults?.[0].executionTime).toBe(45);
      expect(result.testResults?.[0].memoryUsage).toBe(14.2);
      expect(result.testResults?.[0].error).toBe('some error');
    });
  });

  describe('calculateSubmissionScore', () => {
    it('should calculate score correctly', () => {
      const testResults: TestResult[] = [
        { passed: true, input: '1', expectedOutput: '1', actualOutput: '1', executionTime: 10, memoryUsage: 5 },
        { passed: true, input: '2', expectedOutput: '2', actualOutput: '2', executionTime: 10, memoryUsage: 5 },
        { passed: false, input: '3', expectedOutput: '3', actualOutput: '4', executionTime: 10, memoryUsage: 5 },
        { passed: true, input: '4', expectedOutput: '4', actualOutput: '4', executionTime: 10, memoryUsage: 5 }
      ];

      const score = calculateSubmissionScore(testResults);
      expect(score).toBe(75); // 3 out of 4 passed = 75%
    });

    it('should return 0 for empty test results', () => {
      const score = calculateSubmissionScore([]);
      expect(score).toBe(0);
    });

    it('should return 100 for all passed tests', () => {
      const testResults: TestResult[] = [
        { passed: true, input: '1', expectedOutput: '1', actualOutput: '1', executionTime: 10, memoryUsage: 5 },
        { passed: true, input: '2', expectedOutput: '2', actualOutput: '2', executionTime: 10, memoryUsage: 5 }
      ];

      const score = calculateSubmissionScore(testResults);
      expect(score).toBe(100);
    });
  });

  describe('getSubmissionSummary', () => {
    it('should generate correct submission summary', () => {
      const submission: SubmissionDocument = {
        ...validSubmission,
        id: 'test-submission',
        submittedAt: new Date() as any,
        testResults: [
          { passed: true, input: '1', expectedOutput: '1', actualOutput: '1', executionTime: 10, memoryUsage: 5 },
          { passed: false, input: '2', expectedOutput: '2', actualOutput: '3', executionTime: 20, memoryUsage: 10 },
          { passed: true, input: '3', expectedOutput: '3', actualOutput: '3', executionTime: 15, memoryUsage: 7.5 }
        ]
      };

      const summary = getSubmissionSummary(submission);
      
      expect(summary.totalTests).toBe(3);
      expect(summary.passedTests).toBe(2);
      expect(summary.score).toBe(67); // 2 out of 3 = 66.67% rounded to 67%
      expect(summary.averageExecutionTime).toBe(15); // (10 + 20 + 15) / 3 = 15
      expect(summary.averageMemoryUsage).toBe(7.5); // (5 + 10 + 7.5) / 3 = 7.5
    });

    it('should handle empty test results', () => {
      const submission: SubmissionDocument = {
        ...validSubmission,
        id: 'test-submission',
        submittedAt: new Date() as any,
        testResults: []
      };

      const summary = getSubmissionSummary(submission);
      
      expect(summary.totalTests).toBe(0);
      expect(summary.passedTests).toBe(0);
      expect(summary.score).toBe(0);
      expect(summary.averageExecutionTime).toBe(0);
      expect(summary.averageMemoryUsage).toBe(0);
    });
  });
});