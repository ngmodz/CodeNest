import { describe, it, expect } from '@jest/globals';
import { 
  validateQuestionData, 
  validateCompleteQuestion, 
  sanitizeQuestionData 
} from '../questionValidation';
import { QuestionDocument } from '@/types';

describe('Question Validation', () => {
  const validQuestion: Omit<QuestionDocument, 'id' | 'createdAt'> = {
    title: 'Two Sum',
    description: 'Given an array of integers, return indices of the two numbers such that they add up to a specific target.',
    difficulty: 'Basic',
    topic: 'Arrays',
    examples: [
      {
        input: '[2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] = 2 + 7 = 9'
      }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
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

  describe('validateQuestionData', () => {
    it('should validate correct question data', () => {
      const result = validateQuestionData(validQuestion);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty title', () => {
      const result = validateQuestionData({ title: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Title must be at least 3 characters long'
      });
    });

    it('should reject title that is too long', () => {
      const longTitle = 'a'.repeat(201);
      const result = validateQuestionData({ title: longTitle });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Title must be less than 200 characters'
      });
    });

    it('should reject invalid difficulty', () => {
      const result = validateQuestionData({ difficulty: 'InvalidDifficulty' as any });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'difficulty',
        message: 'Invalid difficulty level'
      });
    });

    it('should reject empty description', () => {
      const result = validateQuestionData({ description: 'short' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'description',
        message: 'Description must be at least 10 characters long'
      });
    });

    it('should reject invalid examples', () => {
      const result = validateQuestionData({
        examples: [{ input: '', output: 'valid' }]
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field.includes('examples[0].input'))).toBe(true);
    });

    it('should reject invalid test cases', () => {
      const result = validateQuestionData({
        testCases: [{ input: 'valid', expectedOutput: '', isHidden: true }]
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field.includes('testCases[0].expectedOutput'))).toBe(true);
    });

    it('should require at least one example', () => {
      const result = validateQuestionData({ examples: [] });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'examples',
        message: 'At least one example is required'
      });
    });

    it('should require at least one test case', () => {
      const result = validateQuestionData({ testCases: [] });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'testCases',
        message: 'At least one test case is required'
      });
    });
  });

  describe('validateCompleteQuestion', () => {
    it('should validate complete question', () => {
      const result = validateCompleteQuestion(validQuestion);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject incomplete question', () => {
      const incompleteQuestion = {
        title: 'Test',
        description: 'Test description that is long enough'
        // Missing required fields
      };
      
      const result = validateCompleteQuestion(incompleteQuestion as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeQuestionData', () => {
    it('should sanitize question data', () => {
      const dirtyData = {
        title: '  Two Sum  ',
        description: '  Test description  ',
        topic: '  Arrays  ',
        constraints: ['  constraint 1  ', '', '  constraint 2  '],
        tags: ['  array  ', '', '  HASH-TABLE  ']
      };

      const result = sanitizeQuestionData(dirtyData);
      
      expect(result.title).toBe('Two Sum');
      expect(result.description).toBe('Test description');
      expect(result.topic).toBe('Arrays');
      expect(result.constraints).toEqual(['constraint 1', 'constraint 2']);
      expect(result.tags).toEqual(['array', 'hash-table']);
    });

    it('should filter out invalid data', () => {
      const invalidData = {
        title: '',
        difficulty: 'InvalidDifficulty' as any,
        examples: [
          { input: 'valid', output: 'valid' },
          { input: '', output: 'invalid' }
        ]
      };

      const result = sanitizeQuestionData(invalidData);
      
      expect(result.title).toBeUndefined();
      expect(result.difficulty).toBeUndefined();
      expect(result.examples).toHaveLength(1);
    });
  });
});