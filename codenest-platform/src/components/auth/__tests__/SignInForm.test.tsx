import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInForm } from '../SignInForm';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('SignInForm', () => {
  const mockSignIn = jest.fn();
  const mockSignInWithGoogle = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnSwitchToSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signUp: jest.fn(),
      signInWithGoogle: mockSignInWithGoogle,
      signOut: jest.fn(),
    });
  });

  it('should render sign in form', () => {
    render(<SignInForm />);

    expect(screen.getByText('Sign In to CodeNest')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
  });

  it('should handle email and password input', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should call signIn when form is submitted', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com',
    });

    render(<SignInForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display error message when sign in fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    mockSignIn.mockRejectedValue(new Error(errorMessage));

    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should call signInWithGoogle when Google button is clicked', async () => {
    const user = userEvent.setup();
    mockSignInWithGoogle.mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com',
    });

    render(<SignInForm onSuccess={mockOnSuccess} />);

    const googleButton = screen.getByRole('button', { name: 'Sign in with Google' });
    await user.click(googleButton);

    expect(mockSignInWithGoogle).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display error message when Google sign in fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Google sign in failed';
    mockSignInWithGoogle.mockRejectedValue(new Error(errorMessage));

    render(<SignInForm />);

    const googleButton = screen.getByRole('button', { name: 'Sign in with Google' });
    await user.click(googleButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should show loading state during sign in', async () => {
    const user = userEvent.setup();
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText('Signing In...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should call onSwitchToSignUp when sign up link is clicked', async () => {
    const user = userEvent.setup();
    render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

    const signUpLink = screen.getByText('Sign up');
    await user.click(signUpLink);

    expect(mockOnSwitchToSignUp).toHaveBeenCalled();
  });

  it('should not show sign up link when onSwitchToSignUp is not provided', () => {
    render(<SignInForm />);

    expect(screen.queryByText('Sign up')).not.toBeInTheDocument();
  });
});