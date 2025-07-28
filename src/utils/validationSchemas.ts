import { 
  UserProfile, 
  UserDocument,
  QuestionDocument, 
  SubmissionDocument, 
  DailyChallengeDocument,
  TopicDocument,
  ValidationError,
  ValidationResult,
  SKILL_LEVELS,
  PROGRAMMING_LANGUAGES,
  THEMES,
  DIFFICULTY_LEVELS,
  SUBMISSION_STATUSES
} from '@/types';

// Enhanced validation schema interface
export interface ValidationSchema<T> {
  validate(data: Partial<T>): ValidationResult;
  validateComplete(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): ValidationResult;
  sanitize(data: Partial<T>): Partial<T>;
}

// Common validation utilities
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Additional check for consecutive dots
    if (email.includes('..')) return false;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  static isValidISODate(dateString: string): boolean {
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return isoRegex.test(dateString) && this.isValidDate(dateString);
  }

  static isValidYYYYMMDD(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(dateString) && this.isValidDate(dateString);
  }

  static sanitizeString(value: unknown, options: {
    trim?: boolean;
    maxLength?: number;
    minLength?: number;
    allowEmpty?: boolean;
  } = {}): string | null {
    if (typeof value !== 'string') return null;
    
    let sanitized = options.trim !== false ? value.trim() : value;
    
    if (!options.allowEmpty && sanitized.length === 0) return null;
    if (options.minLength && sanitized.length < options.minLength) return null;
    if (options.maxLength && sanitized.length > options.maxLength) return null;
    
    return sanitized;
  }

  static sanitizeNumber(value: unknown, options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}): number | null {
    if (value === null || value === undefined) return null;
    
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    
    if (isNaN(num)) return null;
    if (options.min !== undefined && num < options.min) return null;
    if (options.max !== undefined && num > options.max) return null;
    if (options.integer && !Number.isInteger(num)) return null;
    
    return num;
  }

  static sanitizeArray<T>(value: unknown, itemValidator: (item: unknown) => T | null): T[] {
    if (!Array.isArray(value)) return [];
    
    return value
      .map(itemValidator)
      .filter((item): item is T => item !== null);
  }

  static createValidationError(field: string, message: string, code?: string): ValidationError {
    return { field, message, code };
  }
}

// Enhanced User Profile Validation Schema
export class UserProfileValidationSchema implements ValidationSchema<UserProfile> {
  validate(data: Partial<UserProfile>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate uid
    if (data.uid !== undefined) {
      const sanitizedUid = ValidationUtils.sanitizeString(data.uid, { minLength: 1, maxLength: 128 });
      if (!sanitizedUid) {
        errors.push(ValidationUtils.createValidationError('uid', 'User ID must be a non-empty string with max 128 characters'));
      }
    }

    // Validate level
    if (data.level !== undefined) {
      if (!data.level || !SKILL_LEVELS.includes(data.level as any)) {
        errors.push(ValidationUtils.createValidationError('level', `Skill level must be one of: ${SKILL_LEVELS.join(', ')}`));
      }
    }

    // Validate preferredLanguage
    if (data.preferredLanguage !== undefined) {
      if (!data.preferredLanguage || !PROGRAMMING_LANGUAGES.includes(data.preferredLanguage as any)) {
        errors.push(ValidationUtils.createValidationError('preferredLanguage', `Preferred language must be one of: ${PROGRAMMING_LANGUAGES.join(', ')}`));
      }
    }

    // Validate theme
    if (data.theme !== undefined) {
      if (!data.theme || !THEMES.includes(data.theme as any)) {
        errors.push(ValidationUtils.createValidationError('theme', `Theme must be one of: ${THEMES.join(', ')}`));
      }
    }

    // Validate streak
    if (data.streak !== undefined) {
      const sanitizedStreak = ValidationUtils.sanitizeNumber(data.streak, { min: 0, integer: true });
      if (sanitizedStreak === null) {
        errors.push(ValidationUtils.createValidationError('streak', 'Streak must be a non-negative integer'));
      }
    }

    // Validate totalXP
    if (data.totalXP !== undefined) {
      const sanitizedXP = ValidationUtils.sanitizeNumber(data.totalXP, { min: 0, integer: true });
      if (sanitizedXP === null) {
        errors.push(ValidationUtils.createValidationError('totalXP', 'Total XP must be a non-negative integer'));
      }
    }

    // Validate lastActiveDate
    if (data.lastActiveDate !== undefined) {
      if (!data.lastActiveDate || !ValidationUtils.isValidISODate(data.lastActiveDate)) {
        errors.push(ValidationUtils.createValidationError('lastActiveDate', 'Last active date must be a valid ISO date string'));
      }
    }

    // Validate solvedProblems
    if (data.solvedProblems !== undefined) {
      if (!Array.isArray(data.solvedProblems)) {
        errors.push(ValidationUtils.createValidationError('solvedProblems', 'Solved problems must be an array'));
      } else {
        const invalidIds = data.solvedProblems.filter(id => 
          typeof id !== 'string' || !ValidationUtils.sanitizeString(id, { minLength: 1 })
        );
        if (invalidIds.length > 0) {
          errors.push(ValidationUtils.createValidationError('solvedProblems', 'All problem IDs must be non-empty strings'));
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  validateComplete(data: Omit<UserProfile, 'uid'>): ValidationResult {
    const requiredFields: (keyof Omit<UserProfile, 'uid'>)[] = ['level', 'preferredLanguage', 'theme', 'streak', 'lastActiveDate', 'totalXP', 'solvedProblems'];
    const errors: ValidationError[] = [];

    // Check for required fields
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        errors.push(ValidationUtils.createValidationError(field, `${field} is required`));
      }
    }

    // If all required fields are present, validate the data
    if (errors.length === 0) {
      const validationResult = this.validate(data);
      errors.push(...validationResult.errors);
    }

    return { isValid: errors.length === 0, errors };
  }

  sanitize(data: Partial<UserProfile>): Partial<UserProfile> {
    const sanitized: Partial<UserProfile> = {};

    if (data.uid) {
      const sanitizedUid = ValidationUtils.sanitizeString(data.uid, { maxLength: 128 });
      if (sanitizedUid) sanitized.uid = sanitizedUid;
    }

    if (data.level && SKILL_LEVELS.includes(data.level as any)) {
      sanitized.level = data.level;
    }

    if (data.preferredLanguage && PROGRAMMING_LANGUAGES.includes(data.preferredLanguage as any)) {
      sanitized.preferredLanguage = data.preferredLanguage;
    }

    if (data.theme && THEMES.includes(data.theme as any)) {
      sanitized.theme = data.theme;
    }

    if (data.streak !== undefined) {
      const sanitizedStreak = ValidationUtils.sanitizeNumber(data.streak, { min: 0 });
      if (sanitizedStreak !== null) sanitized.streak = Math.floor(sanitizedStreak);
    }

    if (data.totalXP !== undefined) {
      const sanitizedXP = ValidationUtils.sanitizeNumber(data.totalXP, { min: 0 });
      if (sanitizedXP !== null) sanitized.totalXP = Math.floor(sanitizedXP);
    }

    if (data.lastActiveDate && ValidationUtils.isValidISODate(data.lastActiveDate)) {
      sanitized.lastActiveDate = data.lastActiveDate;
    }

    if (Array.isArray(data.solvedProblems)) {
      sanitized.solvedProblems = ValidationUtils.sanitizeArray(
        data.solvedProblems,
        (id) => ValidationUtils.sanitizeString(id, { minLength: 1 })
      );
    }

    return sanitized;
  }
}

// Enhanced Question Validation Schema
export class QuestionValidationSchema implements ValidationSchema<QuestionDocument> {
  validate(data: Partial<QuestionDocument>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate title
    if (data.title !== undefined) {
      const sanitizedTitle = ValidationUtils.sanitizeString(data.title, { minLength: 3, maxLength: 200 });
      if (!sanitizedTitle) {
        errors.push(ValidationUtils.createValidationError('title', 'Title must be between 3 and 200 characters'));
      }
    }

    // Validate description
    if (data.description !== undefined) {
      const sanitizedDescription = ValidationUtils.sanitizeString(data.description, { minLength: 10, maxLength: 5000 });
      if (!sanitizedDescription) {
        errors.push(ValidationUtils.createValidationError('description', 'Description must be between 10 and 5000 characters'));
      }
    }

    // Validate difficulty
    if (data.difficulty !== undefined) {
      if (!data.difficulty || !DIFFICULTY_LEVELS.includes(data.difficulty as any)) {
        errors.push(ValidationUtils.createValidationError('difficulty', `Difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}`));
      }
    }

    // Validate topic
    if (data.topic !== undefined) {
      const sanitizedTopic = ValidationUtils.sanitizeString(data.topic, { minLength: 2, maxLength: 50 });
      if (!sanitizedTopic) {
        errors.push(ValidationUtils.createValidationError('topic', 'Topic must be between 2 and 50 characters'));
      }
    }

    // Validate examples
    if (data.examples !== undefined) {
      if (!Array.isArray(data.examples) || data.examples.length === 0) {
        errors.push(ValidationUtils.createValidationError('examples', 'At least one example is required'));
      } else {
        data.examples.forEach((example, index) => {
          if (!example.input || typeof example.input !== 'string') {
            errors.push(ValidationUtils.createValidationError(`examples[${index}].input`, 'Example input is required'));
          }
          if (!example.output || typeof example.output !== 'string') {
            errors.push(ValidationUtils.createValidationError(`examples[${index}].output`, 'Example output is required'));
          }
          if (example.explanation !== undefined && typeof example.explanation !== 'string') {
            errors.push(ValidationUtils.createValidationError(`examples[${index}].explanation`, 'Example explanation must be a string'));
          }
        });
      }
    }

    // Validate constraints
    if (data.constraints !== undefined) {
      if (!Array.isArray(data.constraints)) {
        errors.push(ValidationUtils.createValidationError('constraints', 'Constraints must be an array'));
      } else {
        const invalidConstraints = data.constraints.filter(constraint => 
          typeof constraint !== 'string' || !ValidationUtils.sanitizeString(constraint, { minLength: 1 })
        );
        if (invalidConstraints.length > 0) {
          errors.push(ValidationUtils.createValidationError('constraints', 'All constraints must be non-empty strings'));
        }
      }
    }

    // Validate testCases
    if (data.testCases !== undefined) {
      if (!Array.isArray(data.testCases) || data.testCases.length === 0) {
        errors.push(ValidationUtils.createValidationError('testCases', 'At least one test case is required'));
      } else {
        data.testCases.forEach((testCase, index) => {
          if (!testCase.input || typeof testCase.input !== 'string') {
            errors.push(ValidationUtils.createValidationError(`testCases[${index}].input`, 'Test case input is required'));
          }
          if (!testCase.expectedOutput || typeof testCase.expectedOutput !== 'string') {
            errors.push(ValidationUtils.createValidationError(`testCases[${index}].expectedOutput`, 'Test case expected output is required'));
          }
          if (typeof testCase.isHidden !== 'boolean') {
            errors.push(ValidationUtils.createValidationError(`testCases[${index}].isHidden`, 'Test case isHidden must be a boolean'));
          }
        });
      }
    }

    // Validate isAI
    if (data.isAI !== undefined && typeof data.isAI !== 'boolean') {
      errors.push(ValidationUtils.createValidationError('isAI', 'isAI must be a boolean'));
    }

    // Validate createdBy
    if (data.createdBy !== undefined) {
      const sanitizedCreatedBy = ValidationUtils.sanitizeString(data.createdBy, { minLength: 1 });
      if (!sanitizedCreatedBy) {
        errors.push(ValidationUtils.createValidationError('createdBy', 'createdBy must be a non-empty string'));
      }
    }

    // Validate tags
    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) {
        errors.push(ValidationUtils.createValidationError('tags', 'Tags must be an array'));
      } else {
        const invalidTags = data.tags.filter(tag => 
          typeof tag !== 'string' || !ValidationUtils.sanitizeString(tag, { minLength: 1 })
        );
        if (invalidTags.length > 0) {
          errors.push(ValidationUtils.createValidationError('tags', 'All tags must be non-empty strings'));
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  validateComplete(data: Omit<QuestionDocument, 'id' | 'createdAt'>): ValidationResult {
    const requiredFields: (keyof Omit<QuestionDocument, 'id' | 'createdAt'>)[] = ['title', 'description', 'difficulty', 'topic', 'examples', 'constraints', 'testCases', 'isAI', 'tags'];
    const errors: ValidationError[] = [];

    // Check for required fields
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        errors.push(ValidationUtils.createValidationError(field, `${field} is required`));
      }
    }

    // If all required fields are present, validate the data
    if (errors.length === 0) {
      const validationResult = this.validate(data);
      errors.push(...validationResult.errors);
    }

    return { isValid: errors.length === 0, errors };
  }

  sanitize(data: Partial<QuestionDocument>): Partial<QuestionDocument> {
    const sanitized: Partial<QuestionDocument> = {};

    const sanitizedTitle = ValidationUtils.sanitizeString(data.title, { maxLength: 200 });
    if (sanitizedTitle) sanitized.title = sanitizedTitle;

    const sanitizedDescription = ValidationUtils.sanitizeString(data.description, { maxLength: 5000 });
    if (sanitizedDescription) sanitized.description = sanitizedDescription;

    if (data.difficulty && DIFFICULTY_LEVELS.includes(data.difficulty as any)) {
      sanitized.difficulty = data.difficulty;
    }

    const sanitizedTopic = ValidationUtils.sanitizeString(data.topic, { maxLength: 50 });
    if (sanitizedTopic) sanitized.topic = sanitizedTopic;

    if (Array.isArray(data.examples)) {
      sanitized.examples = data.examples
        .filter(example => example.input && example.output)
        .map(example => ({
          input: ValidationUtils.sanitizeString(example.input) || '',
          output: ValidationUtils.sanitizeString(example.output) || '',
          explanation: example.explanation ? ValidationUtils.sanitizeString(example.explanation) || undefined : undefined
        }));
    }

    if (Array.isArray(data.constraints)) {
      sanitized.constraints = ValidationUtils.sanitizeArray(
        data.constraints,
        (constraint) => ValidationUtils.sanitizeString(constraint, { minLength: 1 })
      );
    }

    if (Array.isArray(data.testCases)) {
      sanitized.testCases = data.testCases
        .filter(testCase => testCase.input && testCase.expectedOutput)
        .map(testCase => ({
          input: ValidationUtils.sanitizeString(testCase.input) || '',
          expectedOutput: ValidationUtils.sanitizeString(testCase.expectedOutput) || '',
          isHidden: Boolean(testCase.isHidden)
        }));
    }

    if (typeof data.isAI === 'boolean') {
      sanitized.isAI = data.isAI;
    }

    const sanitizedCreatedBy = ValidationUtils.sanitizeString(data.createdBy);
    if (sanitizedCreatedBy) sanitized.createdBy = sanitizedCreatedBy;

    if (Array.isArray(data.tags)) {
      sanitized.tags = ValidationUtils.sanitizeArray(
        data.tags,
        (tag) => {
          const sanitizedTag = ValidationUtils.sanitizeString(tag, { minLength: 1 });
          return sanitizedTag ? sanitizedTag.toLowerCase() : null;
        }
      );
    }

    return sanitized;
  }
}

// Enhanced Submission Validation Schema
export class SubmissionValidationSchema implements ValidationSchema<SubmissionDocument> {
  validate(data: Partial<SubmissionDocument>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate uid
    if (data.uid !== undefined) {
      const sanitizedUid = ValidationUtils.sanitizeString(data.uid, { minLength: 1 });
      if (!sanitizedUid) {
        errors.push(ValidationUtils.createValidationError('uid', 'User ID is required and must be a non-empty string'));
      }
    }

    // Validate problemId
    if (data.problemId !== undefined) {
      const sanitizedProblemId = ValidationUtils.sanitizeString(data.problemId, { minLength: 1 });
      if (!sanitizedProblemId) {
        errors.push(ValidationUtils.createValidationError('problemId', 'Problem ID is required and must be a non-empty string'));
      }
    }

    // Validate code
    if (data.code !== undefined) {
      const sanitizedCode = ValidationUtils.sanitizeString(data.code, { minLength: 1, maxLength: 50000, allowEmpty: false });
      if (!sanitizedCode) {
        errors.push(ValidationUtils.createValidationError('code', 'Code is required and must be between 1 and 50,000 characters'));
      }
    }

    // Validate language
    if (data.language !== undefined) {
      if (!data.language || !PROGRAMMING_LANGUAGES.includes(data.language as any)) {
        errors.push(ValidationUtils.createValidationError('language', `Programming language must be one of: ${PROGRAMMING_LANGUAGES.join(', ')}`));
      }
    }

    // Validate status
    if (data.status !== undefined) {
      if (!data.status || !SUBMISSION_STATUSES.includes(data.status as any)) {
        errors.push(ValidationUtils.createValidationError('status', `Status must be one of: ${SUBMISSION_STATUSES.join(', ')}`));
      }
    }

    // Validate executionTime
    if (data.executionTime !== undefined) {
      const sanitizedTime = ValidationUtils.sanitizeNumber(data.executionTime, { min: 0 });
      if (sanitizedTime === null) {
        errors.push(ValidationUtils.createValidationError('executionTime', 'Execution time must be a non-negative number'));
      }
    }

    // Validate memoryUsage
    if (data.memoryUsage !== undefined) {
      const sanitizedMemory = ValidationUtils.sanitizeNumber(data.memoryUsage, { min: 0 });
      if (sanitizedMemory === null) {
        errors.push(ValidationUtils.createValidationError('memoryUsage', 'Memory usage must be a non-negative number'));
      }
    }

    // Validate testResults
    if (data.testResults !== undefined) {
      if (!Array.isArray(data.testResults)) {
        errors.push(ValidationUtils.createValidationError('testResults', 'Test results must be an array'));
      } else {
        data.testResults.forEach((result, index) => {
          if (typeof result.passed !== 'boolean') {
            errors.push(ValidationUtils.createValidationError(`testResults[${index}].passed`, 'Test result passed must be a boolean'));
          }
          if (typeof result.input !== 'string') {
            errors.push(ValidationUtils.createValidationError(`testResults[${index}].input`, 'Test result input must be a string'));
          }
          if (typeof result.expectedOutput !== 'string') {
            errors.push(ValidationUtils.createValidationError(`testResults[${index}].expectedOutput`, 'Test result expected output must be a string'));
          }
          if (typeof result.actualOutput !== 'string') {
            errors.push(ValidationUtils.createValidationError(`testResults[${index}].actualOutput`, 'Test result actual output must be a string'));
          }
          if (typeof result.executionTime !== 'number' || result.executionTime < 0) {
            errors.push(ValidationUtils.createValidationError(`testResults[${index}].executionTime`, 'Test result execution time must be a non-negative number'));
          }
          if (typeof result.memoryUsage !== 'number' || result.memoryUsage < 0) {
            errors.push(ValidationUtils.createValidationError(`testResults[${index}].memoryUsage`, 'Test result memory usage must be a non-negative number'));
          }
          if (result.error !== undefined && typeof result.error !== 'string') {
            errors.push(ValidationUtils.createValidationError(`testResults[${index}].error`, 'Test result error must be a string'));
          }
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  validateComplete(data: Omit<SubmissionDocument, 'id' | 'submittedAt'>): ValidationResult {
    const requiredFields: (keyof Omit<SubmissionDocument, 'id' | 'submittedAt'>)[] = ['uid', 'problemId', 'code', 'language', 'status', 'testResults'];
    const errors: ValidationError[] = [];

    // Check for required fields
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        errors.push(ValidationUtils.createValidationError(field, `${field} is required`));
      }
    }

    // If all required fields are present, validate the data
    if (errors.length === 0) {
      const validationResult = this.validate(data);
      errors.push(...validationResult.errors);
    }

    return { isValid: errors.length === 0, errors };
  }

  sanitize(data: Partial<SubmissionDocument>): Partial<SubmissionDocument> {
    const sanitized: Partial<SubmissionDocument> = {};

    const sanitizedUid = ValidationUtils.sanitizeString(data.uid);
    if (sanitizedUid) sanitized.uid = sanitizedUid;

    const sanitizedProblemId = ValidationUtils.sanitizeString(data.problemId);
    if (sanitizedProblemId) sanitized.problemId = sanitizedProblemId;

    // Don't trim code as whitespace might be significant
    if (data.code && typeof data.code === 'string' && data.code.length <= 50000) {
      sanitized.code = data.code;
    }

    if (data.language && PROGRAMMING_LANGUAGES.includes(data.language as any)) {
      sanitized.language = data.language;
    }

    if (data.status && SUBMISSION_STATUSES.includes(data.status as any)) {
      sanitized.status = data.status;
    }

    const sanitizedExecutionTime = ValidationUtils.sanitizeNumber(data.executionTime, { min: 0 });
    if (sanitizedExecutionTime !== null) sanitized.executionTime = sanitizedExecutionTime;

    const sanitizedMemoryUsage = ValidationUtils.sanitizeNumber(data.memoryUsage, { min: 0 });
    if (sanitizedMemoryUsage !== null) sanitized.memoryUsage = sanitizedMemoryUsage;

    if (Array.isArray(data.testResults)) {
      sanitized.testResults = data.testResults.map(result => ({
        passed: Boolean(result.passed),
        input: String(result.input || ''),
        expectedOutput: String(result.expectedOutput || ''),
        actualOutput: String(result.actualOutput || ''),
        executionTime: Math.max(0, Number(result.executionTime) || 0),
        memoryUsage: Math.max(0, Number(result.memoryUsage) || 0),
        error: result.error ? String(result.error) : undefined
      }));
    }

    return sanitized;
  }
}

// Create schema instances for export
export const userProfileSchema = new UserProfileValidationSchema();
export const questionSchema = new QuestionValidationSchema();
export const submissionSchema = new SubmissionValidationSchema();