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

// Mock fetch for OpenRouter API
global.fetch = jest.fn();

describe('/api/generateQuestion', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  const mockValidQuestion = {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    examples: [
      {
        input: '[2,7,11,15]\n9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9'
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
    difficulty: 'Beginner',
    tags: ['Lists', 'Hash Table']
  };

  const createRequest = (body: any, token = 'valid-token') => {
    return new NextRequest('http://localhost:3000/api/generateQuestion', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  const mockSuccessfulOpenRouterResponse = () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(mockValidQuestion)
            }
          }
        ]
      })
    } as Response);
  };

  it('should reject requests without authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/generateQuestion', {
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
    mockSuccessfulOpenRouterResponse();

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

  it('should handle OpenRouter API errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized'
    } as Response);

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
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded'
    } as Response);

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('AI service temporarily unavailable. Please try again later.');
  });

  it('should handle invalid JSON responses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'This is not valid JSON'
            }
          }
        ]
      })
    } as Response);

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to parse AI response');
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

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(questionWithOnlyPublic)
            }
          }
        ]
      })
    } as Response);

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.question.testCases.some((tc: any) => tc.isHidden)).toBe(true);
  });

  it('should include previous problems in prompt', async () => {
    mockSuccessfulOpenRouterResponse();

    const request = createRequest({
      userLevel: 'Beginner',
      topic: 'Lists',
      previousProblems: ['Two Sum', 'Valid Parentheses']
    });

    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        body: expect.stringContaining('Two Sum, Valid Parentheses')
      })
    );
  });

  it('should use appropriate prompts for different levels and topics', async () => {
    mockSuccessfulOpenRouterResponse();

    // Test Advanced level with Dynamic Programming
    const request = createRequest({
      userLevel: 'Advanced',
      topic: 'Dynamic Programming',
    });

    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        body: expect.stringContaining('Design a DP problem with optimal substructure and overlapping subproblems')
      })
    );
  });

  it('should extract JSON from response with extra text', async () => {
    const responseWithExtraText = `
      Here's a great coding problem for you:
      
      ${JSON.stringify(mockValidQuestion)}
      
      This should be challenging but fair!
    `;

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: responseWithExtraText
            }
          }
        ]
      })
    } as Response);

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
