// Core type definitions for CodeNest platform
import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface UserProfile {
  uid: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  preferredLanguage: 'Python' | 'JavaScript' | 'Java' | 'C++' | 'C';
  theme: 'light' | 'dark';
  streak: number;
  lastActiveDate: string;
  totalXP: number;
  solvedProblems: string[];
}

// Firestore document interfaces with timestamps
export interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  preferredLanguage: 'Python' | 'JavaScript' | 'Java' | 'C++' | 'C';
  theme: 'light' | 'dark';
  streak: number;
  lastActiveDate: Timestamp;
  totalXP: number;
  solvedProblems: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface CodingProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  topic: string;
  examples: Example[];
  constraints: string[];
  testCases: TestCase[];
  isAI: boolean;
  createdAt: string;
}

// Firestore document interface for questions
export interface QuestionDocument {
  id: string;
  title: string;
  description: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  topic: string;
  examples: Example[];
  constraints: string[];
  testCases: TestCase[];
  isAI: boolean;
  createdBy?: string; // uid if AI generated
  createdAt: Timestamp;
  tags: string[];
}

export interface TestResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  executionTime: number;
  memoryUsage: number;
  error?: string;
}

export interface SubmissionDocument {
  id: string;
  uid: string;
  problemId: string;
  code: string;
  language: string;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  executionTime?: number;
  memoryUsage?: number;
  testResults: TestResult[];
  submittedAt: Timestamp;
}

// Daily challenges document interface
export interface DailyChallengeDocument {
  id: string;
  date: string; // YYYY-MM-DD format
  beginnerProblem: string; // problem ID
  intermediateProblem: string;
  advancedProblem: string;
  createdAt: Timestamp;
}

// Topics document interface
export interface TopicDocument {
  id: string;
  name: string;
  description: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

// Database service interfaces
export interface DatabaseService<T> {
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  getById(id: string): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  query(filters: QueryFilter[]): Promise<T[]>;
}

export interface QueryFilter {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains';
  value: any;
}

export interface QueryOptions {
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  startAfter?: any;
}

// Validation interfaces
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Database operation result interfaces
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

export interface BatchResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: ErrorResponse[];
}

// Language mapping for Judge0
export interface LanguageMapping {
  [key: string]: {
    id: number;
    name: string;
    extension: string;
  };
}

// Constants for validation
export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const PROGRAMMING_LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++', 'C'] as const;
export const THEMES = ['light', 'dark'] as const;
export const DIFFICULTY_LEVELS = ['Basic', 'Intermediate', 'Advanced'] as const;
export const SUBMISSION_STATUSES = [
  'Accepted',
  'Wrong Answer', 
  'Time Limit Exceeded',
  'Runtime Error',
  'Compilation Error'
] as const;

export type SkillLevel = typeof SKILL_LEVELS[number];
export type ProgrammingLanguage = typeof PROGRAMMING_LANGUAGES[number];
export type Theme = typeof THEMES[number];
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];
export type SubmissionStatus = typeof SUBMISSION_STATUSES[number];