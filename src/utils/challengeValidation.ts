import { DailyChallengeDocument, TopicDocument, ValidationError, ValidationResult, SKILL_LEVELS } from '@/types';

export function validateDailyChallengeData(data: Partial<DailyChallengeDocument>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate date
  if (data.date !== undefined) {
    if (!data.date || typeof data.date !== 'string') {
      errors.push({ field: 'date', message: 'Date is required and must be a string' });
    } else {
      // Validate YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date)) {
        errors.push({ field: 'date', message: 'Date must be in YYYY-MM-DD format' });
      } else {
        const date = new Date(data.date);
        if (isNaN(date.getTime())) {
          errors.push({ field: 'date', message: 'Invalid date' });
        }
      }
    }
  }

  // Validate problem IDs
  const problemFields = ['beginnerProblem', 'intermediateProblem', 'advancedProblem'] as const;
  
  for (const field of problemFields) {
    if (data[field] !== undefined) {
      if (!data[field] || typeof data[field] !== 'string') {
        errors.push({ field, message: `${field} is required and must be a string` });
      } else if (data[field]!.trim().length === 0) {
        errors.push({ field, message: `${field} cannot be empty` });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateCompleteDailyChallenge(challenge: Omit<DailyChallengeDocument, 'id' | 'createdAt'>): ValidationResult {
  const requiredFields = ['date', 'beginnerProblem', 'intermediateProblem', 'advancedProblem'];
  const errors: ValidationError[] = [];

  // Check for required fields
  for (const field of requiredFields) {
    if (!(field in challenge) || challenge[field as keyof typeof challenge] === undefined) {
      errors.push({ field, message: `${field} is required` });
    }
  }

  // If all required fields are present, validate the data
  if (errors.length === 0) {
    const validationResult = validateDailyChallengeData(challenge);
    errors.push(...validationResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateTopicData(data: Partial<TopicDocument>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate name
  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') {
      errors.push({ field: 'name', message: 'Name is required and must be a string' });
    } else if (data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
    } else if (data.name.length > 50) {
      errors.push({ field: 'name', message: 'Name must be less than 50 characters' });
    }
  }

  // Validate description
  if (data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string') {
      errors.push({ field: 'description', message: 'Description is required and must be a string' });
    } else if (data.description.trim().length < 10) {
      errors.push({ field: 'description', message: 'Description must be at least 10 characters long' });
    } else if (data.description.length > 500) {
      errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
    }
  }

  // Validate skillLevel
  if (data.skillLevel !== undefined) {
    if (!data.skillLevel) {
      errors.push({ field: 'skillLevel', message: 'Skill level is required' });
    } else if (!SKILL_LEVELS.includes(data.skillLevel)) {
      errors.push({ field: 'skillLevel', message: 'Invalid skill level' });
    }
  }

  // Validate order
  if (data.order !== undefined) {
    if (typeof data.order !== 'number' || data.order < 0) {
      errors.push({ field: 'order', message: 'Order must be a non-negative number' });
    }
  }

  // Validate isActive
  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    errors.push({ field: 'isActive', message: 'isActive must be a boolean' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateCompleteTopic(topic: Omit<TopicDocument, 'id' | 'createdAt'>): ValidationResult {
  const requiredFields = ['name', 'description', 'skillLevel', 'order', 'isActive'];
  const errors: ValidationError[] = [];

  // Check for required fields
  for (const field of requiredFields) {
    if (!(field in topic) || topic[field as keyof typeof topic] === undefined) {
      errors.push({ field, message: `${field} is required` });
    }
  }

  // If all required fields are present, validate the data
  if (errors.length === 0) {
    const validationResult = validateTopicData(topic);
    errors.push(...validationResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeDailyChallengeData(data: Partial<DailyChallengeDocument>): Partial<DailyChallengeDocument> {
  const sanitized: Partial<DailyChallengeDocument> = {};

  if (data.date && typeof data.date === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(data.date.trim())) {
      sanitized.date = data.date.trim();
    }
  }

  if (data.beginnerProblem && typeof data.beginnerProblem === 'string') {
    sanitized.beginnerProblem = data.beginnerProblem.trim();
  }

  if (data.intermediateProblem && typeof data.intermediateProblem === 'string') {
    sanitized.intermediateProblem = data.intermediateProblem.trim();
  }

  if (data.advancedProblem && typeof data.advancedProblem === 'string') {
    sanitized.advancedProblem = data.advancedProblem.trim();
  }

  return sanitized;
}

export function sanitizeTopicData(data: Partial<TopicDocument>): Partial<TopicDocument> {
  const sanitized: Partial<TopicDocument> = {};

  if (data.name && typeof data.name === 'string') {
    sanitized.name = data.name.trim();
  }

  if (data.description && typeof data.description === 'string') {
    sanitized.description = data.description.trim();
  }

  if (data.skillLevel && SKILL_LEVELS.includes(data.skillLevel)) {
    sanitized.skillLevel = data.skillLevel;
  }

  if (typeof data.order === 'number' && data.order >= 0) {
    sanitized.order = Math.floor(data.order);
  }

  if (typeof data.isActive === 'boolean') {
    sanitized.isActive = data.isActive;
  }

  return sanitized;
}

export function generateDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

export function isValidChallengeDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}