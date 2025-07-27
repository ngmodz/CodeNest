import { authService } from '../auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

// Mock Firebase auth functions
jest.mock('firebase/auth');
jest.mock('../firebase', () => ({
  auth: {},
}));

const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>;
const mockSignInWithPopup = signInWithPopup as jest.MockedFunction<typeof signInWithPopup>;
const mockFirebaseSignOut = firebaseSignOut as jest.MockedFunction<typeof firebaseSignOut>;
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;

describe('authService', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in user with email and password', async () => {
      const mockUserCredential = { user: mockUser };
      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);

      const result = await authService.signIn('test@example.com', 'password123');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
    });

    it('should handle sign in errors', async () => {
      const error = new Error('Invalid credentials');
      mockSignInWithEmailAndPassword.mockRejectedValue(error);

      await expect(authService.signIn('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('should create new user with email and password', async () => {
      const mockUserCredential = { user: mockUser };
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);

      const result = await authService.signUp('test@example.com', 'password123');

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
    });

    it('should handle sign up errors', async () => {
      const error = new Error('Email already in use');
      mockCreateUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(authService.signUp('test@example.com', 'password123')).rejects.toThrow('Email already in use');
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in user with Google', async () => {
      const mockUserCredential = { user: mockUser };
      mockSignInWithPopup.mockResolvedValue(mockUserCredential as any);

      const result = await authService.signInWithGoogle();

      expect(mockSignInWithPopup).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything()
      );
      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
    });

    it('should handle Google sign in errors', async () => {
      const error = new Error('Google sign in failed');
      mockSignInWithPopup.mockRejectedValue(error);

      await expect(authService.signInWithGoogle()).rejects.toThrow('Google sign in failed');
    });
  });

  describe('signOut', () => {
    it('should sign out user', async () => {
      mockFirebaseSignOut.mockResolvedValue();

      await authService.signOut();

      expect(mockFirebaseSignOut).toHaveBeenCalledWith(expect.anything());
    });

    it('should handle sign out errors', async () => {
      const error = new Error('Sign out failed');
      mockFirebaseSignOut.mockRejectedValue(error);

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', () => {
      // Mock auth.currentUser
      const mockAuth = { currentUser: mockUser };
      jest.doMock('../firebase', () => ({ auth: mockAuth }));

      const result = authService.getCurrentUser();

      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
    });

    it('should return null when not authenticated', () => {
      const mockAuth = { currentUser: null };
      jest.doMock('../firebase', () => ({ auth: mockAuth }));

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should call callback with user when authenticated', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser as any);
        return mockUnsubscribe;
      });

      const unsubscribe = authService.onAuthStateChange(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback with null when not authenticated', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      const unsubscribe = authService.onAuthStateChange(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});