// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
};

// Initialize Firebase only in browser environment
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;

if (typeof window !== 'undefined') {
  // Initialize Firebase only if it hasn't been initialized already
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
} else {
  // Create mock objects for server-side rendering
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  functions = {} as Functions;
}

export { auth, db, functions };
export default app;