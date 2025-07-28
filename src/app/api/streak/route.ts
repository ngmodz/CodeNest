import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

interface StreakUpdateRequest {
  activityType: 'problem_solved' | 'daily_challenge' | 'practice_session';
  points?: number;
}

interface UserStreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalXP: number;
  dailyXP: number;
  streakMultiplier: number;
  achievements: string[];
}

// XP rewards based on activity type
const XP_REWARDS = {
  problem_solved: 10,
  daily_challenge: 25,
  practice_session: 5,
} as const;

// Streak multipliers
const STREAK_MULTIPLIERS = {
  0: 1.0,    // No streak
  3: 1.1,    // 3-day streak: 10% bonus
  7: 1.2,    // 7-day streak: 20% bonus
  14: 1.3,   // 14-day streak: 30% bonus
  30: 1.5,   // 30-day streak: 50% bonus
  60: 1.7,   // 60-day streak: 70% bonus
  100: 2.0,  // 100-day streak: 100% bonus
} as const;

function getStreakMultiplier(streak: number): number {
  const thresholds = Object.keys(STREAK_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a); // Sort descending

  for (const threshold of thresholds) {
    if (streak >= threshold) {
      return STREAK_MULTIPLIERS[threshold as keyof typeof STREAK_MULTIPLIERS];
    }
  }
  
  return 1.0;
}

function calculateStreakUpdate(lastActivityDate: string | null, currentStreak: number): {
  newStreak: number;
  streakBroken: boolean;
  streakContinued: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!lastActivityDate) {
    return {
      newStreak: 1,
      streakBroken: false,
      streakContinued: false,
    };
  }

  const lastActivity = new Date(lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);
  
  const daysDifference = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDifference === 0) {
    // Same day - no streak change
    return {
      newStreak: currentStreak,
      streakBroken: false,
      streakContinued: false,
    };
  } else if (daysDifference === 1) {
    // Consecutive day - continue streak
    return {
      newStreak: currentStreak + 1,
      streakBroken: false,
      streakContinued: true,
    };
  } else {
    // Gap in days - streak broken
    return {
      newStreak: 1,
      streakBroken: true,
      streakContinued: false,
    };
  }
}

function checkAchievements(streakData: UserStreakData, newStreak: number, totalXP: number): string[] {
  const newAchievements: string[] = [];
  const existing = new Set(streakData.achievements || []);

  // Streak achievements
  const streakMilestones = [3, 7, 14, 30, 60, 100];
  for (const milestone of streakMilestones) {
    const achievementId = `streak_${milestone}`;
    if (newStreak >= milestone && !existing.has(achievementId)) {
      newAchievements.push(achievementId);
    }
  }

  // XP achievements
  const xpMilestones = [100, 500, 1000, 2500, 5000, 10000];
  for (const milestone of xpMilestones) {
    const achievementId = `xp_${milestone}`;
    if (totalXP >= milestone && !existing.has(achievementId)) {
      newAchievements.push(achievementId);
    }
  }

  // Longest streak achievements
  const longestStreakMilestones = [10, 25, 50, 100];
  for (const milestone of longestStreakMilestones) {
    const achievementId = `longest_streak_${milestone}`;
    if (Math.max(newStreak, streakData.longestStreak) >= milestone && !existing.has(achievementId)) {
      newAchievements.push(achievementId);
    }
  }

  return newAchievements;
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
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Parse request body
    const body: StreakUpdateRequest = await request.json();
    const { activityType, points } = body;

    // Validate required fields
    if (!activityType) {
      return NextResponse.json(
        { error: 'Missing required field: activityType' },
        { status: 400 }
      );
    }

    // Validate activity type
    if (!Object.keys(XP_REWARDS).includes(activityType)) {
      return NextResponse.json(
        { error: `Invalid activityType. Must be one of: ${Object.keys(XP_REWARDS).join(', ')}` },
        { status: 400 }
      );
    }

    // Get Firestore instance
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);

    // Use transaction to ensure data consistency
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      // Get current user data or initialize defaults
      const currentData: UserStreakData = userDoc.exists 
        ? (userDoc.data() as UserStreakData)
        : {
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: '',
            totalXP: 0,
            dailyXP: 0,
            streakMultiplier: 1.0,
            achievements: [],
          };

      // Calculate streak update
      const streakUpdate = calculateStreakUpdate(
        currentData.lastActivityDate || null,
        currentData.currentStreak
      );

      // Calculate XP reward
      const baseXP = points || XP_REWARDS[activityType];
      const multiplier = getStreakMultiplier(streakUpdate.newStreak);
      const bonusXP = Math.floor(baseXP * multiplier);

      // Check if it's a new day for daily XP reset
      const today = new Date().toISOString().split('T')[0];
      const lastActivityDay = currentData.lastActivityDate ? 
        new Date(currentData.lastActivityDate).toISOString().split('T')[0] : '';
      
      const isNewDay = today !== lastActivityDay;
      const newDailyXP = isNewDay ? bonusXP : currentData.dailyXP + bonusXP;

      // Update user data
      const updatedData: UserStreakData = {
        currentStreak: streakUpdate.newStreak,
        longestStreak: Math.max(streakUpdate.newStreak, currentData.longestStreak),
        lastActivityDate: new Date().toISOString(),
        totalXP: currentData.totalXP + bonusXP,
        dailyXP: newDailyXP,
        streakMultiplier: multiplier,
        achievements: currentData.achievements || [],
      };

      // Check for new achievements
      const newAchievements = checkAchievements(currentData, streakUpdate.newStreak, updatedData.totalXP);
      if (newAchievements.length > 0) {
        updatedData.achievements = [...updatedData.achievements, ...newAchievements];
      }

      // Update the document
      transaction.set(userRef, updatedData, { merge: true });

      return {
        ...updatedData,
        earnedXP: bonusXP,
        baseXP,
        streakBonus: bonusXP - baseXP,
        streakBroken: streakUpdate.streakBroken,
        streakContinued: streakUpdate.streakContinued,
        newAchievements,
        isNewDay,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: result.streakBroken 
        ? 'Streak was broken, but you\'re starting fresh!'
        : result.streakContinued 
        ? `Great job! Your streak is now ${result.currentStreak} days!`
        : `You earned ${result.earnedXP} XP today!`,
    });

  } catch (error) {
    console.error('Streak API error:', error);
    
    // Handle Firestore errors
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        return NextResponse.json(
          { error: 'Access denied to user data' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('not-found')) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to update streak',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current streak data
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
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Get Firestore instance
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      // Return default data for new users
      const defaultData: UserStreakData = {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
        totalXP: 0,
        dailyXP: 0,
        streakMultiplier: 1.0,
        achievements: [],
      };

      return NextResponse.json({
        success: true,
        data: defaultData,
      });
    }

    const userData = userDoc.data() as UserStreakData;

    // Check if streak should be broken due to inactivity
    const streakUpdate = calculateStreakUpdate(
      userData.lastActivityDate || null,
      userData.currentStreak
    );

    // If streak was broken due to inactivity, update the data
    if (streakUpdate.streakBroken && userData.currentStreak > 0) {
      const updatedData = {
        ...userData,
        currentStreak: 0,
        dailyXP: 0, // Reset daily XP on new day
      };

      await db.collection('users').doc(userId).update(updatedData);
      
      return NextResponse.json({
        success: true,
        data: updatedData,
        message: 'Your streak has been reset due to inactivity.',
      });
    }

    return NextResponse.json({
      success: true,
      data: userData,
    });

  } catch (error) {
    console.error('Streak GET API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve streak data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}