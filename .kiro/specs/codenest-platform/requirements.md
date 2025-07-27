# Requirements Document

## Introduction

CodeNest is a full-stack online coding platform designed to help users practice programming through adaptive difficulty levels, AI-generated questions, and gamification features. The platform provides a clean, modern interface similar to LeetCode with built-in compiler support, daily challenges, and streak tracking. It uses Firebase for backend services and Vercel for frontend deployment, creating a scalable and secure learning environment that adapts to each user's skill level.

## Requirements

### Requirement 1

**User Story:** As a new user, I want to authenticate and set up my profile with skill level preferences, so that I can receive personalized coding challenges appropriate to my experience.

#### Acceptance Criteria

1. WHEN a user visits the platform THEN the system SHALL provide Firebase Auth login/signup options including email and Google OAuth
2. WHEN a user completes first-time authentication THEN the system SHALL prompt for skill level selection (Beginner, Intermediate, Advanced)
3. WHEN a user selects their skill level THEN the system SHALL store user profile data in Firestore users collection with uid, level, preferredLanguage, theme, streak, and lastActiveDate
4. IF a user is returning THEN the system SHALL authenticate and load their existing profile data

### Requirement 2

**User Story:** As a user, I want an adaptive dashboard that shows content based on my skill level, so that I can focus on relevant practice problems and track my progress.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard THEN the system SHALL display a daily challenge appropriate to their skill level
2. WHEN displaying personalized topics THEN the system SHALL show Beginner topics (Loops, Strings, Lists), Intermediate topics (Recursion, Dictionaries, Sorting), or Advanced topics (Trees, DP, Graphs, Backtracking) based on user level
3. WHEN a user wants to practice THEN the system SHALL provide filtering options by topic and difficulty (Basic, Intermediate, Advanced)
4. WHEN displaying progress THEN the system SHALL show current streak count, XP progress bar, and last active date
5. IF leaderboard is enabled THEN the system SHALL display user rankings

### Requirement 3

**User Story:** As a user, I want AI-generated coding questions tailored to my skill level and practice history, so that I can continuously challenge myself with fresh, relevant problems.

#### Acceptance Criteria

1. WHEN generating questions THEN the system SHALL use Firebase Functions to securely call Google Gemini API
2. WHEN creating AI questions THEN the system SHALL consider user level, selected topic, and previous solving history for context-aware generation
3. WHEN storing AI questions THEN the system SHALL save them in questions collection with isAI: true flag
4. WHEN assigning daily challenges THEN the system SHALL use AI generation to create personalized daily problems
5. IF generation fails THEN the system SHALL fallback to curated static questions

### Requirement 4

**User Story:** As a user, I want a split-view coding interface similar to LeetCode, so that I can read problem descriptions while writing and testing my code efficiently.

#### Acceptance Criteria

1. WHEN accessing a coding problem THEN the system SHALL display left panel with question description, input/output examples, and constraints
2. WHEN coding THEN the system SHALL provide right panel with Monaco Editor supporting Python, C, C++, Java, and JavaScript
3. WHEN selecting language THEN the system SHALL update editor syntax highlighting and provide appropriate code templates
4. WHEN running code THEN the system SHALL display output panel showing test case results, runtime, stdout, and error messages
5. WHEN viewing results THEN the system SHALL show ✅/❌ icons with clear verdict messages

### Requirement 5

**User Story:** As a user, I want to run and submit my code with automatic test case evaluation, so that I can verify my solution correctness and receive immediate feedback.

#### Acceptance Criteria

1. WHEN clicking "Run Code" THEN the system SHALL compile and execute code against public test cases using Judge0 API via Firebase Functions
2. WHEN clicking "Submit" THEN the system SHALL evaluate code against both public and hidden test cases
3. WHEN evaluation completes THEN the system SHALL store submission results in submissions collection with timestamp, code, language, and verdict
4. WHEN displaying results THEN the system SHALL show execution time, memory usage, and detailed test case outcomes
5. IF compilation fails THEN the system SHALL display clear error messages and line numbers

### Requirement 6

**User Story:** As a user, I want to track my daily coding streak and earn XP points, so that I can stay motivated and monitor my consistent practice habits.

#### Acceptance Criteria

1. WHEN a user solves a question daily THEN the system SHALL increment their streak counter
2. WHEN a user is inactive for more than 24 hours THEN the system SHALL reset their streak to zero
3. WHEN displaying progress THEN the system SHALL show visual XP bar and current streak with fire icon
4. WHEN successful submission occurs THEN the system SHALL update Firestore user document with new streak and XP values
5. WHEN user returns after absence THEN the system SHALL check lastActiveDate and update streak accordingly

### Requirement 7

**User Story:** As a system administrator, I want a robust Firebase backend with cloud functions, so that the platform can handle user data, AI integration, and code evaluation securely and scalably.

#### Acceptance Criteria

1. WHEN storing data THEN the system SHALL use Firestore collections for users, questions, submissions, daily_challenges, and topics
2. WHEN generating questions THEN the system SHALL execute generateQuestion() Firebase Function to call Google Gemini
3. WHEN evaluating code THEN the system SHALL execute evaluateCode() Firebase Function to interface with Judge0
4. WHEN updating streaks THEN the system SHALL execute updateStreak() Firebase Function with time validation
5. WHEN handling requests THEN the system SHALL implement proper authentication and authorization for all functions

### Requirement 8

**User Story:** As a user, I want a modern, responsive interface with dark/light mode support, so that I can have a comfortable coding experience across different devices and lighting conditions.

#### Acceptance Criteria

1. WHEN using the platform THEN the system SHALL provide clean, minimalist UI built with TailwindCSS and Framer Motion
2. WHEN switching themes THEN the system SHALL toggle between dark and light modes and persist preference in user profile
3. WHEN loading content THEN the system SHALL display smooth transitions and skeleton loaders for better UX
4. WHEN accessing on mobile THEN the system SHALL provide responsive design with mobile-first approach
5. WHEN navigating THEN the system SHALL maintain consistent styling and smooth animations throughout

### Requirement 9

**User Story:** As a developer, I want the platform deployed on Vercel with proper environment configuration, so that the application is accessible, scalable, and maintainable in production.

#### Acceptance Criteria

1. WHEN deploying frontend THEN the system SHALL use Next.js framework optimized for Vercel deployment
2. WHEN managing secrets THEN the system SHALL use .env.local for environment variables and API keys
3. WHEN building THEN the system SHALL handle preview deployments and live production builds automatically
4. WHEN serving content THEN the system SHALL optimize for performance with Vercel's CDN and edge functions
5. IF using Firebase hosting THEN the system SHALL configure it only for static assets while Vercel handles main application