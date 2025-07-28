// Firestore service layer for database operations
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserProfile,
  UserDocument,
  CodingProblem,
  QuestionDocument,
  SubmissionDocument,
  DailyChallengeDocument,
  TopicDocument,
  QueryFilter,
  QueryOptions,
  DatabaseResult,
  BatchResult
} from '@/types';
import { validateCompleteProfile, validateProfileData, sanitizeProfileData } from '@/utils/profileValidation';
import { validateCompleteQuestion, validateQuestionData, sanitizeQuestionData } from '@/utils/questionValidation';
import { validateCompleteSubmission, sanitizeSubmissionData } from '@/utils/submissionValidation';
import { validateCompleteDailyChallenge, sanitizeDailyChallengeData } from '@/utils/challengeValidation';
import { validateCompleteTopic, sanitizeTopicData } from '@/utils/challengeValidation';
import { handleDatabaseError, withRetry, logError, AppError, NotFoundError, ValidationError } from '@/utils/errorHandling';

// Collection references
export const COLLECTIONS = {
  USERS: 'users',
  QUESTIONS: 'questions',
  SUBMISSIONS: 'submissions',
  DAILY_CHALLENGES: 'daily_challenges',
  TOPICS: 'topics'
} as const;



// User profile operations
export const userService = {
  async createProfile(uid: string, profileData: Omit<UserProfile, 'uid'>): Promise<DatabaseResult<void>> {
    try {
      // Validate the complete profile data
      const validation = validateCompleteProfile(profileData);
      if (!validation.isValid) {
        throw new ValidationError(
          `Profile validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          validation.errors
        );
      }

      // Sanitize the data
      const sanitizedData = sanitizeProfileData(profileData);

      const userRef = doc(db, COLLECTIONS.USERS, uid);
      const userData: UserDocument = {
        ...sanitizedData as Required<typeof sanitizedData>,
        uid,
        email: '', // Will be set by auth context
        lastActiveDate: typeof sanitizedData.lastActiveDate === 'string'
          ? Timestamp.fromDate(new Date(sanitizedData.lastActiveDate))
          : sanitizedData.lastActiveDate || Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await withRetry(() => setDoc(userRef, userData));
      return { success: true };
    } catch (error) {
      logError(error as Error, { operation: 'createProfile', uid });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'PROFILE_CREATE_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async getProfile(uid: string): Promise<DatabaseResult<UserProfile>> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      const userSnap = await withRetry(() => getDoc(userRef));

      if (userSnap.exists()) {
        const data = userSnap.data() as UserDocument;
        // Convert Firestore timestamps to ISO strings for consistency
        const profile: UserProfile = {
          uid: data.uid,
          level: data.level,
          preferredLanguage: data.preferredLanguage,
          theme: data.theme,
          streak: data.streak,
          lastActiveDate: data.lastActiveDate instanceof Timestamp
            ? data.lastActiveDate.toDate().toISOString()
            : data.lastActiveDate,
          totalXP: data.totalXP,
          solvedProblems: data.solvedProblems
        };
        return { success: true, data: profile };
      }

      throw new NotFoundError('User profile not found');
    } catch (error) {
      logError(error as Error, { operation: 'getProfile', uid });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'PROFILE_FETCH_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<DatabaseResult<void>> {
    try {
      // Validate the updates
      const validation = validateProfileData(updates);
      if (!validation.isValid) {
        throw new ValidationError(
          `Profile validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          validation.errors
        );
      }

      // Sanitize the updates
      const sanitizedUpdates = sanitizeProfileData(updates);

      if (Object.keys(sanitizedUpdates).length === 0) {
        throw new ValidationError('No valid updates provided');
      }

      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await withRetry(() => updateDoc(userRef, {
        ...sanitizedUpdates,
        updatedAt: Timestamp.now()
      }));

      return { success: true };
    } catch (error) {
      logError(error as Error, { operation: 'updateProfile', uid, updates });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'PROFILE_UPDATE_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async checkProfileExists(uid: string): Promise<boolean> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      const userSnap = await withRetry(() => getDoc(userRef));
      return userSnap.exists();
    } catch (error) {
      logError(error as Error, { operation: 'checkProfileExists', uid });
      return false;
    }
  },

  async deleteProfile(uid: string): Promise<DatabaseResult<void>> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await withRetry(() => deleteDoc(userRef));
      return { success: true };
    } catch (error) {
      logError(error as Error, { operation: 'deleteProfile', uid });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'PROFILE_DELETE_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};

// Question operations
export const questionService = {
  async createQuestion(questionData: Omit<QuestionDocument, 'id' | 'createdAt'>): Promise<DatabaseResult<string>> {
    try {
      const validation = validateCompleteQuestion(questionData);
      if (!validation.isValid) {
        throw new ValidationError(
          `Question validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          validation.errors
        );
      }

      const sanitizedData = sanitizeQuestionData(questionData);
      const questionRef = doc(collection(db, COLLECTIONS.QUESTIONS));

      const questionDoc: QuestionDocument = {
        ...sanitizedData as Required<typeof sanitizedData>,
        id: questionRef.id,
        createdAt: Timestamp.now()
      };

      await withRetry(() => setDoc(questionRef, questionDoc));
      return { success: true, data: questionRef.id };
    } catch (error) {
      logError(error as Error, { operation: 'createQuestion' });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'QUESTION_CREATE_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async getQuestionsByDifficulty(difficulty: string, limitCount: number = 10): Promise<DatabaseResult<CodingProblem[]>> {
    try {
      const q = query(
        collection(db, COLLECTIONS.QUESTIONS),
        where('difficulty', '==', difficulty),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await withRetry(() => getDocs(q));
      const questions = querySnapshot.docs.map(doc => {
        const data = doc.data() as QuestionDocument;
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          topic: data.topic,
          examples: data.examples,
          constraints: data.constraints,
          testCases: data.testCases,
          isAI: data.isAI,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt
        } as CodingProblem;
      });

      return { success: true, data: questions };
    } catch (error) {
      logError(error as Error, { operation: 'getQuestionsByDifficulty', difficulty, limitCount });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'QUESTIONS_FETCH_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async getQuestionById(id: string): Promise<DatabaseResult<CodingProblem>> {
    try {
      const questionRef = doc(db, COLLECTIONS.QUESTIONS, id);
      const questionSnap = await withRetry(() => getDoc(questionRef));

      if (questionSnap.exists()) {
        const data = questionSnap.data() as QuestionDocument;
        const question: CodingProblem = {
          id: questionSnap.id,
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          topic: data.topic,
          examples: data.examples,
          constraints: data.constraints,
          testCases: data.testCases,
          isAI: data.isAI,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt
        };
        return { success: true, data: question };
      }

      throw new NotFoundError('Question not found');
    } catch (error) {
      logError(error as Error, { operation: 'getQuestionById', id });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'QUESTION_FETCH_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async updateQuestion(id: string, updates: Partial<QuestionDocument>): Promise<DatabaseResult<void>> {
    try {
      const validation = validateQuestionData(updates);
      if (!validation.isValid) {
        throw new ValidationError(
          `Question validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          validation.errors
        );
      }

      const sanitizedUpdates = sanitizeQuestionData(updates);
      if (Object.keys(sanitizedUpdates).length === 0) {
        throw new ValidationError('No valid updates provided');
      }

      const questionRef = doc(db, COLLECTIONS.QUESTIONS, id);
      await withRetry(() => updateDoc(questionRef, sanitizedUpdates));

      return { success: true };
    } catch (error) {
      logError(error as Error, { operation: 'updateQuestion', id, updates });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'QUESTION_UPDATE_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async deleteQuestion(id: string): Promise<DatabaseResult<void>> {
    try {
      const questionRef = doc(db, COLLECTIONS.QUESTIONS, id);
      await withRetry(() => deleteDoc(questionRef));
      return { success: true };
    } catch (error) {
      logError(error as Error, { operation: 'deleteQuestion', id });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'QUESTION_DELETE_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async getQuestionsByTopic(topic: string, limitCount: number = 10): Promise<DatabaseResult<CodingProblem[]>> {
    try {
      const q = query(
        collection(db, COLLECTIONS.QUESTIONS),
        where('topic', '==', topic),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await withRetry(() => getDocs(q));
      const questions = querySnapshot.docs.map(doc => {
        const data = doc.data() as QuestionDocument;
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          topic: data.topic,
          examples: data.examples,
          constraints: data.constraints,
          testCases: data.testCases,
          isAI: data.isAI,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt
        } as CodingProblem;
      });

      return { success: true, data: questions };
    } catch (error) {
      logError(error as Error, { operation: 'getQuestionsByTopic', topic, limitCount });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'QUESTIONS_FETCH_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};

// Submission operations
export const submissionService = {
  async createSubmission(submission: Omit<SubmissionDocument, 'id' | 'submittedAt'>): Promise<DatabaseResult<string>> {
    try {
      const validation = validateCompleteSubmission(submission);
      if (!validation.isValid) {
        throw new ValidationError(
          `Submission validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          validation.errors
        );
      }

      const sanitizedData = sanitizeSubmissionData(submission);
      const submissionRef = doc(collection(db, COLLECTIONS.SUBMISSIONS));

      const submissionDoc: SubmissionDocument = {
        ...sanitizedData as Required<typeof sanitizedData>,
        id: submissionRef.id,
        submittedAt: Timestamp.now()
      };

      await withRetry(() => setDoc(submissionRef, submissionDoc));
      return { success: true, data: submissionRef.id };
    } catch (error) {
      logError(error as Error, { operation: 'createSubmission' });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'SUBMISSION_CREATE_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async getUserSubmissions(uid: string, limitCount: number = 20): Promise<DatabaseResult<SubmissionDocument[]>> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBMISSIONS),
        where('uid', '==', uid),
        orderBy('submittedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await withRetry(() => getDocs(q));
      const submissions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SubmissionDocument));

      return { success: true, data: submissions };
    } catch (error) {
      logError(error as Error, { operation: 'getUserSubmissions', uid, limitCount });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'SUBMISSIONS_FETCH_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async getSubmissionById(id: string): Promise<DatabaseResult<SubmissionDocument>> {
    try {
      const submissionRef = doc(db, COLLECTIONS.SUBMISSIONS, id);
      const submissionSnap = await withRetry(() => getDoc(submissionRef));

      if (submissionSnap.exists()) {
        const submission = { id: submissionSnap.id, ...submissionSnap.data() } as SubmissionDocument;
        return { success: true, data: submission };
      }

      throw new NotFoundError('Submission not found');
    } catch (error) {
      logError(error as Error, { operation: 'getSubmissionById', id });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'SUBMISSION_FETCH_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async getProblemSubmissions(problemId: string, limitCount: number = 50): Promise<DatabaseResult<SubmissionDocument[]>> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBMISSIONS),
        where('problemId', '==', problemId),
        orderBy('submittedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await withRetry(() => getDocs(q));
      const submissions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SubmissionDocument));

      return { success: true, data: submissions };
    } catch (error) {
      logError(error as Error, { operation: 'getProblemSubmissions', problemId, limitCount });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'SUBMISSIONS_FETCH_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};

// Daily challenge operations
export const dailyChallengeService = {
  async createDailyChallenge(challengeData: Omit<DailyChallengeDocument, 'id' | 'createdAt'>): Promise<DatabaseResult<string>> {
    try {
      const validation = validateCompleteDailyChallenge(challengeData);
      if (!validation.isValid) {
        throw new ValidationError(
          `Daily challenge validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          validation.errors
        );
      }

      const sanitizedData = sanitizeDailyChallengeData(challengeData);
      const challengeRef = doc(collection(db, COLLECTIONS.DAILY_CHALLENGES));

      const challengeDoc: DailyChallengeDocument = {
        ...sanitizedData as Required<typeof sanitizedData>,
        id: challengeRef.id,
        createdAt: Timestamp.now()
      };

      await withRetry(() => setDoc(challengeRef, challengeDoc));
      return { success: true, data: challengeRef.id };
    } catch (error) {
      logError(error as Error, { operation: 'createDailyChallenge' });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'CHALLENGE_CREATE_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async getDailyChallengeByDate(date: string): Promise<DatabaseResult<DailyChallengeDocument>> {
    try {
      const q = query(
        collection(db, COLLECTIONS.DAILY_CHALLENGES),
        where('date', '==', date),
        limit(1)
      );

      const querySnapshot = await withRetry(() => getDocs(q));

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const challenge = { id: doc.id, ...doc.data() } as DailyChallengeDocument;
        return { success: true, data: challenge };
      }

      throw new NotFoundError('Daily challenge not found for this date');
    } catch (error) {
      logError(error as Error, { operation: 'getDailyChallengeByDate', date });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'CHALLENGE_FETCH_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};

// Topic operations
export const topicService = {
  async createTopic(topicData: Omit<TopicDocument, 'id' | 'createdAt'>): Promise<DatabaseResult<string>> {
    try {
      const validation = validateCompleteTopic(topicData);
      if (!validation.isValid) {
        throw new ValidationError(
          `Topic validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          validation.errors
        );
      }

      const sanitizedData = sanitizeTopicData(topicData);
      const topicRef = doc(collection(db, COLLECTIONS.TOPICS));

      const topicDoc: TopicDocument = {
        ...sanitizedData as Required<typeof sanitizedData>,
        id: topicRef.id,
        createdAt: Timestamp.now()
      };

      await withRetry(() => setDoc(topicRef, topicDoc));
      return { success: true, data: topicRef.id };
    } catch (error) {
      logError(error as Error, { operation: 'createTopic' });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'TOPIC_CREATE_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  async getTopicsBySkillLevel(skillLevel: string): Promise<DatabaseResult<TopicDocument[]>> {
    try {
      const q = query(
        collection(db, COLLECTIONS.TOPICS),
        where('skillLevel', '==', skillLevel),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );

      const querySnapshot = await withRetry(() => getDocs(q));
      const topics = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TopicDocument));

      return { success: true, data: topics };
    } catch (error) {
      logError(error as Error, { operation: 'getTopicsBySkillLevel', skillLevel });
      return {
        success: false,
        error: {
          code: (error as AppError).code || 'TOPICS_FETCH_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};

// Batch operations
export const batchService = {
  async batchCreate<T extends { id: string }>(
    collectionName: string,
    documents: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<BatchResult> {
    const batch = writeBatch(db);
    const results: string[] = [];

    try {
      for (const docData of documents) {
        const docRef = doc(collection(db, collectionName));
        const docWithMeta = {
          ...docData,
          id: docRef.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        batch.set(docRef, docWithMeta);
        results.push(docRef.id);
      }

      await withRetry(() => batch.commit());

      return {
        success: true,
        successCount: results.length,
        failureCount: 0,
        errors: []
      };
    } catch (error) {
      logError(error as Error, { operation: 'batchCreate', collectionName, count: documents.length });
      return {
        success: false,
        successCount: 0,
        failureCount: documents.length,
        errors: [{
          code: (error as AppError).code || 'BATCH_CREATE_ERROR',
          message: (error as Error).message,
          timestamp: new Date().toISOString()
        }]
      };
    }
  }
};