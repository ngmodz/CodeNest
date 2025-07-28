import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Node.js globals for Next.js API testing
// @ts-ignore
global.Request = require('node-fetch').Request;
// @ts-ignore
global.Response = require('node-fetch').Response;
// @ts-ignore  
global.Headers = require('node-fetch').Headers;

// Mock Firebase Admin SDK
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn()
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        get: jest.fn()
      })),
      add: jest.fn()
    }))
  }))
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn()
  }))
}));

describe('/api/questions', () => {
  let mockFirestore: any;
  let mockAuth: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { getFirestore } = require('firebase-admin/firestore');
    const { getAuth } = require('firebase-admin/auth');
    
    mockFirestore = {
      collection: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          get: jest.fn()
        })),
        add: jest.fn()
      }))
    };
    
    mockAuth = {
      verifyIdToken: jest.fn()
    };
    
    getFirestore.mockReturnValue(mockFirestore);
    getAuth.mockReturnValue(mockAuth);
  });

  describe('GET', () => {
    it('should return questions successfully', async () => {
      // Mock Firestore query
      const mockSnapshot = {
        docs: [
          {
            id: 'question1',
            data: () => ({
              title: 'Two Sum',
              difficulty: 'Basic',
              topic: 'Arrays',
              metadata: { createdAt: '2025-01-28T10:00:00Z' }
            })
          }
        ]
      };

      mockFirestore.collection().orderBy().get.mockResolvedValue(mockSnapshot);
      mockAuth.verifyIdToken.mockResolvedValue({ uid: 'test-user' });

      const request = new NextRequest('http://localhost:3000/api/questions', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.questions).toHaveLength(1);
      expect(data.questions[0].title).toBe('Two Sum');
    });

    it('should return 401 for missing authorization', async () => {
      const request = new NextRequest('http://localhost:3000/api/questions', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing or invalid authorization header');
    });

    it('should return 401 for invalid token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const request = new NextRequest('http://localhost:3000/api/questions', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer invalid-token'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid authentication token');
    });
  });

  describe('POST', () => {
    it('should save question successfully', async () => {
      const mockDocRef = { id: 'new-question-id' };
      mockFirestore.collection().add.mockResolvedValue(mockDocRef);
      mockAuth.verifyIdToken.mockResolvedValue({ uid: 'test-user' });

      const questionData = {
        question: {
          title: 'Test Question',
          description: 'A test coding question',
          difficulty: 'Basic',
          topic: 'Testing',
          examples: [{ input: 'test', output: 'result' }],
          constraints: ['Test constraint'],
          testCases: [{ input: 'test', expectedOutput: 'result', isHidden: false }]
        },
        metadata: {
          createdAt: '2025-01-28T10:00:00Z'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/questions', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.questionId).toBe('new-question-id');
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Question',
          description: 'A test coding question',
          metadata: expect.objectContaining({
            createdBy: 'test-user',
            isPublished: false
          })
        })
      );
    });

    it('should return 400 for missing question fields', async () => {
      mockAuth.verifyIdToken.mockResolvedValue({ uid: 'test-user' });

      const request = new NextRequest('http://localhost:3000/api/questions', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ question: {} })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required question fields');
    });

    it('should return 401 for missing authorization', async () => {
      const request = new NextRequest('http://localhost:3000/api/questions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ question: { title: 'Test' } })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing or invalid authorization header');
    });
  });
});
