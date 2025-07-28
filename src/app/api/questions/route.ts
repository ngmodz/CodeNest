import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

const firestore = getFirestore();

interface StoredQuestion {
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
  metadata: {
    createdAt: string;
    createdBy: string;
    isPublished: boolean;
  };
}

// GET - Retrieve all questions
export async function GET(request: NextRequest) {
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

    // Query questions from Firestore
    const questionsRef = firestore.collection('questions');
    const snapshot = await questionsRef.orderBy('metadata.createdAt', 'desc').get();

    const questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Save a new question
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
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { question, metadata } = body;

    // Validate required fields
    if (!question || !question.title || !question.description) {
      return NextResponse.json(
        { error: 'Missing required question fields' },
        { status: 400 }
      );
    }

    // Prepare question document
    const questionDocument: StoredQuestion = {
      title: question.title,
      description: question.description,
      difficulty: question.difficulty || 'Basic',
      topic: question.topic || 'General',
      examples: question.examples || [],
      constraints: question.constraints || [],
      testCases: question.testCases || [],
      hints: question.hints,
      timeComplexity: question.timeComplexity,
      spaceComplexity: question.spaceComplexity,
      metadata: {
        createdAt: metadata?.createdAt || new Date().toISOString(),
        createdBy: decodedToken.uid,
        isPublished: false,
      },
    };

    // Save to Firestore
    const questionsRef = firestore.collection('questions');
    const docRef = await questionsRef.add(questionDocument);

    return NextResponse.json({
      success: true,
      questionId: docRef.id,
      message: 'Question saved successfully'
    });

  } catch (error) {
    console.error('Error saving question:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
