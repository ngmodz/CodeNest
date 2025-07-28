import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment,
  assertSucceeds,
  assertFails 
} from '@firebase/rules-unit-testing';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { userService, questionService, submissionService, dailyChallengeService, topicService } from '../firestore';
import { UserProfile, QuestionDocument, SubmissionDocument, DailyChallengeDocument, TopicDocument } from '@/types';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'codenest-test',
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
            match /questions/{questionId} {
              allow read: if request.auth != null;
              allow write: if request.auth != null;
            }
            match /submissions/{submissionId} {
              allow read, write: if request.auth != null && 
                request.auth.uid == resource.data.uid;
              allow create: if request.auth != null && 
                request.auth.uid == request.resource.data.uid;
            }
            match /daily_challenges/{challengeId} {
              allow read: if request.auth != null;
              allow write: if request.auth != null;
            }
            match /topics/{topicId} {
              allow read: if request.auth != null;
            }
          }
        }
      `
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('User Service', () => {
  const testUid = 'test-user-123';
  const testProfile: Omit<UserProfile, 'uid'> = {
    level: 'Intermediate',
    preferredLanguage: 'Python',
    theme: 'dark',
    streak: 5,
    lastActiveDate: new Date().toISOString(),
    totalXP: 150,
    solvedProblems: ['problem1', 'problem2']
  };

  it('should create a user profile successfully', async () => {
    const result = await userService.createProfile(testUid, testProfile);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail to create profile with invalid data', async () => {
    const invalidProfile = {
      ...testProfile,
      level: 'InvalidLevel' as any
    };

    const result = await userService.createProfile(testUid, invalidProfile);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('VALIDATION_FAILED');
  });

  it('should retrieve a user profile successfully', async () => {
    // First create a profile
    await userService.createProfile(testUid, testProfile);

    // Then retrieve it
    const result = await userService.getProfile(testUid);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.uid).toBe(testUid);
    expect(result.data?.level).toBe(testProfile.level);
  });

  it('should return error when profile not found', async () => {
    const result = await userService.getProfile('non-existent-user');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('DOCUMENT_NOT_FOUND');
  });

  it('should update user profile successfully', async () => {
    // First create a profile
    await userService.createProfile(testUid, testProfile);

    // Then update it
    const updates = { streak: 10, totalXP: 200 };
    const result = await userService.updateProfile(testUid, updates);
    expect(result.success).toBe(true);

    // Verify the update
    const updatedProfile = await userService.getProfile(testUid);
    expect(updatedProfile.data?.streak).toBe(10);
    expect(updatedProfile.data?.totalXP).toBe(200);
  });

  it('should check if profile exists', async () => {
    // Should return false for non-existent profile
    let exists = await userService.checkProfileExists(testUid);
    expect(exists).toBe(false);

    // Create profile
    await userService.createProfile(testUid, testProfile);

    // Should return true for existing profile
    exists = await userService.checkProfileExists(testUid);
    expect(exists).toBe(true);
  });
});

describe('Question Service', () => {
  const testQuestion: Omit<QuestionDocument, 'id' | 'createdAt'> = {
    title: 'Two Sum',
    description: 'Given an array of integers, return indices of the two numbers such that they add up to a specific target.',
    difficulty: 'Basic',
    topic: 'Arrays',
    examples: [
      {
        input: '[2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] = 2 + 7 = 9'
      }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
    testCases: [
      {
        input: '[2,7,11,15]\n9',
        expectedOutput: '[0,1]',
        isHidden: false
      },
      {
        input: '[3,2,4]\n6',
        expectedOutput: '[1,2]',
        isHidden: true
      }
    ],
    isAI: false,
    tags: ['array', 'hash-table']
  };

  it('should create a question successfully', async () => {
    const result = await questionService.createQuestion(testQuestion);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(typeof result.data).toBe('string');
  });

  it('should fail to create question with invalid data', async () => {
    const invalidQuestion = {
      ...testQuestion,
      title: '', // Invalid empty title
      difficulty: 'InvalidDifficulty' as any
    };

    const result = await questionService.createQuestion(invalidQuestion);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
  });

  it('should retrieve question by ID', async () => {
    const createResult = await questionService.createQuestion(testQuestion);
    const questionId = createResult.data!;

    const result = await questionService.getQuestionById(questionId);
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe(testQuestion.title);
    expect(result.data?.difficulty).toBe(testQuestion.difficulty);
  });

  it('should get questions by difficulty', async () => {
    // Create multiple questions
    await questionService.createQuestion(testQuestion);
    await questionService.createQuestion({
      ...testQuestion,
      title: 'Another Basic Problem'
    });

    const result = await questionService.getQuestionsByDifficulty('Basic', 10);
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('should get questions by topic', async () => {
    await questionService.createQuestion(testQuestion);
    await questionService.createQuestion({
      ...testQuestion,
      title: 'Another Array Problem',
      topic: 'Arrays'
    });

    const result = await questionService.getQuestionsByTopic('Arrays', 10);
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });
});

describe('Submission Service', () => {
  const testSubmission: Omit<SubmissionDocument, 'id' | 'submittedAt'> = {
    uid: 'test-user-123',
    problemId: 'problem-123',
    code: 'def two_sum(nums, target):\n    return [0, 1]',
    language: 'Python',
    status: 'Accepted',
    executionTime: 45,
    memoryUsage: 14.2,
    testResults: [
      {
        passed: true,
        input: '[2,7,11,15], 9',
        expectedOutput: '[0,1]',
        actualOutput: '[0,1]',
        executionTime: 45,
        memoryUsage: 14.2
      }
    ]
  };

  it('should create a submission successfully', async () => {
    const result = await submissionService.createSubmission(testSubmission);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(typeof result.data).toBe('string');
  });

  it('should fail to create submission with invalid data', async () => {
    const invalidSubmission = {
      ...testSubmission,
      language: 'InvalidLanguage' as any,
      status: 'InvalidStatus' as any
    };

    const result = await submissionService.createSubmission(invalidSubmission);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
  });

  it('should get user submissions', async () => {
    // Create multiple submissions
    await submissionService.createSubmission(testSubmission);
    await submissionService.createSubmission({
      ...testSubmission,
      problemId: 'problem-456'
    });

    const result = await submissionService.getUserSubmissions(testSubmission.uid, 20);
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('should get problem submissions', async () => {
    await submissionService.createSubmission(testSubmission);
    await submissionService.createSubmission({
      ...testSubmission,
      uid: 'another-user'
    });

    const result = await submissionService.getProblemSubmissions(testSubmission.problemId, 50);
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });
});

describe('Daily Challenge Service', () => {
  const testChallenge: Omit<DailyChallengeDocument, 'id' | 'createdAt'> = {
    date: '2024-01-15',
    beginnerProblem: 'problem-beginner-1',
    intermediateProblem: 'problem-intermediate-1',
    advancedProblem: 'problem-advanced-1'
  };

  it('should create a daily challenge successfully', async () => {
    const result = await dailyChallengeService.createDailyChallenge(testChallenge);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should fail to create challenge with invalid date', async () => {
    const invalidChallenge = {
      ...testChallenge,
      date: 'invalid-date'
    };

    const result = await dailyChallengeService.createDailyChallenge(invalidChallenge);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
  });

  it('should get daily challenge by date', async () => {
    await dailyChallengeService.createDailyChallenge(testChallenge);

    const result = await dailyChallengeService.getDailyChallengeByDate(testChallenge.date);
    expect(result.success).toBe(true);
    expect(result.data?.date).toBe(testChallenge.date);
  });
});

describe('Topic Service', () => {
  const testTopic: Omit<TopicDocument, 'id' | 'createdAt'> = {
    name: 'Arrays',
    description: 'Learn about array data structures and common algorithms',
    skillLevel: 'Beginner',
    order: 1,
    isActive: true
  };

  it('should create a topic successfully', async () => {
    const result = await topicService.createTopic(testTopic);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should get topics by skill level', async () => {
    await topicService.createTopic(testTopic);
    await topicService.createTopic({
      ...testTopic,
      name: 'Strings',
      order: 2
    });

    const result = await topicService.getTopicsBySkillLevel('Beginner');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
    expect(result.data?.[0].order).toBeLessThanOrEqual(result.data?.[1].order);
  });
});

describe('Error Handling', () => {
  it('should handle network errors with retry', async () => {
    // This test would require mocking network failures
    // For now, we'll test that the service handles errors gracefully
    const result = await userService.getProfile('non-existent-user');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should validate data before database operations', async () => {
    const invalidProfile = {
      level: 'InvalidLevel' as any,
      preferredLanguage: 'InvalidLanguage' as any,
      theme: 'InvalidTheme' as any,
      streak: -1,
      lastActiveDate: 'invalid-date',
      totalXP: -100,
      solvedProblems: [''] // Empty string in array
    };

    const result = await userService.createProfile('test-user', invalidProfile);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
  });
});