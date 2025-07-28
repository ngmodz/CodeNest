import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProfileManager from '../ProfileManager';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/lib/firestore';
import { UserProfile } from '@/types';

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

const mockProfile: UserProfile = {
  uid: 'test-user-123',
  level: 'Intermediate',
  preferredLanguage: 'Python',
  theme: 'dark',
  streak: 5,
  lastActiveDate: '2024-01-15T10:00:00.000Z',
  totalXP: 150,
  solvedProblems: ['problem1', 'problem2']
};

const mockOnProfileUpdate = jest.fn();

describe('ProfileManager', () => {
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

  it('renders with initial profile data', () => {
    render(<ProfileManager initialProfile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />);
    
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('loads profile data when no initial profile is provided', async () => {
    mockUserService.getProfile.mockResolvedValue({ success: true, data: mockProfile });
    
    render(<ProfileManager onProfileUpdate={mockOnProfileUpdate} />);
    
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });
    
    expect(mockUserService.getProfile).toHaveBeenCalledWith('test-user-123');
  });

  it('shows profile stats correctly', () => {
    render(<ProfileManager initialProfile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // streak
    expect(screen.getByText('150')).toBeInTheDocument(); // totalXP
    expect(screen.getByText('2')).toBeInTheDocument(); // solved problems count
    expect(screen.getByText('15/1/2024')).toBeInTheDocument(); // last active date
  });

  it('allows changing skill level', async () => {
    const user = userEvent.setup();
    render(<ProfileManager initialProfile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />);
    
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    
    // Check if Save Changes button is enabled
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('allows changing preferred language', async () => {
    const user = userEvent.setup();
    render(<ProfileManager initialProfile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />);
    
    const javaButton = screen.getByText('Java').closest('button');
    await user.click(javaButton!);
    
    // Check if Save Changes button is enabled
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('allows changing theme', async () => {
    const user = userEvent.setup();
    render(<ProfileManager initialProfile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />);
    
    const lightButton = screen.getByText('Light').closest('button');
    await user.click(lightButton!);
    
    // Check if Save Changes button is enabled
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('disables Save Changes button when no changes are made', () => {
    render(<ProfileManager initialProfile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />);
    
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it('saves profile changes successfully', async () => {
    const user = userEvent.setup();
    mockUserService.updateProfile.mockResolvedValue({ success: true });
    
    render(<ProfileManager initialProfile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />);
    
    // Change skill level
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(mockUserService.updateProfile).toHaveBeenCalledWith('test-user-123', {
        level: 'Beginner',
        preferredLanguage: 'Python',
        theme: 'dark'
      });
    });
    
    expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    expect(mockOnProfileUpdate).toHaveBeenCalledWith({
      ...mockProfile,
      level: 'Beginner'
    });
  });

  it('shows error when profile update fails', async () => {
    const user = userEvent.setup();
    mockUserService.updateProfile.mockResolvedValue({ 
      success: false, 
      error: { 
        code: 'UPDATE_ERROR', 
        message: 'Database error', 
        timestamp: new Date().toISOString() 
      } 
    });
    
    render(<ProfileManager initialProfile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />);
    
    // Change skill level
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows loading state during save', async () => {
    const user = userEvent.setup();
    mockUserService.updateProfile.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    render(<ProfileManager initialProfile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />);
    
    // Change skill level
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
  });

  it('shows error when profile loading fails', async () => {
    mockUserService.getProfile.mockResolvedValue({ 
      success: false, 
      error: { 
        code: 'FETCH_ERROR', 
        message: 'Database error', 
        timestamp: new Date().toISOString() 
      } 
    });
    
    render(<ProfileManager onProfileUpdate={mockOnProfileUpdate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load profile data')).toBeInTheDocument();
    });
  });

  it('shows profile not found message when profile does not exist', async () => {
    mockUserService.getProfile.mockResolvedValue({ 
      success: false, 
      error: { 
        code: 'DOCUMENT_NOT_FOUND', 
        message: 'Profile not found', 
        timestamp: new Date().toISOString() 
      } 
    });
    
    render(<ProfileManager onProfileUpdate={mockOnProfileUpdate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Profile not found')).toBeInTheDocument();
    });
  });

  it('clears success message after timeout', async () => {
    const user = userEvent.setup();
    mockUserService.updateProfile.mockResolvedValue({ success: true });
    
    render(<ProfileManager initialProfile={mockProfile} onProfileUpdate={mockOnProfileUpdate} />);
    
    // Change skill level and save
    const beginnerButton = screen.getByText('Beginner').closest('button');
    await user.click(beginnerButton!);
    
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
    
    // Wait for success message to disappear
    await waitFor(() => {
      expect(screen.queryByText('Profile updated successfully!')).not.toBeInTheDocument();
    }, { timeout: 4000 });
  });

  it('handles user not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });
    
    render(<ProfileManager onProfileUpdate={mockOnProfileUpdate} />);
    
    // Should not attempt to load profile
    expect(mockUserService.getProfile).not.toHaveBeenCalled();
  });
});