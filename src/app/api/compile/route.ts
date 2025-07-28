import { NextRequest, NextResponse } from 'next/server';
import { 
  withAuth, 
  validateRequestBody, 
  rateLimit, 
  sanitizeInput,
  createErrorResponse,
  createSuccessResponse,
  AuthenticatedRequest 
} from '@/lib/api-middleware';

// Language ID mapping for Judge0
const LANGUAGE_MAP = {
  python: 71,
  java: 62,
  javascript: 63,
  cpp: 54,
  c: 50,
} as const;

interface CompileRequest {
  code: string;
  language: keyof typeof LANGUAGE_MAP;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }>;
  action: 'run' | 'submit';
}

interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin: string;
  expected_output: string;
}

interface Judge0Result {
  status: {
    id: number;
    description: string;
  };
  stdout: string | null;
  stderr: string | null;
  time: string | null;
  memory: number | null;
  compile_output: string | null;
}

async function submitToJudge0(submission: Judge0Submission): Promise<string> {
  const response = await fetch(`${process.env.JUDGE0_API_URL}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY || '',
      'X-RapidAPI-Host': process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error(`Judge0 submission failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.token;
}

async function getJudge0Result(token: string, maxRetries = 10): Promise<Judge0Result> {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(`${process.env.JUDGE0_API_URL}/submissions/${token}`, {
      headers: {
        'X-RapidAPI-Key': process.env.JUDGE0_API_KEY || '',
        'X-RapidAPI-Host': process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error(`Judge0 result fetch failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Status ID 1 = In Queue, 2 = Processing
    if (result.status.id > 2) {
      return result;
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Judge0 execution timeout');
}

async function handleCompile(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimitCheck = rateLimit(50, 15 * 60 * 1000)(request); // 50 requests per 15 minutes
    if (!rateLimitCheck.allowed) {
      return createErrorResponse(rateLimitCheck.error!, 429);
    }

    // Parse and validate request body
    const rawBody = await request.json();
    const validation = validateRequestBody<CompileRequest>(
      rawBody,
      ['code', 'language', 'testCases', 'action']
    );

    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400);
    }

    const { code, language, testCases, action } = sanitizeInput(validation.data!);

    // Validate language
    if (!(language in LANGUAGE_MAP)) {
      return createErrorResponse(
        `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
        400
      );
    }

    // Validate action
    if (!['run', 'submit'].includes(action)) {
      return createErrorResponse('Action must be either "run" or "submit"', 400);
    }

    // Filter test cases based on action
    const relevantTestCases = action === 'run' 
      ? testCases.filter(tc => !tc.isHidden)
      : testCases;

    if (relevantTestCases.length === 0) {
      return createErrorResponse('No test cases available for this action', 400);
    }

    // Execute code against test cases
    const results = [];
    const languageId = LANGUAGE_MAP[language];

    for (const testCase of relevantTestCases) {
      try {
        const submission: Judge0Submission = {
          source_code: code,
          language_id: languageId,
          stdin: testCase.input,
          expected_output: testCase.expectedOutput.trim(),
        };

        const token = await submitToJudge0(submission);
        const result = await getJudge0Result(token);

        const testResult = {
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: result.stdout?.trim() || '',
          passed: result.stdout?.trim() === testCase.expectedOutput.trim(),
          executionTime: result.time ? parseFloat(result.time) : null,
          memoryUsage: result.memory,
          error: result.stderr || result.compile_output || null,
          status: result.status.description,
        };

        results.push(testResult);

        // For submissions, stop on first failure to save resources
        if (action === 'submit' && !testResult.passed) {
          break;
        }
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          executionTime: null,
          memoryUsage: null,
          error: error instanceof Error ? error.message : 'Unknown execution error',
          status: 'Error',
        });
      }
    }

    // Calculate overall verdict
    const allPassed = results.every(r => r.passed);
    const hasErrors = results.some(r => r.error && r.status !== 'Accepted');
    
    let verdict = 'Accepted';
    if (hasErrors) {
      verdict = results.find(r => r.error)?.status || 'Runtime Error';
    } else if (!allPassed) {
      verdict = 'Wrong Answer';
    }

    return createSuccessResponse({
      verdict,
      results,
      totalTests: relevantTestCases.length,
      passedTests: results.filter(r => r.passed).length,
      executionTime: Math.max(...results.map(r => r.executionTime || 0)),
      memoryUsage: Math.max(...results.map(r => r.memoryUsage || 0)),
    });

  } catch (error) {
    console.error('Compile API error:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export const POST = withAuth(handleCompile);