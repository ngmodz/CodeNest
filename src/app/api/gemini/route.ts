import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GenerateQuestionRequest {
  userLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  topic: string;
  previousProblems?: string[];
}

interface GeneratedQuestion {
  title: string;
  description: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  topic: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
  hints?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
}

// Topic-specific prompts based on user level
const TOPIC_PROMPTS = {
  Beginner: {
    'Loops': 'Create a simple loop-based problem involving iteration over arrays or ranges',
    'Strings': 'Design a string manipulation problem focusing on basic operations like concatenation, slicing, or character counting',
    'Lists': 'Generate an array/list problem involving basic operations like searching, insertion, or simple transformations',
    'Variables': 'Create a problem involving basic variable operations and simple calculations',
    'Conditionals': 'Design a problem using if-else statements and basic logical operations',
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
- Difficulty level: ${userLevel}
- Topic focus: ${topic}
- Create an original, engaging problem
- Provide clear problem statement with examples
- Include 2-3 example test cases with explanations
- Generate 5-8 comprehensive test cases (mix of public and hidden)
- Add helpful constraints and hints
- Specify time and space complexity expectations${previousContext}

Return the response in this exact JSON format:
{
  "title": "Problem Title",
  "description": "Clear problem description with input/output format",
  "difficulty": "${userLevel === 'Beginner' ? 'Basic' : userLevel}",
  "topic": "${topic}",
  "examples": [
    {
      "input": "example input",
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
    }
  ],
  "hints": [
    "helpful hint 1",
    "helpful hint 2"
  ],
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)"
}

Make sure the JSON is valid and complete.`;
}

function validateGeneratedQuestion(question: any): question is GeneratedQuestion {
  const required = ['title', 'description', 'difficulty', 'topic', 'examples', 'constraints', 'testCases'];
  
  for (const field of required) {
    if (!question[field]) {
      return false;
    }
  }

  // Validate examples structure
  if (!Array.isArray(question.examples) || question.examples.length === 0) {
    return false;
  }

  for (const example of question.examples) {
    if (!example.input || !example.output) {
      return false;
    }
  }

  // Validate test cases structure
  if (!Array.isArray(question.testCases) || question.testCases.length === 0) {
    return false;
  }

  for (const testCase of question.testCases) {
    if (!testCase.input || !testCase.expectedOutput || typeof testCase.isHidden !== 'boolean') {
      return false;
    }
  }

  // Validate difficulty
  if (!['Basic', 'Intermediate', 'Advanced'].includes(question.difficulty)) {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase Auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    
    try {
      await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
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

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
      console.error('Failed to parse Gemini response:', text);
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
    console.error('Gemini API error:', error);
    
    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
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