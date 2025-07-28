import { describe, it, expect } from '@jest/globals';
import {
  ValidationUtils,
  UserProfileValidationSchema,
  QuestionValidationSchema,
  SubmissionValidationSchema,
  userProfileSchema,
  questionSchema,
  submissionSchema
} from '../validationSchemas';
import { UserProfile, QuestionDocument, SubmissionDocument } from '@/types';

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(ValidationUtils.isValidEmail('user123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@')).toBe(false);
      expect(ValidationUtils.isValidEmail('@domain.com')).toBe(false);
      expect(ValidationUtils.isValidEmail('test..test@domain.com')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(ValidationUtils.isValidUrl('https://example.com')).toBe(true);
      expect(ValidationUtils.isValidUrl('http://localhost:3000')).toBe(true);
      expect(ValidationUtils.isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(ValidationUtils.isValidUrl('not-a-url')).toBe(false);
      expect(ValidationUtils.isValidUrl('http://')).toBe(false);
      expect(ValidationUtils.isValidUrl('')).toBe(false);
    });
  });

  describe('isValidISODate', () => {
    it('should validate correct ISO date strings', () => {
      expect(ValidationUtils.isValidISODate('2023-12-25T10:30:00.000Z')).toBe(true);
      expect(ValidationUtils.isValidISODate('2023-01-01T00:00:00Z')).toBe(true);
    });

    it('should reject invalid ISO date strings', () => {
      expect(ValidationUtils.isValidISODate('2023-12-25')).toBe(false);
      expect(ValidationUtils.isValidISODate('invalid-date')).toBe(false);
      expect(ValidationUtils.isValidISODate('2023-13-01T00:00:00Z')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize strings correctly', () => {
      expect(ValidationUtils.sanitizeString('  hello  ')).toBe('hello');
      expect(ValidationUtils.sanitizeString('test', { maxLength: 3 })).toBe(null);
      expect(ValidationUtils.sanitizeString('ab', { minLength: 3 })).toBe(null);
      expect(ValidationUtils.sanitizeString('', { allowEmpty: true })).toBe('');
      expect(ValidationUtils.sanitizeString('', { allowEmpty: false })).toBe(null);
    });

    it('should handle non-string inputs', () => {
      expect(ValidationUtils.sanitizeString(123)).toBe(null);
      expect(ValidationUtils.sanitizeString(null)).toBe(null);
      expect(ValidationUtils.sanitizeString(undefined)).toBe(null);
    });
  });

  describe('sanitizeNumber', () => {
    it('should sanitize numbers correctly', () => {
      expect(ValidationUtils.sanitizeNumber('123')).toBe(123);
      expect(ValidationUtils.sanitizeNumber(45.67)).toBe(45.67);
      expect(ValidationUtils.sanitizeNumber(10, { min: 5, max: 15 })).toBe(10);
      expect(ValidationUtils.sanitizeNumber(3, { min: 5 })).toBe(null);
      expect(ValidationUtils.sanitizeNumber(20, { max: 15 })).toBe(null);
      expect(ValidationUtils.sanitizeNumber(3.14, { integer: true })).toBe(null);
      expect(ValidationUtils.sanitizeNumber(5, { integer: true })).toBe(5);
    });

    it('should handle invalid number inputs', () => {
      expect(ValidationUtils.sanitizeNumber('not-a-number')).toBe(null);
      expect(ValidationUtils.sanitizeNumber(null)).toBe(null);
      expect(ValidationUtils.sanitizeNumber(undefined)).toBe(null);
    });
  });
});

describe('UserProfileValidationSchema', () => {
  const schema = new UserProfileValidationSchema();

  describe('validate', () => {
    it('should validate correct profile data', () => {
      const validProfile: Partial<UserProfile> = {
        level: 'Intermediate',
        preferredLanguage: 'Python',
        theme: 'dark',
        streak: 5,
        totalXP: 1000,
        lastActiveDate: '2023-12-25T10:30:00.000Z',
        solvedProblems: ['problem1', 'problem2']
      };

      const result = schema.validate(validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid skill level', () => {
      const invalidProfile: Partial<UserProfile> = {
        level: 'Expert' as any
      };

      const result = schema.validate(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'level',
          message: expect.stringContaining('Skill level must be one of')
        })
      );
    });

    it('should reject invalid programming language', () => {
      const invalidProfile: Partial<UserProfile> = {
        preferredLanguage: 'Ruby' as any
      };

      const result = schema.validate(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'preferredLanguage',
          message: expect.stringContaining('Preferred language must be one of')
        })
      );
    });

    it('should reject negative streak', () => {
      const invalidProfile: Partial<UserProfile> = {
        streak: -1
      };

      const result = schema.validate(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'streak',
          message: 'Streak must be a non-negative integer'
        })
      );
    });

    it('should reject invalid date format', () => {
      const invalidProfile: Partial<UserProfile> = {
        lastActiveDate: '2023-12-25'
      };

      const result = schema.validate(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'lastActiveDate',
          message: 'Last active date must be a valid ISO date string'
        })
      );
    });

    it('should reject invalid solved problems array', () => {
      const invalidProfile: Partial<UserProfile> = {
        solvedProblems: ['valid-id', '', 'another-valid-id']
      };

      const result = schema.validate(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'solvedProblems',
          message: 'All problem IDs must be non-empty strings'
        })
      );
    });
  });

  describe('validateComplete', () => {
    it('should validate complete profile', () => {
      const completeProfile: Omit<UserProfile, 'uid'> = {
        level: 'Beginner',
        preferredLanguage: 'JavaScript',
        theme: 'light',
        streak: 0,
        totalXP: 0,
        lastActiveDate: '2023-12-25T10:30:00.000Z',
        solvedProblems: []
      };

      const result = schema.validateComplete(completeProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject incomplete profile', () => {
      const incompleteProfile = {
        level: 'Beginner',
        preferredLanguage: 'JavaScript'
        // Missing required fields
      };

      const result = schema.validateComplete(incompleteProfile as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitize', () => {
    it('should sanitize valid profile data', () => {
      const dirtyProfile: Partial<UserProfile> = {
        level: 'Intermediate',
        preferredLanguage: 'Python',
        theme: 'dark',
        streak: 5.7, // Should be rounded down
        totalXP: 1000.9, // Should be rounded down
        lastActiveDate: '2023-12-25T10:30:00.000Z',
        solvedProblems: ['problem1', '', 'problem2', '   '] // Should filter empty strings
      };

      const sanitized = schema.sanitize(dirtyProfile);
      expect(sanitized.streak).toBe(5);
      expect(sanitized.totalXP).toBe(1000);
      expect(sanitized.solvedProblems).toEqual(['problem1', 'problem2']);
    });

    it('should filter out invalid data', () => {
      const invalidProfile: Partial<UserProfile> = {
        level: 'Expert' as any, // Invalid level
        preferredLanguage: 'Ruby' as any, // Invalid language
        streak: -1, // Invalid streak
        solvedProblems: [123, '', 'valid-id'] as any // Mixed types
      };

      const sanitized = schema.sanitize(invalidProfile);
      expect(sanitized.level).toBeUndefined();
      expect(sanitized.preferredLanguage).toBeUndefined();
      expect(sanitized.streak).toBeUndefined();
      expect(sanitized.solvedProblems).toEqual(['valid-id']);
    });
  });
});

describe('QuestionValidationSchema', () => {
  const schema = new QuestionValidationSchema();

  describe('validate', () => {
    it('should validate correct question data', () => {
      const validQuestion: Partial<QuestionDocument> = {
        title: 'Two Sum Problem',
        description: 'Given an array of integers and a target sum, return indices of two numbers that add up to the target.',
        difficulty: 'Basic',
        topic: 'Arrays',
        examples: [
          {
            input: '[2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: '2 + 7 = 9'
          }
        ],
        constraints: ['1 <= nums.length <= 10^4'],
        testCases: [
          {
            input: '[2,7,11,15]\n9',
            expectedOutput: '[0,1]',
            isHidden: false
          }
        ],
        isAI: false,
        tags: ['array', 'hash-table']
      };

      const result = schema.validate(validQuestion);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short title', () => {
      const invalidQuestion: Partial<QuestionDocument> = {
        title: 'AB' // Too short
      };

      const result = schema.validate(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'title',
          message: 'Title must be between 3 and 200 characters'
        })
      );
    });

    it('should reject invalid difficulty', () => {
      const invalidQuestion: Partial<QuestionDocument> = {
        difficulty: 'Expert' as any
      };

      const result = schema.validate(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'difficulty',
          message: expect.stringContaining('Difficulty must be one of')
        })
      );
    });

    it('should reject empty examples array', () => {
      const invalidQuestion: Partial<QuestionDocument> = {
        examples: []
      };

      const result = schema.validate(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'examples',
          message: 'At least one example is required'
        })
      );
    });

    it('should validate example structure', () => {
      const invalidQuestion: Partial<QuestionDocument> = {
        examples: [
          {
            input: '', // Empty input
            output: 'valid output'
          }
        ]
      };

      const result = schema.validate(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'examples[0].input',
          message: 'Example input is required'
        })
      );
    });

    it('should validate test case structure', () => {
      const invalidQuestion: Partial<QuestionDocument> = {
        testCases: [
          {
            input: 'valid input',
            expectedOutput: 'valid output',
            isHidden: 'true' as any // Should be boolean
          }
        ]
      };

      const result = schema.validate(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'testCases[0].isHidden',
          message: 'Test case isHidden must be a boolean'
        })
      );
    });
  });

  describe('sanitize', () => {
    it('should sanitize question data correctly', () => {
      const dirtyQuestion: Partial<QuestionDocument> = {
        title: '  Two Sum Problem  ',
        description: '  Given an array...  ',
        topic: '  Arrays  ',
        tags: ['  array  ', '', '  HASH-TABLE  ', '   ']
      };

      const sanitized = schema.sanitize(dirtyQuestion);
      expect(sanitized.title).toBe('Two Sum Problem');
      expect(sanitized.description).toBe('Given an array...');
      expect(sanitized.topic).toBe('Arrays');
      expect(sanitized.tags).toEqual(['array', 'hash-table']);
    });

    it('should filter invalid examples and test cases', () => {
      const dirtyQuestion: Partial<QuestionDocument> = {
        examples: [
          { input: 'valid', output: 'valid' },
          { input: '', output: 'invalid' }, // Should be filtered
          { input: 'valid2', output: 'valid2' }
        ],
        testCases: [
          { input: 'valid', expectedOutput: 'valid', isHidden: false },
          { input: '', expectedOutput: 'invalid', isHidden: true }, // Should be filtered
          { input: 'valid2', expectedOutput: 'valid2', isHidden: 'true' as any } // Should convert boolean
        ]
      };

      const sanitized = schema.sanitize(dirtyQuestion);
      expect(sanitized.examples).toHaveLength(2);
      expect(sanitized.testCases).toHaveLength(2);
      expect(sanitized.testCases![1].isHidden).toBe(true);
    });
  });
});

describe('SubmissionValidationSchema', () => {
  const schema = new SubmissionValidationSchema();

  describe('validate', () => {
    it('should validate correct submission data', () => {
      const validSubmission: Partial<SubmissionDocument> = {
        uid: 'user123',
        problemId: 'problem456',
        code: 'def solution(): return []',
        language: 'Python',
        status: 'Accepted',
        executionTime: 0.5,
        memoryUsage: 1024,
        testResults: [
          {
            passed: true,
            input: 'test input',
            expectedOutput: 'expected',
            actualOutput: 'expected',
            executionTime: 0.1,
            memoryUsage: 512
          }
        ]
      };

      const result = schema.validate(validSubmission);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty code', () => {
      const invalidSubmission: Partial<SubmissionDocument> = {
        code: ''
      };

      const result = schema.validate(invalidSubmission);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'code',
          message: 'Code is required and must be between 1 and 50,000 characters'
        })
      );
    });

    it('should reject invalid programming language', () => {
      const invalidSubmission: Partial<SubmissionDocument> = {
        language: 'Ruby' as any
      };

      const result = schema.validate(invalidSubmission);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'language',
          message: expect.stringContaining('Programming language must be one of')
        })
      );
    });

    it('should reject invalid status', () => {
      const invalidSubmission: Partial<SubmissionDocument> = {
        status: 'Pending' as any
      };

      const result = schema.validate(invalidSubmission);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'status',
          message: expect.stringContaining('Status must be one of')
        })
      );
    });

    it('should validate test results structure', () => {
      const invalidSubmission: Partial<SubmissionDocument> = {
        testResults: [
          {
            passed: 'true' as any, // Should be boolean
            input: 123 as any, // Should be string
            expectedOutput: 'expected',
            actualOutput: 'actual',
            executionTime: -1, // Should be non-negative
            memoryUsage: 1024
          }
        ]
      };

      const result = schema.validate(invalidSubmission);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'testResults[0].passed',
          message: 'Test result passed must be a boolean'
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'testResults[0].input',
          message: 'Test result input must be a string'
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'testResults[0].executionTime',
          message: 'Test result execution time must be a non-negative number'
        })
      );
    });
  });

  describe('sanitize', () => {
    it('should sanitize submission data correctly', () => {
      const dirtySubmission: Partial<SubmissionDocument> = {
        uid: '  user123  ',
        problemId: '  problem456  ',
        code: 'def solution(): return []', // Should not be trimmed
        executionTime: 0.567,
        memoryUsage: 1024.8,
        testResults: [
          {
            passed: 'true' as any,
            input: 123 as any,
            expectedOutput: null as any,
            actualOutput: 'actual',
            executionTime: '0.1' as any,
            memoryUsage: '512' as any
          }
        ]
      };

      const sanitized = schema.sanitize(dirtySubmission);
      expect(sanitized.uid).toBe('user123');
      expect(sanitized.problemId).toBe('problem456');
      expect(sanitized.code).toBe('def solution(): return []');
      expect(sanitized.executionTime).toBe(0.567);
      expect(sanitized.memoryUsage).toBe(1024.8);
      expect(sanitized.testResults![0].passed).toBe(true);
      expect(sanitized.testResults![0].input).toBe('123');
      expect(sanitized.testResults![0].expectedOutput).toBe('');
      expect(sanitized.testResults![0].executionTime).toBe(0.1);
      expect(sanitized.testResults![0].memoryUsage).toBe(512);
    });
  });
});

describe('Schema Instances', () => {
  it('should export schema instances', () => {
    expect(userProfileSchema).toBeInstanceOf(UserProfileValidationSchema);
    expect(questionSchema).toBeInstanceOf(QuestionValidationSchema);
    expect(submissionSchema).toBeInstanceOf(SubmissionValidationSchema);
  });
});