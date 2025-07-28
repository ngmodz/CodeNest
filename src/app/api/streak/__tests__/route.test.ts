import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user' }),
  })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
      })),
    })),
    runTransaction: jest.fn(),
  })),
}));

describe('/api/streak', () => {
  let mockFirestore: any;
  let mockTransaction: jest.Mock;
  let mockUserDoc: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { getFirestore } = require('firebase-admin/firestore');
    mockFirestore = getFirestore();
    mockTransaction = mockFirestore.runTransaction;
    mockUserDoc = {
      exists: true,
      data: jest.fn(),
    };
    
    mockFirestore.collection().doc().get.mockResolvedValue(mockUserDoc);
  });

  const createRequest = (body: any, token = 'valid-token') => {
    return new NextRequest('http://localhost:3000/api/streak', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  const createGetRequest = (token = 'valid-token') => {
    return new NextRequest('http://localhost:3000/api/streak', {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${token}`,
      },
    });
  };

  describe('POST /api/streak', () => {
    it('should reject requests without authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/streak', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing or invalid authorization header');
    });

    it('should validate required fields', async () => {
      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required field: activityType');
    });

    it('should validate activity type', async () => {
      const request = createRequest({
        activityType: 'invalid_activity',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid activityType');
    });

    it('should start a new streak for first-time user', async () => {
      const mockResult = {
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date().toISOString(),
        totalXP: 10,
        dailyXP: 10,
        streakMultiplier: 1.0,
        achievements: [],
        earnedXP: 10,
        baseXP: 10,
        streakBonus: 0,
        streakBroken: false,
        streakContinued: false,
        newAchievements: [],
        isNewDay: true,
      };

      mockTransaction.mockResolvedValue(mockResult);

      const request = createRequest({
        activityType: 'problem_solved',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.currentStreak).toBe(1);
      expect(data.data.earnedXP).toBe(10);
    });

    it('should continue streak on consecutive day', async () => {
      const mockResult = {
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: new Date().toISOString(),
        totalXP: 55,
        dailyXP: 11,
        streakMultiplier: 1.1,
        achievements: ['streak_3'],
        earnedXP: 11,
        baseXP: 10,
        streakBonus: 1,
        streakBroken: false,
        streakContinued: true,
        newAchievements: [],
        isNewDay: true,
      };

      mockTransaction.mockResolvedValue(mockResult);

      const request = createRequest({
        activityType: 'problem_solved',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.currentStreak).toBe(5);
      expect(data.data.streakMultiplier).toBe(1.1);
      expect(data.data.streakBonus).toBe(1);
      expect(data.message).toContain('Your streak is now 5 days!');
    });

    it('should break streak after gap in activity', async () => {
      const mockResult = {
        currentStreak: 1,
        longestStreak: 10,
        lastActivityDate: new Date().toISOString(),
        totalXP: 110,
        dailyXP: 10,
        streakMultiplier: 1.0,
        achievements: ['streak_7'],
        earnedXP: 10,
        baseXP: 10,
        streakBonus: 0,
        streakBroken: true,
        streakContinued: false,
        newAchievements: [],
        isNewDay: true,
      };

      mockTransaction.mockResolvedValue(mockResult);

      const request = createRequest({
        activityType: 'problem_solved',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.streakBroken).toBe(true);
      expect(data.message).toContain('Streak was broken');
    });

    it('should award achievements for milestones', async () => {
      const mockResult = {
        currentStreak: 7,
        longestStreak: 7,
        lastActivityDate: new Date().toISOString(),
        totalXP: 100,
        dailyXP: 12,
        streakMultiplier: 1.2,
        achievements: ['streak_3', 'streak_7', 'xp_100'],
        earnedXP: 12,
        baseXP: 10,
        streakBonus: 2,
        streakBroken: false,
        streakContinued: true,
        newAchievements: ['streak_7', 'xp_100'],
        isNewDay: true,
      };

      mockTransaction.mockResolvedValue(mockResult);

      const request = createRequest({
        activityType: 'problem_solved',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.newAchievements).toContain('streak_7');
      expect(data.data.newAchievements).toContain('xp_100');
    });

    it('should handle different activity types with correct XP', async () => {
      const mockResult = {
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date().toISOString(),
        totalXP: 25,
        dailyXP: 25,
        streakMultiplier: 1.0,
        achievements: [],
        earnedXP: 25,
        baseXP: 25,
        streakBonus: 0,
        streakBroken: false,
        streakContinued: false,
        newAchievements: [],
        isNewDay: true,
      };

      mockTransaction.mockResolvedValue(mockResult);

      const request = createRequest({
        activityType: 'daily_challenge',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.earnedXP).toBe(25);
    });

    it('should handle custom points override', async () => {
      const mockResult = {
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date().toISOString(),
        totalXP: 50,
        dailyXP: 50,
        streakMultiplier: 1.0,
        achievements: [],
        earnedXP: 50,
        baseXP: 50,
        streakBonus: 0,
        streakBroken: false,
        streakContinued: false,
        newAchievements: [],
        isNewDay: true,
      };

      mockTransaction.mockResolvedValue(mockResult);

      const request = createRequest({
        activityType: 'problem_solved',
        points: 50,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.earnedXP).toBe(50);
    });
  });

  describe('GET /api/streak', () => {
    it('should reject requests without authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/streak', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing or invalid authorization header');
    });

    it('should return default data for new user', async () => {
      mockUserDoc.exists = false;

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.currentStreak).toBe(0);
      expect(data.data.totalXP).toBe(0);
    });

    it('should return existing user data', async () => {
      const userData = {
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: new Date().toISOString(),
        totalXP: 150,
        dailyXP: 25,
        streakMultiplier: 1.1,
        achievements: ['streak_3'],
      };

      mockUserDoc.exists = true;
      mockUserDoc.data.mockReturnValue(userData);

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(userData);
    });

    it('should reset streak if user has been inactive', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 3); // 3 days ago

      const userData = {
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: yesterday.toISOString(),
        totalXP: 150,
        dailyXP: 25,
        streakMultiplier: 1.1,
        achievements: ['streak_3'],
      };

      mockUserDoc.exists = true;
      mockUserDoc.data.mockReturnValue(userData);

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.currentStreak).toBe(0);
      expect(data.message).toContain('streak has been reset');
      expect(mockFirestore.collection().doc().update).toHaveBeenCalled();
    });
  });
});