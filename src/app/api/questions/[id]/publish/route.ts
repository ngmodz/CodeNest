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

// PATCH - Publish a question
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id: questionId } = await context.params;
    if (!questionId) {
      return NextResponse.json(
        { error: 'Missing question ID' },
        { status: 400 }
      );
    }

    // Update question in Firestore
    const questionRef = firestore.collection('questions').doc(questionId);
    
    // Check if question exists
    const questionDoc = await questionRef.get();
    if (!questionDoc.exists) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update isPublished field
    await questionRef.update({
      'metadata.isPublished': true,
      'metadata.publishedAt': new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Question published successfully'
    });

  } catch (error) {
    console.error('Error publishing question:', error);
    return NextResponse.json(
      { 
        error: 'Failed to publish question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
