# Admin Panel Documentation

## Overview

The CodeNest admin panel provides a comprehensive interface for generating, previewing, editing, and managing coding questions using AI technology.

## Features

### 🤖 AI Question Generator
- **OpenRouter Integration**: Uses DeepSeek Coder and Qwen Code models for high-quality question generation
- **Difficulty Levels**: Support for Beginner, Intermediate, and Advanced levels
- **Topic-Based Generation**: Generates questions based on specific programming topics
- **Previous Problems Avoidance**: Can avoid generating questions similar to existing ones

### 👁️ Question Preview & Editor
- **Real-time Preview**: See generated questions before saving
- **Inline Editing**: Edit question title, description, examples, and test cases
- **Validation**: Automatic validation of question structure and required fields
- **Test Case Management**: Manage both public and hidden test cases

### 💾 Question Storage
- **Firestore Integration**: All questions stored securely in Firebase Firestore
- **Bulk Operations**: Select and delete multiple questions at once
- **Publishing System**: Mark questions as published for use in the platform
- **Search & Filter**: Find questions by title, topic, difficulty, or publish status

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# OpenRouter API (required for AI generation)
OPENROUTER_API_KEY=your-openrouter-api-key

# Firebase Admin SDK (required for authentication and storage)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-firebase-private-key\n-----END PRIVATE KEY-----"

# Optional: Site URL for API referrer
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. OpenRouter API Setup

1. Sign up at [OpenRouter.ai](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Add the API key to your `.env.local` file
4. The system will automatically use DeepSeek Coder as the primary model

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Generate a service account key for Firebase Admin SDK
4. Add the credentials to your `.env.local` file

### 4. Access Control

Currently, the admin panel uses a simple email-based access control:
- Users with "admin" or "test" in their email address get access
- For production, implement proper role-based access control

## Usage Guide

### Generating Questions

1. Navigate to `/admin` in your browser
2. Select the "Question Generator" tab
3. Choose difficulty level (Beginner, Intermediate, Advanced)
4. Select a topic from the dropdown
5. Optionally add previous problem titles to avoid duplicates
6. Click "Generate Question"

### Preview & Editing

1. After generation, you'll be automatically redirected to the preview tab
2. Review the generated question structure
3. Click "Edit Question" to make changes
4. Modify any field as needed
5. Click "Save Question" to store in the database

### Managing Questions

1. Go to the "Question Storage" tab
2. Use search and filters to find specific questions
3. Select questions using checkboxes for bulk operations
4. Publish questions to make them available to users
5. Delete questions that are no longer needed

## API Endpoints

### POST /api/generateQuestion
Generates a new coding question using AI.

**Request:**
```json
{
  "userLevel": "Beginner" | "Intermediate" | "Advanced",
  "topic": "string",
  "previousProblems": ["string[]"] // optional
}
```

**Response:**
```json
{
  "success": true,
  "question": {
    "title": "string",
    "description": "string",
    "difficulty": "Basic" | "Intermediate" | "Advanced",
    "topic": "string",
    "examples": [...],
    "constraints": [...],
    "testCases": [...]
  },
  "metadata": {...}
}
```

### GET /api/questions
Retrieves all stored questions.

### POST /api/questions  
Saves a new question to the database.

### DELETE /api/questions/bulk-delete
Deletes multiple questions at once.

### PATCH /api/questions/{id}/publish
Publishes a specific question.

## Troubleshooting

### Common Issues

1. **"AI service configuration error"**
   - Check that your OPENROUTER_API_KEY is correctly set
   - Verify you have credits in your OpenRouter account

2. **"Authentication required"**
   - Ensure you're logged in to the application
   - Check your Firebase configuration

3. **"Access Denied"**
   - Make sure your email contains "admin" or "test"
   - For production, implement proper role checks

### Performance Tips

1. **Question Generation**: Each AI request can take 5-30 seconds depending on model availability
2. **Batch Operations**: Use bulk delete for removing multiple questions efficiently
3. **Search**: Use specific filters to reduce query time on large question sets

## Development

### Running Tests

```bash
# Test the question generator component
npm test -- src/components/admin/__tests__/QuestionGenerator.test.tsx

# Test API endpoints (requires proper environment setup)
npm test -- src/app/api/questions/__tests__/route.test.ts
```

### Adding New Topics

1. Edit `TOPIC_PROMPTS` in `src/app/api/generateQuestion/route.ts`
2. Update the topic lists in `QuestionGenerator.tsx`
3. Test generation with the new topics

### Customizing AI Prompts

Modify the `generatePrompt` function in `src/app/api/generateQuestion/route.ts` to:
- Change question format requirements
- Add new difficulty levels
- Modify AI instructions for specific topics

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Authentication**: All admin endpoints require valid Firebase ID tokens
3. **Validation**: All user inputs are validated and sanitized
4. **Rate Limiting**: Consider implementing rate limiting for AI generation endpoints

## Future Enhancements

- [ ] Advanced role-based access control
- [ ] Question quality scoring and feedback
- [ ] Automated testing of generated code solutions
- [ ] Integration with multiple AI providers for fallback
- [ ] Question template system for consistent formatting
- [ ] Analytics and usage tracking for generated questions
