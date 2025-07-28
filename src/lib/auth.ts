// Authentication service layer
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { User } from '@/types';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName: userCredential.user.displayName || undefined,
      photoURL: userCredential.user.photoURL || undefined
    };
  },

  // Sign up with email and password
  async signUp(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName: userCredential.user.displayName || undefined,
      photoURL: userCredential.user.photoURL || undefined
    };
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName: userCredential.user.displayName || undefined,
      photoURL: userCredential.user.photoURL || undefined
    };
  },

  // Sign out
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  // Get current user
  getCurrentUser(): User | null {
    const user = auth.currentUser;
    if (user) {
      return {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined
      };
    }
    return null;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined
        });
      } else {
        callback(null);
      }
    });
  }
};