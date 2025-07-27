// Core type definitions for CodeNest platform

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
  submittedAt: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}