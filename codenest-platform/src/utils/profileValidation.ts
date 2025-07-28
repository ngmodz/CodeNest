import { UserProfile } from '@/types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

const VALID_SKILL_LEVELS: UserProfile['level'][] = ['Beginner', 'Intermediate', 'Advanced'];
const VALID_LANGUAGES: UserProfile['preferredLanguage'][] = ['Python', 'JavaScript', 'Java', 'C++', 'C'];
const VALID_THEMES: UserProfile['theme'][] = ['light', 'dark'];

export function validateProfileData(data: Partial<UserProfile>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate skill level
  if (data.level !== undefined) {
    if (!data.level) {
      errors.push({ field: 'level', message: 'Skill level is required' });
    } else if (!VALID_SKILL_LEVELS.includes(data.level)) {
      errors.push({ field: 'level', message: 'Invalid skill level' });
    }
  }

  // Validate preferred language
  if (data.preferredLanguage !== undefined) {
    if (!data.preferredLanguage) {
      errors.push({ field: 'preferredLanguage', message: 'Preferred language is required' });
    } else if (!VALID_LANGUAGES.includes(data.preferredLanguage)) {
      errors.push({ field: 'preferredLanguage', message: 'Invalid programming language' });
    }
  }

  // Validate theme
  if (data.theme !== undefined) {
    if (!data.theme) {
      errors.push({ field: 'theme', message: 'Theme is required' });
    } else if (!VALID_THEMES.includes(data.theme)) {
      errors.push({ field: 'theme', message: 'Invalid theme' });
    }
  }

  // Validate streak
  if (data.streak !== undefined) {
    if (typeof data.streak !== 'number' || data.streak < 0) {
      errors.push({ field: 'streak', message: 'Streak must be a non-negative number' });
    }
  }

  // Validate totalXP
  if (data.totalXP !== undefined) {
    if (typeof data.totalXP !== 'number' || data.totalXP < 0) {
      errors.push({ field: 'totalXP', message: 'Total XP must be a non-negative number' });
    }
  }

  // Validate lastActiveDate
  if (data.lastActiveDate !== undefined) {
    if (!data.lastActiveDate) {
      errors.push({ field: 'lastActiveDate', message: 'Last active date is required' });
    } else {
      const date = new Date(data.lastActiveDate);
      if (isNaN(date.getTime())) {
        errors.push({ field: 'lastActiveDate', message: 'Invalid date format' });
      }
    }
  }

  // Validate solvedProblems
  if (data.solvedProblems !== undefined) {
    if (!Array.isArray(data.solvedProblems)) {
      errors.push({ field: 'solvedProblems', message: 'Solved problems must be an array' });
    } else {
      const invalidIds = data.solvedProblems.filter(id => typeof id !== 'string' || !id.trim());
      if (invalidIds.length > 0) {
        errors.push({ field: 'solvedProblems', message: 'All problem IDs must be non-empty strings' });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateCompleteProfile(profile: Omit<UserProfile, 'uid'>): ValidationResult {
  const requiredFields = ['level', 'preferredLanguage', 'theme', 'streak', 'lastActiveDate', 'totalXP', 'solvedProblems'];
  const errors: ValidationError[] = [];

  // Check for required fields
  for (const field of requiredFields) {
    if (!(field in profile) || profile[field as keyof typeof profile] === undefined) {
      errors.push({ field, message: `${field} is required` });
    }
  }

  // If all required fields are present, validate the data
  if (errors.length === 0) {
    const validationResult = validateProfileData(profile);
    errors.push(...validationResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeProfileData(data: Partial<UserProfile>): Partial<UserProfile> {
  const sanitized: Partial<UserProfile> = {};

  // Copy and validate each field
  if (data.level && VALID_SKILL_LEVELS.includes(data.level)) {
    sanitized.level = data.level;
  }

  if (data.preferredLanguage && VALID_LANGUAGES.includes(data.preferredLanguage)) {
    sanitized.preferredLanguage = data.preferredLanguage;
  }

  if (data.theme && VALID_THEMES.includes(data.theme)) {
    sanitized.theme = data.theme;
  }

  if (typeof data.streak === 'number' && data.streak >= 0) {
    sanitized.streak = Math.floor(data.streak);
  }

  if (typeof data.totalXP === 'number' && data.totalXP >= 0) {
    sanitized.totalXP = Math.floor(data.totalXP);
  }

  if (data.lastActiveDate) {
    const date = new Date(data.lastActiveDate);
    if (!isNaN(date.getTime())) {
      sanitized.lastActiveDate = date.toISOString();
    }
  }

  if (Array.isArray(data.solvedProblems)) {
    sanitized.solvedProblems = data.solvedProblems
      .filter(id => typeof id === 'string' && id.trim())
      .map(id => id.trim());
  }

  return sanitized;
}

export function getProfileCompletionPercentage(profile: Partial<UserProfile>): number {
  const requiredFields = ['level', 'preferredLanguage', 'theme'];
  const completedFields = requiredFields.filter(field => 
    profile[field as keyof UserProfile] !== undefined && 
    profile[field as keyof UserProfile] !== ''
  );

  return Math.round((completedFields.length / requiredFields.length) * 100);
}