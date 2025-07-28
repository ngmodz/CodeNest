import { NextRequest } from 'next/server';
import { POST } from '../route';

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

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: jest.fn(),
    })),
  })),
}));

describe('/api/gemini', () => {
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockGenAI = new GoogleGenerativeAI();
    const mockModel = mockGenAI.getGenerativeModel();
    mockGenerateContent = mockModel.generateContent;
    
    process.env.GEMINI_API_KEY = 'test-key';
  });

  const createRequest = (body: any, token = 'valid-token') => {
    return new NextRequest('http://localhost:3000/api/gemini', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  const mockValidQuestion = {
    title: 'Two Sum',
    description: 'Given an array of integers, return indices of two numbers that add up to target.',
    difficulty: 'Basic',
    topic: 'Lists',
    examples: [
      {
        input: '[2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: '2 + 7 = 9'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9'
    ],
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
    hints: [
      'Use a hash map to store values and indices',
      'Look for complement of current number'
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)'
  };

  it('should reject requests without authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/gemini', {
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
    expect(data.error).toBe('Missing required fields: userLevel, topic');
  });

  it('should validate user level', async () => {
    const request = createRequest({
      userLevel: 'Invalid',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid userLevel. Must be: Beginner, Intermediate, or Advanced');
  });

  it('should successfully generate a question', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockValidQuestion),
      },
    });

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.question).toEqual(mockValidQuestion);
    expect(data.metadata).toMatchObject({
      userLevel: 'Beginner',
      topic: 'Lists',
      totalTestCases: 2,
      publicTestCases: 1,
      hiddenTestCases: 1,
    });
  });

  it('should include previous problems in prompt', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockValidQuestion),
      },
    });

    const request = createRequest({
      userLevel: 'Intermediate',
      topic: 'Recursion',
      previousProblems: ['Fibonacci', 'Factorial'],
    });

    await POST(request);

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining('Avoid creating problems similar to these previously solved ones: Fibonacci, Factorial')
    );
  });

  it('should handle invalid JSON response from Gemini', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'This is not valid JSON',
      },
    });

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to parse AI response');
  });

  it('should handle incomplete question structure', async () => {
    const incompleteQuestion = {
      title: 'Test Problem',
      // Missing required fields
    };

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(incompleteQuestion),
      },
    });

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Invalid question structure generated');
  });

  it('should ensure both public and hidden test cases exist', async () => {
    const questionWithOnlyPublic = {
      ...mockValidQuestion,
      testCases: [
        {
          input: '[2,7,11,15]\n9',
          expectedOutput: '[0,1]',
          isHidden: false
        },
        {
          input: '[3,2,4]\n6',
          expectedOutput: '[1,2]',
          isHidden: false
        }
      ]
    };

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(questionWithOnlyPublic),
      },
    });

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.question.testCases.some((tc: any) => tc.isHidden)).toBe(true);
  });

  it('should handle Gemini API errors', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API key invalid'));

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('AI service configuration error');
  });

  it('should handle rate limiting errors', async () => {
    mockGenerateContent.mockRejectedValue(new Error('quota exceeded'));

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('AI service temporarily unavailable. Please try again later.');
  });

  it('should use appropriate prompts for different levels and topics', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockValidQuestion),
      },
    });

    // Test Advanced level with Dynamic Programming
    const request = createRequest({
      userLevel: 'Advanced',
      topic: 'Dynamic Programming',
    });

    await POST(request);

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining('Design a DP problem with optimal substructure and overlapping subproblems')
    );
  });

  it('should extract JSON from response with extra text', async () => {
    const responseWithExtraText = `
      Here's a great coding problem for you:
      
      ${JSON.stringify(mockValidQuestion)}
      
      This should be challenging but fair!
    `;

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => responseWithExtraText,
      },
    });

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.question).toEqual(mockValidQuestion);
  });
});