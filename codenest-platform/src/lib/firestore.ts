// Firestore service layer for database operations
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, CodingProblem, SubmissionDocument } from '@/types';

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
  async createProfile(uid: string, profileData: Omit<UserProfile, 'uid'>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await setDoc(userRef, {
      uid,
      ...profileData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  },

  async getProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  },

  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }
};

// Question operations
export const questionService = {
  async getQuestionsByDifficulty(difficulty: string, limitCount: number = 10): Promise<CodingProblem[]> {
    const q = query(
      collection(db, COLLECTIONS.QUESTIONS),
      where('difficulty', '==', difficulty),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CodingProblem));
  },

  async getQuestionById(id: string): Promise<CodingProblem | null> {
    const questionRef = doc(db, COLLECTIONS.QUESTIONS, id);
    const questionSnap = await getDoc(questionRef);
    
    if (questionSnap.exists()) {
      return { id: questionSnap.id, ...questionSnap.data() } as CodingProblem;
    }
    return null;
  }
};

// Submission operations
export const submissionService = {
  async createSubmission(submission: Omit<SubmissionDocument, 'id' | 'submittedAt'>): Promise<string> {
    const submissionRef = doc(collection(db, COLLECTIONS.SUBMISSIONS));
    await setDoc(submissionRef, {
      ...submission,
      submittedAt: Timestamp.now()
    });
    return submissionRef.id;
  },

  async getUserSubmissions(uid: string, limitCount: number = 20): Promise<SubmissionDocument[]> {
    const q = query(
      collection(db, COLLECTIONS.SUBMISSIONS),
      where('uid', '==', uid),
      orderBy('submittedAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubmissionDocument));
  }
};