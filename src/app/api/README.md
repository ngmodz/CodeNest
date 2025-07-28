# CodeNest Platform API Documentation

This document describes the API endpoints available in the CodeNest platform.

## 📚 Documentation Index

- **[API Documentation](README.md)** - This file (endpoint reference)
- **[Security Documentation](SECURITY.md)** - Security architecture and best practices
- **[Architecture Documentation](ARCHITECTURE.md)** - System design and implementation details

## 🏗️ Architecture Overview

The CodeNest API is built using Next.js App Router with a focus on security, scalability, and maintainability. The API consists of 3 main endpoints optimized for Vercel Free Plan deployment (under 12 route limit).

### Current API Routes (3/12 used)
1. `/api/compile` - Code compilation and execution
2. `/api/generateQuestion` - AI question generation using OpenRouter
3. `/api/streak` - Streak and XP management

## Authentication

All API endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Rate Limiting

- **Limit**: 100 requests per 15-minute window per IP address
- **Response**: 429 Too Many Requests when limit exceeded

## Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'`

## API Endpoints

### 1. Code Compilation - `/api/compile`

Execute code against test cases using Judge0.

**Method**: `POST`

**Request Body**:
```json
{
  "code": "print('Hello, World!')",
  "language": "python",
  "testCases": [
    {
      "input": "",
      "expectedOutput": "Hello, World!",
      "isHidden": false
    }
  ],
  "action": "run"
}
```

**Parameters**:
- `code` (string, required): Source code to execute
- `language` (string, required): Programming language (`python`, `java`, `javascript`, `cpp`, `c`)
- `testCases` (array, required): Test cases to run against
- `action` (string, required): `"run"` for sample tests, `"submit"` for all tests

**Response**:
```json
{
  "verdict": "Accepted",
  "results": [
    {
      "input": "",
      "expectedOutput": "Hello, World!",
      "actualOutput": "Hello, World!",
      "passed": true,
      "executionTime": 0.001,
      "memoryUsage": 1024,
      "error": null,
      "status": "Accepted"
    }
  ],
  "totalTests": 1,
  "passedTests": 1,
  "executionTime": 0.001,
  "memoryUsage": 1024
}
```

**Error Responses**:
- `400`: Invalid request parameters
- `401`: Authentication required
- `500`: Compilation/execution error

---

### 2. AI Question Generation - `/api/generateQuestion`

Generate coding questions using OpenRouter AI (DeepSeek Coder / Qwen models).

**Method**: `POST`

**Request Body**:
```json
{
  "userLevel": "Beginner",
  "topic": "Lists",
  "previousProblems": ["Two Sum", "Valid Parentheses"]
}
```

**Parameters**:
- `userLevel` (string, required): `"Beginner"`, `"Intermediate"`, or `"Advanced"`
- `topic` (string, required): Topic for the question
- `previousProblems` (array, optional): Previously solved problems to avoid duplicates

**Response**:
```json
{
  "success": true,
  "question": {
    "title": "Find Maximum Element",
    "description": "Given an array of integers, find the maximum element.",
    "difficulty": "Basic",
    "topic": "Lists",
    "examples": [
      {
        "input": "[1, 3, 2, 5, 4]",
        "output": "5",
        "explanation": "5 is the largest number in the array"
      }
    ],
    "constraints": [
      "1 <= array.length <= 1000",
      "-1000 <= array[i] <= 1000"
    ],
    "testCases": [
      {
        "input": "[1, 3, 2, 5, 4]",
        "expectedOutput": "5",
        "isHidden": false
      }
    ],
    "hints": [
      "Iterate through the array once",
      "Keep track of the maximum value seen so far"
    ],
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)"
  },
  "metadata": {
    "generatedAt": "2025-01-28T10:00:00.000Z",
    "userLevel": "Beginner",
    "topic": "Lists",
    "totalTestCases": 5,
    "publicTestCases": 2,
    "hiddenTestCases": 3
  }
}
```

**Error Responses**:
- `400`: Invalid request parameters
- `401`: Authentication required
- `429`: Rate limit exceeded (AI service)
- `500`: AI generation error

---

### 3. Streak Management - `/api/streak`

Manage user streaks and XP points.

#### POST - Update Streak

**Method**: `POST`

**Request Body**:
```json
{
  "activityType": "problem_solved",
  "points": 15
}
```

**Parameters**:
- `activityType` (string, required): `"problem_solved"`, `"daily_challenge"`, or `"practice_session"`
- `points` (number, optional): Custom points override

**Response**:
```json
{
  "success": true,
  "data": {
    "currentStreak": 5,
    "longestStreak": 10,
    "lastActivityDate": "2025-01-28T10:00:00.000Z",
    "totalXP": 150,
    "dailyXP": 25,
    "streakMultiplier": 1.1,
    "achievements": ["streak_3", "xp_100"],
    "earnedXP": 11,
    "baseXP": 10,
    "streakBonus": 1,
    "streakBroken": false,
    "streakContinued": true,
    "newAchievements": [],
    "isNewDay": true
  },
  "message": "Great job! Your streak is now 5 days!"
}
```

#### GET - Retrieve Streak Data

**Method**: `GET`

**Response**:
```json
{
  "success": true,
  "data": {
    "currentStreak": 5,
    "longestStreak": 10,
    "lastActivityDate": "2025-01-28T10:00:00.000Z",
    "totalXP": 150,
    "dailyXP": 25,
    "streakMultiplier": 1.1,
    "achievements": ["streak_3", "xp_100"]
  }
}
```

**Error Responses**:
- `400`: Invalid activity type
- `401`: Authentication required
- `403`: Access denied to user data
- `404`: User not found
- `500`: Database error

---

## XP Rewards System

### Base XP Values
- `problem_solved`: 10 XP
- `daily_challenge`: 25 XP
- `practice_session`: 5 XP

### Streak Multipliers
- 0-2 days: 1.0x (no bonus)
- 3-6 days: 1.1x (10% bonus)
- 7-13 days: 1.2x (20% bonus)
- 14-29 days: 1.3x (30% bonus)
- 30-59 days: 1.5x (50% bonus)
- 60-99 days: 1.7x (70% bonus)
- 100+ days: 2.0x (100% bonus)

### Achievements
- **Streak Milestones**: 3, 7, 14, 30, 60, 100 days
- **XP Milestones**: 100, 500, 1000, 2500, 5000, 10000 points
- **Longest Streak**: 10, 25, 50, 100 days

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)",
  "timestamp": "2025-01-28T10:00:00.000Z"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

---

## Environment Variables

Required environment variables for API functionality:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# Judge0 API
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-rapidapi-key
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com

# OpenRouter AI
OPENROUTER_API_KEY=your-openrouter-api-key
```

---

## Vercel Deployment Considerations

### Free Plan Optimization
- **API Route Limit**: ✅ 3/12 routes used (well under limit)
- **Function Timeout**: 10 seconds (sufficient for all endpoints)
- **Memory Limit**: 1024MB (optimized for efficient memory usage)
- **Cold Start**: Minimized through singleton patterns and efficient initialization

### Performance Optimizations
- **Firebase Admin SDK**: Singleton initialization to reduce cold start time
- **Rate Limiting**: In-memory store for fast access (production should use Redis)
- **Response Caching**: Security headers and response formatting optimized
- **Error Handling**: Efficient error processing with minimal overhead

### Scalability Considerations
- **Stateless Design**: All endpoints are stateless for horizontal scaling
- **Resource Management**: Automatic cleanup of expired rate limit entries
- **Connection Pooling**: Firebase Admin SDK handles connection pooling efficiently

---

## Testing

Each API endpoint includes comprehensive test coverage:

```bash
# Run all API tests
npm test -- --testPathPattern=api

# Run specific endpoint tests
npm test -- src/app/api/compile/__tests__
npm test -- src/app/api/generateQuestion/__tests__
npm test -- src/app/api/streak/__tests__
```

---

## Security Best Practices

1. **Authentication**: All endpoints require valid Firebase ID tokens
2. **Input Validation**: Request bodies are validated and sanitized
3. **Rate Limiting**: Prevents abuse with configurable limits
4. **Security Headers**: Added to all responses
5. **Error Handling**: No sensitive information leaked in error messages
6. **CORS**: Configured for production domains only