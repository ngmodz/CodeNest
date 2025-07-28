import { QuestionDocument, Example, TestCase, ValidationError, ValidationResult, DIFFICULTY_LEVELS } from '@/types';

export function validateQuestionData(data: Partial<QuestionDocument>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate title
  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      errors.push({ field: 'title', message: 'Title is required and must be a string' });
    } else if (data.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters long' });
    } else if (data.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must be less than 200 characters' });
    }
  }

  // Validate description
  if (data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string') {
      errors.push({ field: 'description', message: 'Description is required and must be a string' });
    } else if (data.description.trim().length < 10) {
      errors.push({ field: 'description', message: 'Description must be at least 10 characters long' });
    } else if (data.description.length > 5000) {
      errors.push({ field: 'description', message: 'Description must be less than 5000 characters' });
    }
  }

  // Validate difficulty
  if (data.difficulty !== undefined) {
    if (!data.difficulty) {
      errors.push({ field: 'difficulty', message: 'Difficulty is required' });
    } else if (!DIFFICULTY_LEVELS.includes(data.difficulty)) {
      errors.push({ field: 'difficulty', message: 'Invalid difficulty level' });
    }
  }

  // Validate topic
  if (data.topic !== undefined) {
    if (!data.topic || typeof data.topic !== 'string') {
      errors.push({ field: 'topic', message: 'Topic is required and must be a string' });
    } else if (data.topic.trim().length < 2) {
      errors.push({ field: 'topic', message: 'Topic must be at least 2 characters long' });
    } else if (data.topic.length > 50) {
      errors.push({ field: 'topic', message: 'Topic must be less than 50 characters' });
    }
  }

  // Validate examples
  if (data.examples !== undefined) {
    if (!Array.isArray(data.examples)) {
      errors.push({ field: 'examples', message: 'Examples must be an array' });
    } else if (data.examples.length === 0) {
      errors.push({ field: 'examples', message: 'At least one example is required' });
    } else {
      data.examples.forEach((example, index) => {
        const exampleErrors = validateExample(example);
        exampleErrors.forEach(error => {
          errors.push({
            field: `examples[${index}].${error.field}`,
            message: error.message
          });
        });
      });
    }
  }

  // Validate constraints
  if (data.constraints !== undefined) {
    if (!Array.isArray(data.constraints)) {
      errors.push({ field: 'constraints', message: 'Constraints must be an array' });
    } else {
      const invalidConstraints = data.constraints.filter(constraint => 
        typeof constraint !== 'string' || !constraint.trim()
      );
      if (invalidConstraints.length > 0) {
        errors.push({ field: 'constraints', message: 'All constraints must be non-empty strings' });
      }
    }
  }

  // Validate test cases
  if (data.testCases !== undefined) {
    if (!Array.isArray(data.testCases)) {
      errors.push({ field: 'testCases', message: 'Test cases must be an array' });
    } else if (data.testCases.length === 0) {
      errors.push({ field: 'testCases', message: 'At least one test case is required' });
    } else {
      data.testCases.forEach((testCase, index) => {
        const testCaseErrors = validateTestCase(testCase);
        testCaseErrors.forEach(error => {
          errors.push({
            field: `testCases[${index}].${error.field}`,
            message: error.message
          });
        });
      });
    }
  }

  // Validate isAI flag
  if (data.isAI !== undefined && typeof data.isAI !== 'boolean') {
    errors.push({ field: 'isAI', message: 'isAI must be a boolean' });
  }

  // Validate createdBy (if provided)
  if (data.createdBy !== undefined) {
    if (typeof data.createdBy !== 'string' || !data.createdBy.trim()) {
      errors.push({ field: 'createdBy', message: 'createdBy must be a non-empty string' });
    }
  }

  // Validate tags
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push({ field: 'tags', message: 'Tags must be an array' });
    } else {
      const invalidTags = data.tags.filter(tag => 
        typeof tag !== 'string' || !tag.trim()
      );
      if (invalidTags.length > 0) {
        errors.push({ field: 'tags', message: 'All tags must be non-empty strings' });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateCompleteQuestion(question: Omit<QuestionDocument, 'id' | 'createdAt'>): ValidationResult {
  const requiredFields = ['title', 'description', 'difficulty', 'topic', 'examples', 'constraints', 'testCases', 'isAI', 'tags'];
  const errors: ValidationError[] = [];

  // Check for required fields
  for (const field of requiredFields) {
    if (!(field in question) || question[field as keyof typeof question] === undefined) {
      errors.push({ field, message: `${field} is required` });
    }
  }

  // If all required fields are present, validate the data
  if (errors.length === 0) {
    const validationResult = validateQuestionData(question);
    errors.push(...validationResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateExample(example: Example): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!example.input || typeof example.input !== 'string') {
    errors.push({ field: 'input', message: 'Input is required and must be a string' });
  }

  if (!example.output || typeof example.output !== 'string') {
    errors.push({ field: 'output', message: 'Output is required and must be a string' });
  }

  if (example.explanation !== undefined && typeof example.explanation !== 'string') {
    errors.push({ field: 'explanation', message: 'Explanation must be a string' });
  }

  return errors;
}

function validateTestCase(testCase: TestCase): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!testCase.input || typeof testCase.input !== 'string') {
    errors.push({ field: 'input', message: 'Input is required and must be a string' });
  }

  if (!testCase.expectedOutput || typeof testCase.expectedOutput !== 'string') {
    errors.push({ field: 'expectedOutput', message: 'Expected output is required and must be a string' });
  }

  if (typeof testCase.isHidden !== 'boolean') {
    errors.push({ field: 'isHidden', message: 'isHidden must be a boolean' });
  }

  return errors;
}

export function sanitizeQuestionData(data: Partial<QuestionDocument>): Partial<QuestionDocument> {
  const sanitized: Partial<QuestionDocument> = {};

  if (data.title && typeof data.title === 'string') {
    sanitized.title = data.title.trim();
  }

  if (data.description && typeof data.description === 'string') {
    sanitized.description = data.description.trim();
  }

  if (data.difficulty && DIFFICULTY_LEVELS.includes(data.difficulty)) {
    sanitized.difficulty = data.difficulty;
  }

  if (data.topic && typeof data.topic === 'string') {
    sanitized.topic = data.topic.trim();
  }

  if (Array.isArray(data.examples)) {
    sanitized.examples = data.examples
      .filter(example => example.input && example.output)
      .map(example => ({
        input: example.input.trim(),
        output: example.output.trim(),
        explanation: example.explanation?.trim()
      }));
  }

  if (Array.isArray(data.constraints)) {
    sanitized.constraints = data.constraints
      .filter(constraint => typeof constraint === 'string' && constraint.trim())
      .map(constraint => constraint.trim());
  }

  if (Array.isArray(data.testCases)) {
    sanitized.testCases = data.testCases
      .filter(testCase => testCase.input && testCase.expectedOutput)
      .map(testCase => ({
        input: testCase.input.trim(),
        expectedOutput: testCase.expectedOutput.trim(),
        isHidden: Boolean(testCase.isHidden)
      }));
  }

  if (typeof data.isAI === 'boolean') {
    sanitized.isAI = data.isAI;
  }

  if (data.createdBy && typeof data.createdBy === 'string') {
    sanitized.createdBy = data.createdBy.trim();
  }

  if (Array.isArray(data.tags)) {
    sanitized.tags = data.tags
      .filter(tag => typeof tag === 'string' && tag.trim())
      .map(tag => tag.trim().toLowerCase());
  }

  return sanitized;
}