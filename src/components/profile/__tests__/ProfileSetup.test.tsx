import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProfileSetup from '../ProfileSetup';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/lib/firestore';

// Mock dependencies
jest.mock('@/context/AuthContext');
jest.mock('@/lib/firestore');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUserService = userService as jest.Mocked<typeof userService>;

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockOnComplete = jest.fn();

describe('ProfileSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });
  });

  it('renders the initial skill level selection step', () => {
    render(<ProfileSetup onComplete={mockOnComplete} />);

    expect(screen.getByText('Welcome to CodeNest!')).toBeInTheDocument();
    expect(screen.getByText('Choose Your Skill Level')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('shows progress indicator correctly', () => {
    render(<ProfileSetup onComplete={mockOnComplete} />);

    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  it('disables Next button when no skill level is selected', () => {
    render(<ProfileSetup onComplete={mockOnComplete} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('enables Next button when skill level is selected', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup onComplete={mockOnComplete} />);

    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('progresses through all steps correctly', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup onComplete={mockOnComplete} />);

    // Step 1: Select skill level
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: Select language
    expect(screen.getByText('Select Preferred Language')).toBeInTheDocument();
    expect(screen.getByText('2 of 3')).toBeInTheDocument();

    const pythonButton = screen.getByText('Python').closest('button');
    await user.click(pythonButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: Select theme
    expect(screen.getByText('Pick Your Theme')).toBeInTheDocument();
    expect(screen.getByText('3 of 3')).toBeInTheDocument();

    const lightButton = screen.getByText('Light').closest('button');
    await user.click(lightButton!);

    expect(screen.getByRole('button', { name: /complete setup/i })).toBeInTheDocument();
  });

  it('allows going back to previous steps', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup onComplete={mockOnComplete} />);

    // Go to step 2
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Go back to step 1
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('Choose Your Skill Level')).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  it('disables Back button on first step', () => {
    render(<ProfileSetup onComplete={mockOnComplete} />);

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeDisabled();
  });

  it('creates profile successfully when all steps are completed', async () => {
    const user = userEvent.setup();
    mockUserService.createProfile.mockResolvedValue();

    render(<ProfileSetup onComplete={mockOnComplete} />);

    // Complete all steps
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    const pythonButton = screen.getByText('Python').closest('button');
    await user.click(pythonButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    const lightButton = screen.getByText('Light').closest('button');
    await user.click(lightButton!);

    // Submit
    await user.click(screen.getByRole('button', { name: /complete setup/i }));

    await waitFor(() => {
      expect(mockUserService.createProfile).toHaveBeenCalledWith('test-user-123', {
        level: 'Beginner',
        preferredLanguage: 'Python',
        theme: 'light',
        streak: 0,
        lastActiveDate: expect.any(String),
        totalXP: 0,
        solvedProblems: []
      });
    });

    expect(mockOnComplete).toHaveBeenCalledWith({
      uid: 'test-user-123',
      level: 'Beginner',
      preferredLanguage: 'Python',
      theme: 'light',
      streak: 0,
      lastActiveDate: expect.any(String),
      totalXP: 0,
      solvedProblems: []
    });
  });

  it('shows error when user is not authenticated', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    render(<ProfileSetup onComplete={mockOnComplete} />);

    // Complete all steps
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    const pythonButton = screen.getByText('Python').closest('button');
    await user.click(pythonButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    const lightButton = screen.getByText('Light').closest('button');
    await user.click(lightButton!);

    // Submit
    await user.click(screen.getByRole('button', { name: /complete setup/i }));

    await waitFor(() => {
      expect(screen.getByText('User not authenticated')).toBeInTheDocument();
    });
  });

  it('shows error when profile creation fails', async () => {
    const user = userEvent.setup();
    mockUserService.createProfile.mockRejectedValue(new Error('Database error'));

    render(<ProfileSetup onComplete={mockOnComplete} />);

    // Complete all steps
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    const pythonButton = screen.getByText('Python').closest('button');
    await user.click(pythonButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    const lightButton = screen.getByText('Light').closest('button');
    await user.click(lightButton!);

    // Submit
    await user.click(screen.getByRole('button', { name: /complete setup/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create profile. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows loading state during profile creation', async () => {
    const user = userEvent.setup();
    mockUserService.createProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ProfileSetup onComplete={mockOnComplete} />);

    // Complete all steps
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    const pythonButton = screen.getByText('Python').closest('button');
    await user.click(pythonButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    const lightButton = screen.getByText('Light').closest('button');
    await user.click(lightButton!);

    // Submit
    await user.click(screen.getByRole('button', { name: /complete setup/i }));

    expect(screen.getByText('Creating...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('validates required fields before submission', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup onComplete={mockOnComplete} />);

    // Complete skill level
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Skip language selection and go to theme (Next button should be disabled)
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();

    // Select a language to proceed
    const pythonButton = screen.getByText('Python').closest('button');
    await user.click(pythonButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Now we're on theme step - select theme
    const lightButton = screen.getByText('Light').closest('button');
    await user.click(lightButton!);

    // This should work since all fields are completed
    await user.click(screen.getByRole('button', { name: /complete setup/i }));

    // Should call the service successfully
    await waitFor(() => {
      expect(mockUserService.createProfile).toHaveBeenCalled();
    });
  });

  it('validates that all steps are completed before allowing submission', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup onComplete={mockOnComplete} />);

    // Complete only skill level
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    await user.click(screen.getByRole('button', { name: /next/i }));

    // On language step, Next button should be disabled without selection
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();

    // Select language
    const pythonButton = screen.getByText('Python').closest('button');
    await user.click(pythonButton!);

    // Now Next button should be enabled
    expect(nextButton).not.toBeDisabled();
  });
});