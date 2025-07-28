import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Supported models (in order of preference)
const SUPPORTED_MODELS = [
  'deepseek/deepseek-coder',
  'qwen/qwen-2.5-coder-32b-instruct',
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o-mini'
];

interface GenerateQuestionRequest {
  userLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  topic: string;
  previousProblems?: string[];
}

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface GeneratedQuestion {
  title: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  testCases: TestCase[];
  difficulty: string;
  tags: string[];
}

// Topic-specific prompts for different skill levels
const TOPIC_PROMPTS = {
  Beginner: {
    'Lists': 'Create a simple list manipulation problem focusing on basic operations like indexing, appending, or finding elements',
    'Strings': 'Design a string processing problem involving basic operations like concatenation, slicing, or character counting',
    'Loops': 'Generate a loop-based problem that requires iteration over data structures or ranges',
    'Conditionals': 'Create a problem that uses if-else logic to make decisions based on input conditions',
    'Functions': 'Design a problem that requires writing a simple function with clear input/output requirements',
  },
  Intermediate: {
    'Recursion': 'Create a recursion problem that can be solved elegantly with recursive thinking',
    'Dictionaries': 'Design a hash map/dictionary problem involving key-value operations and lookups',
    'Sorting': 'Generate a sorting-related problem that may require custom sorting logic',
    'Two Pointers': 'Create a two-pointer technique problem for array or string manipulation',
    'Binary Search': 'Design a binary search problem with a clear search space',
  },
  Advanced: {
    'Trees': 'Create a binary tree or general tree problem involving traversal or manipulation',
    'Dynamic Programming': 'Design a DP problem with optimal substructure and overlapping subproblems',
    'Graphs': 'Generate a graph problem involving traversal, shortest paths, or connectivity',
    'Backtracking': 'Create a backtracking problem requiring systematic exploration of solution space',
    'Greedy': 'Design a greedy algorithm problem with clear optimal choice property',
  },
};

function generatePrompt(userLevel: string, topic: string, previousProblems: string[] = []): string {
  const levelPrompts = TOPIC_PROMPTS[userLevel as keyof typeof TOPIC_PROMPTS] || {};
  const topicPrompt = levelPrompts[topic as keyof typeof levelPrompts] || `Create a ${userLevel.toLowerCase()} level problem about ${topic}`;
  
  const previousContext = previousProblems.length > 0 
    ? `\n\nAvoid creating problems similar to these previously solved ones: ${previousProblems.join(', ')}`
    : '';

  return `You are an expert coding interview question generator. ${topicPrompt}.

Requirements:
1. Create a ${userLevel.toLowerCase()}-level coding problem about ${topic}
2. The problem should be engaging and educational
3. Include clear problem description with examples
4. Provide comprehensive test cases (both public and hidden)
5. Ensure the problem is solvable and well-defined

${previousContext}

Please respond with a JSON object in this exact format:
{
  "title": "Problem Title",
  "description": "Clear problem description with context and requirements",
  "examples": [
    {
      "input": "sample input",
      "output": "expected output",
      "explanation": "why this output is correct"
    }
  ],
  "constraints": [
    "constraint 1",
    "constraint 2"
  ],
  "testCases": [
    {
      "input": "test input",
      "expectedOutput": "expected output",
      "isHidden": false
    },
    {
      "input": "hidden test input",
      "expectedOutput": "expected output", 
      "isHidden": true
    }
  ],
  "difficulty": "${userLevel}",
  "tags": ["${topic}", "additional_tag"]
}

Ensure the JSON is valid and complete. Include at least 2 public test cases and 2 hidden test cases.`;
}

function validateGeneratedQuestion(question: any): boolean {
  if (!question || typeof question !== 'object') return false;
  
  const requiredFields = ['title', 'description', 'examples', 'constraints', 'testCases', 'difficulty', 'tags'];
  for (const field of requiredFields) {
    if (!(field in question)) return false;
  }
  
  // Validate arrays
  if (!Array.isArray(question.examples) || question.examples.length === 0) return false;
  if (!Array.isArray(question.constraints) || question.constraints.length === 0) return false;
  if (!Array.isArray(question.testCases) || question.testCases.length === 0) return false;
  if (!Array.isArray(question.tags) || question.tags.length === 0) return false;
  
  // Validate test cases structure
  for (const testCase of question.testCases) {
    if (!testCase.input || !testCase.expectedOutput || typeof testCase.isHidden !== 'boolean') {
      return false;
    }
  }
  
  // Validate examples structure
  for (const example of question.examples) {
    if (!example.input || !example.output) {
      return false;
    }
  }
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Verify Firebase ID token
    const idToken = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    
    try {
      await auth.verifyIdToken(idToken);
    } catch (authError) {
      console.error('Auth verification failed:', authError);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: GenerateQuestionRequest = await request.json();
    const { userLevel, topic, previousProblems = [] } = body;

    // Validate required fields
    if (!userLevel || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: userLevel, topic' },
        { status: 400 }
      );
    }

    // Validate user level
    if (!['Beginner', 'Intermediate', 'Advanced'].includes(userLevel)) {
      return NextResponse.json(
        { error: 'Invalid userLevel. Must be: Beginner, Intermediate, or Advanced' },
        { status: 400 }
      );
    }

    // Generate prompt
    const prompt = generatePrompt(userLevel, topic, previousProblems);

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'CodeNest Platform'
      },
      body: JSON.stringify({
        model: SUPPORTED_MODELS[0], // Use DeepSeek Coder as primary model
        messages: [
          {
            role: 'system',
            content: 'You are an expert coding interview question generator. Generate high-quality coding problems with comprehensive test cases. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const apiResponse = await response.json();
    const text = apiResponse.choices[0]?.message?.content;

    // Parse JSON response
    let generatedQuestion: any;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      generatedQuestion = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse OpenRouter response:', text);
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response',
          details: 'The AI generated an invalid response format'
        },
        { status: 500 }
      );
    }

    // Validate the generated question structure
    if (!validateGeneratedQuestion(generatedQuestion)) {
      console.error('Invalid question structure:', generatedQuestion);
      return NextResponse.json(
        { 
          error: 'Invalid question structure generated',
          details: 'The AI response is missing required fields or has invalid format'
        },
        { status: 500 }
      );
    }

    // Ensure we have both public and hidden test cases
    const publicTests = generatedQuestion.testCases.filter((tc: any) => !tc.isHidden);
    const hiddenTests = generatedQuestion.testCases.filter((tc: any) => tc.isHidden);

    if (publicTests.length === 0) {
      // Convert some test cases to public if none exist
      generatedQuestion.testCases[0].isHidden = false;
    }

    if (hiddenTests.length === 0) {
      // Convert some test cases to hidden if none exist
      if (generatedQuestion.testCases.length > 1) {
        generatedQuestion.testCases[generatedQuestion.testCases.length - 1].isHidden = true;
      }
    }

    return NextResponse.json({
      success: true,
      question: generatedQuestion,
      metadata: {
        generatedAt: new Date().toISOString(),
        userLevel,
        topic,
        totalTestCases: generatedQuestion.testCases.length,
        publicTestCases: generatedQuestion.testCases.filter((tc: any) => !tc.isHidden).length,
        hiddenTestCases: generatedQuestion.testCases.filter((tc: any) => tc.isHidden).length,
      },
    });

  } catch (error) {
    console.error('OpenRouter API error:', error);
    
    // Handle specific OpenRouter API errors
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
