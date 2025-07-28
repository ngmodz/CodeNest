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

// DELETE - Bulk delete questions
export async function DELETE(request: NextRequest) {
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
    const { questionIds } = body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid questionIds array' },
        { status: 400 }
      );
    }

    // Create a batch for bulk operations
    const batch = firestore.batch();
    const questionsRef = firestore.collection('questions');

    // Add delete operations to batch
    for (const questionId of questionIds) {
      const questionRef = questionsRef.doc(questionId);
      batch.delete(questionRef);
    }

    // Execute batch delete
    await batch.commit();

    return NextResponse.json({
      success: true,
      deletedCount: questionIds.length,
      message: `Successfully deleted ${questionIds.length} question(s)`
    });

  } catch (error) {
    console.error('Error deleting questions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
