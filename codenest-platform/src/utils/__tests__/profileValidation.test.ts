import {
  validateProfileData,
  validateCompleteProfile,
  sanitizeProfileData,
  getProfileCompletionPercentage
} from '../profileValidation';
import { UserProfile } from '@/types';

describe('profileValidation', () => {
  describe('validateProfileData', () => {
    it('validates skill level correctly', () => {
      const validData = { level: 'Beginner' as const };
      const result = validateProfileData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid skill level', () => {
      const invalidData = { level: 'Expert' as any };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'level',
        message: 'Invalid skill level'
      });
    });

    it('rejects empty skill level', () => {
      const invalidData = { level: '' as any };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'level',
        message: 'Skill level is required'
      });
    });

    it('validates preferred language correctly', () => {
      const validData = { preferredLanguage: 'Python' as const };
      const result = validateProfileData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid preferred language', () => {
      const invalidData = { preferredLanguage: 'Ruby' as any };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'preferredLanguage',
        message: 'Invalid programming language'
      });
    });

    it('validates theme correctly', () => {
      const validData = { theme: 'dark' as const };
      const result = validateProfileData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid theme', () => {
      const invalidData = { theme: 'blue' as any };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'theme',
        message: 'Invalid theme'
      });
    });

    it('validates streak correctly', () => {
      const validData = { streak: 5 };
      const result = validateProfileData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects negative streak', () => {
      const invalidData = { streak: -1 };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'streak',
        message: 'Streak must be a non-negative number'
      });
    });

    it('rejects non-numeric streak', () => {
      const invalidData = { streak: 'five' as any };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'streak',
        message: 'Streak must be a non-negative number'
      });
    });

    it('validates totalXP correctly', () => {
      const validData = { totalXP: 100 };
      const result = validateProfileData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects negative totalXP', () => {
      const invalidData = { totalXP: -50 };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'totalXP',
        message: 'Total XP must be a non-negative number'
      });
    });

    it('validates lastActiveDate correctly', () => {
      const validData = { lastActiveDate: '2024-01-15T10:00:00.000Z' };
      const result = validateProfileData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid date format', () => {
      const invalidData = { lastActiveDate: 'invalid-date' };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'lastActiveDate',
        message: 'Invalid date format'
      });
    });

    it('validates solvedProblems correctly', () => {
      const validData = { solvedProblems: ['problem1', 'problem2'] };
      const result = validateProfileData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects non-array solvedProblems', () => {
      const invalidData = { solvedProblems: 'problem1,problem2' as any };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'solvedProblems',
        message: 'Solved problems must be an array'
      });
    });

    it('rejects invalid problem IDs in solvedProblems', () => {
      const invalidData = { solvedProblems: ['problem1', '', 123] as any };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'solvedProblems',
        message: 'All problem IDs must be non-empty strings'
      });
    });

    it('validates multiple fields at once', () => {
      const validData = {
        level: 'Advanced' as const,
        preferredLanguage: 'JavaScript' as const,
        theme: 'light' as const,
        streak: 10,
        totalXP: 500
      };
      const result = validateProfileData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns multiple errors for multiple invalid fields', () => {
      const invalidData = {
        level: 'Expert' as any,
        preferredLanguage: 'Ruby' as any,
        streak: -1
      };
      const result = validateProfileData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('validateCompleteProfile', () => {
    const validProfile: Omit<UserProfile, 'uid'> = {
      level: 'Intermediate',
      preferredLanguage: 'Python',
      theme: 'dark',
      streak: 5,
      lastActiveDate: '2024-01-15T10:00:00.000Z',
      totalXP: 150,
      solvedProblems: ['problem1', 'problem2']
    };

    it('validates complete valid profile', () => {
      const result = validateCompleteProfile(validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects profile missing required fields', () => {
      const incompleteProfile = {
        level: 'Intermediate' as const,
        preferredLanguage: 'Python' as const
        // Missing other required fields
      } as any;
      
      const result = validateCompleteProfile(incompleteProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('is required'))).toBe(true);
    });

    it('validates field values even when all fields are present', () => {
      const invalidProfile = {
        ...validProfile,
        level: 'Expert' as any,
        streak: -1
      };
      
      const result = validateCompleteProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'level',
        message: 'Invalid skill level'
      });
      expect(result.errors).toContainEqual({
        field: 'streak',
        message: 'Streak must be a non-negative number'
      });
    });
  });

  describe('sanitizeProfileData', () => {
    it('keeps valid data unchanged', () => {
      const validData = {
        level: 'Beginner' as const,
        preferredLanguage: 'Python' as const,
        theme: 'dark' as const,
        streak: 5,
        totalXP: 100,
        lastActiveDate: '2024-01-15T10:00:00.000Z',
        solvedProblems: ['problem1', 'problem2']
      };
      
      const result = sanitizeProfileData(validData);
      expect(result).toEqual(validData);
    });

    it('removes invalid skill level', () => {
      const invalidData = { level: 'Expert' as any };
      const result = sanitizeProfileData(invalidData);
      expect(result).toEqual({});
    });

    it('removes invalid preferred language', () => {
      const invalidData = { preferredLanguage: 'Ruby' as any };
      const result = sanitizeProfileData(invalidData);
      expect(result).toEqual({});
    });

    it('removes invalid theme', () => {
      const invalidData = { theme: 'blue' as any };
      const result = sanitizeProfileData(invalidData);
      expect(result).toEqual({});
    });

    it('floors numeric values', () => {
      const data = { streak: 5.7, totalXP: 100.9 };
      const result = sanitizeProfileData(data);
      expect(result).toEqual({ streak: 5, totalXP: 100 });
    });

    it('removes negative numeric values', () => {
      const data = { streak: -1, totalXP: -50 };
      const result = sanitizeProfileData(data);
      expect(result).toEqual({});
    });

    it('converts valid date to ISO string', () => {
      const data = { lastActiveDate: '2024-01-15' };
      const result = sanitizeProfileData(data);
      expect(result.lastActiveDate).toBe(new Date('2024-01-15').toISOString());
    });

    it('removes invalid date', () => {
      const data = { lastActiveDate: 'invalid-date' };
      const result = sanitizeProfileData(data);
      expect(result).toEqual({});
    });

    it('filters and trims solved problems', () => {
      const data = { solvedProblems: ['problem1', '  problem2  ', '', 123, 'problem3'] as any };
      const result = sanitizeProfileData(data);
      expect(result.solvedProblems).toEqual(['problem1', 'problem2', 'problem3']);
    });

    it('removes non-array solved problems', () => {
      const data = { solvedProblems: 'problem1,problem2' as any };
      const result = sanitizeProfileData(data);
      expect(result).toEqual({});
    });

    it('handles mixed valid and invalid data', () => {
      const data = {
        level: 'Beginner' as const,
        preferredLanguage: 'Ruby' as any, // invalid
        theme: 'dark' as const,
        streak: 5.7,
        totalXP: -50, // invalid
        solvedProblems: ['problem1', '']
      };
      
      const result = sanitizeProfileData(data);
      expect(result).toEqual({
        level: 'Beginner',
        theme: 'dark',
        streak: 5,
        solvedProblems: ['problem1']
      });
    });
  });

  describe('getProfileCompletionPercentage', () => {
    it('returns 100% for complete profile', () => {
      const completeProfile = {
        level: 'Beginner' as const,
        preferredLanguage: 'Python' as const,
        theme: 'dark' as const
      };
      
      const result = getProfileCompletionPercentage(completeProfile);
      expect(result).toBe(100);
    });

    it('returns 0% for empty profile', () => {
      const emptyProfile = {};
      const result = getProfileCompletionPercentage(emptyProfile);
      expect(result).toBe(0);
    });

    it('returns 33% for one field completed', () => {
      const partialProfile = { level: 'Beginner' as const };
      const result = getProfileCompletionPercentage(partialProfile);
      expect(result).toBe(33);
    });

    it('returns 67% for two fields completed', () => {
      const partialProfile = {
        level: 'Beginner' as const,
        preferredLanguage: 'Python' as const
      };
      const result = getProfileCompletionPercentage(partialProfile);
      expect(result).toBe(67);
    });

    it('ignores empty string values', () => {
      const partialProfile = {
        level: 'Beginner' as const,
        preferredLanguage: '' as any,
        theme: 'dark' as const
      };
      const result = getProfileCompletionPercentage(partialProfile);
      expect(result).toBe(67);
    });

    it('ignores undefined values', () => {
      const partialProfile = {
        level: 'Beginner' as const,
        preferredLanguage: undefined as any,
        theme: 'dark' as const
      };
      const result = getProfileCompletionPercentage(partialProfile);
      expect(result).toBe(67);
    });
  });
});