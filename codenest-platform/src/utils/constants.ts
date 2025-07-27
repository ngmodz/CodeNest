// Application constants
export const SKILL_LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
} as const;

export const PROGRAMMING_LANGUAGES = {
  PYTHON: 'Python',
  JAVASCRIPT: 'JavaScript',
  JAVA: 'Java',
  CPP: 'C++',
  C: 'C'
} as const;

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
} as const;

export const DIFFICULTY_LEVELS = {
  BASIC: 'Basic',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
} as const;

export const SUBMISSION_STATUS = {
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILATION_ERROR: 'Compilation Error'
} as const;

// Topic mappings by skill level
export const TOPICS_BY_LEVEL = {
  [SKILL_LEVELS.BEGINNER]: ['Loops', 'Strings', 'Lists', 'Basic Math'],
  [SKILL_LEVELS.INTERMEDIATE]: ['Recursion', 'Dictionaries', 'Sorting', 'Binary Search'],
  [SKILL_LEVELS.ADVANCED]: ['Trees', 'Dynamic Programming', 'Graphs', 'Backtracking']
} as const;

// Language IDs for Judge0 API
export const JUDGE0_LANGUAGE_IDS = {
  [PROGRAMMING_LANGUAGES.PYTHON]: 71,
  [PROGRAMMING_LANGUAGES.JAVASCRIPT]: 63,
  [PROGRAMMING_LANGUAGES.JAVA]: 62,
  [PROGRAMMING_LANGUAGES.CPP]: 54,
  [PROGRAMMING_LANGUAGES.C]: 50
} as const;