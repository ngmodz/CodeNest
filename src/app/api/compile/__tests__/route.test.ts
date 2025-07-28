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

// Mock Judge0 API
global.fetch = jest.fn();

describe('/api/compile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';
    process.env.JUDGE0_API_KEY = 'test-key';
    process.env.JUDGE0_API_HOST = 'judge0-ce.p.rapidapi.com';
  });

  const createRequest = (body: any, token = 'valid-token') => {
    return new NextRequest('http://localhost:3000/api/compile', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  it('should reject requests without authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/compile', {
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
    expect(data.error).toContain('Missing required fields');
  });

  it('should validate supported languages', async () => {
    const request = createRequest({
      code: 'print("hello")',
      language: 'unsupported',
      testCases: [{ input: '', expectedOutput: 'hello' }],
      action: 'run',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Unsupported language');
  });

  it('should validate action parameter', async () => {
    const request = createRequest({
      code: 'print("hello")',
      language: 'python',
      testCases: [{ input: '', expectedOutput: 'hello' }],
      action: 'invalid',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Action must be either "run" or "submit"');
  });

  it('should successfully execute code with run action', async () => {
    // Mock Judge0 submission
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token' }),
      })
      // Mock Judge0 result
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: { id: 3, description: 'Accepted' },
          stdout: 'hello',
          stderr: null,
          time: '0.001',
          memory: 1024,
          compile_output: null,
        }),
      });

    const request = createRequest({
      code: 'print("hello")',
      language: 'python',
      testCases: [
        { input: '', expectedOutput: 'hello', isHidden: false },
        { input: '', expectedOutput: 'world', isHidden: true },
      ],
      action: 'run',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.verdict).toBe('Accepted');
    expect(data.results).toHaveLength(1); // Only non-hidden test case
    expect(data.results[0].passed).toBe(true);
    expect(data.passedTests).toBe(1);
  });

  it('should execute all test cases with submit action', async () => {
    // Mock Judge0 responses for multiple test cases
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: { id: 3, description: 'Accepted' },
          stdout: 'hello',
          stderr: null,
          time: '0.001',
          memory: 1024,
          compile_output: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token-2' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: { id: 3, description: 'Accepted' },
          stdout: 'world',
          stderr: null,
          time: '0.002',
          memory: 1024,
          compile_output: null,
        }),
      });

    const request = createRequest({
      code: 'print("hello")',
      language: 'python',
      testCases: [
        { input: '', expectedOutput: 'hello', isHidden: false },
        { input: '', expectedOutput: 'world', isHidden: true },
      ],
      action: 'submit',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(2); // All test cases
  });

  it('should handle compilation errors', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: { id: 6, description: 'Compilation Error' },
          stdout: null,
          stderr: null,
          time: null,
          memory: null,
          compile_output: 'SyntaxError: invalid syntax',
        }),
      });

    const request = createRequest({
      code: 'print("hello"',
      language: 'python',
      testCases: [{ input: '', expectedOutput: 'hello' }],
      action: 'run',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.verdict).toBe('Compilation Error');
    expect(data.results[0].error).toBe('SyntaxError: invalid syntax');
  });

  it('should handle Judge0 API failures', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    });

    const request = createRequest({
      code: 'print("hello")',
      language: 'python',
      testCases: [{ input: '', expectedOutput: 'hello' }],
      action: 'run',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results[0].error).toContain('Judge0 submission failed');
  });

  it('should map language IDs correctly', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: { id: 3, description: 'Accepted' },
          stdout: 'hello',
          stderr: null,
          time: '0.001',
          memory: 1024,
          compile_output: null,
        }),
      });

    const request = createRequest({
      code: 'console.log("hello")',
      language: 'javascript',
      testCases: [{ input: '', expectedOutput: 'hello' }],
      action: 'run',
    });

    await POST(request);

    // Check that the correct language ID was sent to Judge0
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/submissions'),
      expect.objectContaining({
        body: expect.stringContaining('"language_id":63'), // JavaScript = 63
      })
    );
  });
});