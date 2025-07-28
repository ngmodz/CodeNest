import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProtectedRoute, withAuth } from '../ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProtectedRoute', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // Loading spinner
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show authentication prompt when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Welcome to CodeNest')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to access your coding practice platform')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show auth modal when Get Started button is clicked', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    const getStartedButton = screen.getByRole('button', { name: 'Get Started' });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText('Sign In to CodeNest')).toBeInTheDocument();
    });
  });

  it('should render fallback when provided and user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    render(
      <ProtectedRoute fallback={<div>Custom Fallback</div>}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Welcome to CodeNest')).not.toBeInTheDocument();
  });

  it('should render children when requireAuth is false regardless of auth state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    render(
      <ProtectedRoute requireAuth={false}>
        <div>Public Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });
});

describe('withAuth HOC', () => {
  const TestComponent = ({ message }: { message: string }) => (
    <div>{message}</div>
  );

  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should wrap component with authentication', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    const AuthenticatedComponent = withAuth(TestComponent);

    render(<AuthenticatedComponent message="Hello World" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should show authentication prompt when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    const AuthenticatedComponent = withAuth(TestComponent);

    render(<AuthenticatedComponent message="Hello World" />);

    expect(screen.getByText('Welcome to CodeNest')).toBeInTheDocument();
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
  });

  it('should respect requireAuth option', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    const PublicComponent = withAuth(TestComponent, { requireAuth: false });

    render(<PublicComponent message="Public Content" />);

    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });
});