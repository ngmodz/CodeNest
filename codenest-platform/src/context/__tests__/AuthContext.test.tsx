import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '@/lib/auth';

// Mock the auth service
jest.mock('@/lib/auth');

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, signIn, signUp, signInWithGoogle, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in as ${user.email}` : 'Not logged in'}
      </div>
      <button onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => signUp('test@example.com', 'password')}>
        Sign Up
      </button>
      <button onClick={() => signInWithGoogle()}>
        Sign In with Google
      </button>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial loading state', () => {
    let authStateCallback: (user: any) => void;
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should provide user when authenticated', async () => {
    let authStateCallback: (user: any) => void;
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      setTimeout(() => callback(mockUser), 0);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
    });
  });

  it('should provide null user when not authenticated', async () => {
    let authStateCallback: (user: any) => void;
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      setTimeout(() => callback(null), 0);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  it('should call authService.signIn when signIn is called', async () => {
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });
    mockAuthService.signIn.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });

    const signInButton = screen.getByText('Sign In');
    
    await act(async () => {
      signInButton.click();
    });

    expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should call authService.signUp when signUp is called', async () => {
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });
    mockAuthService.signUp.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });

    const signUpButton = screen.getByText('Sign Up');
    
    await act(async () => {
      signUpButton.click();
    });

    expect(mockAuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should call authService.signInWithGoogle when signInWithGoogle is called', async () => {
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });
    mockAuthService.signInWithGoogle.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });

    const googleSignInButton = screen.getByText('Sign In with Google');
    
    await act(async () => {
      googleSignInButton.click();
    });

    expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
  });

  it('should call authService.signOut when signOut is called', async () => {
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });
    mockAuthService.signOut.mockResolvedValue();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
    });

    const signOutButton = screen.getByText('Sign Out');
    
    await act(async () => {
      signOutButton.click();
    });

    expect(mockAuthService.signOut).toHaveBeenCalled();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});