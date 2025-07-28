// Utility helper functions
import { SKILL_LEVELS, DIFFICULTY_LEVELS } from './constants';

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

/**
 * Check if date is today
 */
export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

/**
 * Get difficulty color for UI
 */
export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case DIFFICULTY_LEVELS.BASIC:
      return 'text-green-600';
    case DIFFICULTY_LEVELS.INTERMEDIATE:
      return 'text-yellow-600';
    case DIFFICULTY_LEVELS.ADVANCED:
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

/**
 * Get skill level badge color
 */
export const getSkillLevelColor = (level: string): string => {
  switch (level) {
    case SKILL_LEVELS.BEGINNER:
      return 'bg-green-100 text-green-800';
    case SKILL_LEVELS.INTERMEDIATE:
      return 'bg-yellow-100 text-yellow-800';
    case SKILL_LEVELS.ADVANCED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Calculate XP based on difficulty
 */
export const calculateXP = (difficulty: string): number => {
  switch (difficulty) {
    case DIFFICULTY_LEVELS.BASIC:
      return 10;
    case DIFFICULTY_LEVELS.INTERMEDIATE:
      return 25;
    case DIFFICULTY_LEVELS.ADVANCED:
      return 50;
    default:
      return 10;
  }
};