import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfile } from '../useProfile';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/lib/firestore';
import { UserProfile } from '@/types';

// Mock dependencies
jest.mock('@/context/AuthContext');
jest.mock('@/lib/firestore');

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

describe('useProfile', () => {
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

  it('loads profile on mount when user is authenticated', async () => {
    mockUserService.getProfile.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useProfile());

    expect(result.current.loading).toBe(true);
    expect(result.current.profile).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.hasProfile).toBe(true);
    expect(result.current.error).toBe(null);
    expect(mockUserService.getProfile).toHaveBeenCalledWith('test-user-123');
  });

  it('handles case when profile does not exist', async () => {
    mockUserService.getProfile.mockResolvedValue(null);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBe(null);
    expect(result.current.hasProfile).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('handles profile loading error', async () => {
    mockUserService.getProfile.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBe(null);
    expect(result.current.hasProfile).toBe(false);
    expect(result.current.error).toBe('Failed to load profile');
  });

  it('does not load profile when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBe(null);
    expect(result.current.hasProfile).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockUserService.getProfile).not.toHaveBeenCalled();
  });

  it('creates profile successfully', async () => {
    mockUserService.getProfile.mockResolvedValue(null);
    mockUserService.createProfile.mockResolvedValue();

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const profileData: Omit<UserProfile, 'uid'> = {
      level: 'Beginner',
      preferredLanguage: 'JavaScript',
      theme: 'light',
      streak: 0,
      lastActiveDate: '2024-01-15T10:00:00.000Z',
      totalXP: 0,
      solvedProblems: []
    };

    await act(async () => {
      await result.current.createProfile(profileData);
    });

    expect(mockUserService.createProfile).toHaveBeenCalledWith('test-user-123', profileData);
    expect(result.current.profile).toEqual({
      uid: 'test-user-123',
      ...profileData
    });
    expect(result.current.hasProfile).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('handles profile creation error', async () => {
    mockUserService.getProfile.mockResolvedValue(null);
    mockUserService.createProfile.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const profileData: Omit<UserProfile, 'uid'> = {
      level: 'Beginner',
      preferredLanguage: 'JavaScript',
      theme: 'light',
      streak: 0,
      lastActiveDate: '2024-01-15T10:00:00.000Z',
      totalXP: 0,
      solvedProblems: []
    };

    await expect(async () => {
      await act(async () => {
        await result.current.createProfile(profileData);
      });
    }).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to create profile');
    });
    expect(result.current.profile).toBe(null);
    expect(result.current.hasProfile).toBe(false);
  });

  it('throws error when creating profile without authenticated user', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useProfile());

    const profileData: Omit<UserProfile, 'uid'> = {
      level: 'Beginner',
      preferredLanguage: 'JavaScript',
      theme: 'light',
      streak: 0,
      lastActiveDate: '2024-01-15T10:00:00.000Z',
      totalXP: 0,
      solvedProblems: []
    };

    await expect(async () => {
      await act(async () => {
        await result.current.createProfile(profileData);
      });
    }).rejects.toThrow('User not authenticated');
  });

  it('updates profile successfully', async () => {
    mockUserService.getProfile.mockResolvedValue(mockProfile);
    mockUserService.updateProfile.mockResolvedValue();

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updates = { level: 'Advanced' as const, theme: 'light' as const };

    await act(async () => {
      await result.current.updateProfile(updates);
    });

    expect(mockUserService.updateProfile).toHaveBeenCalledWith('test-user-123', updates);
    expect(result.current.profile).toEqual({
      ...mockProfile,
      ...updates
    });
    expect(result.current.error).toBe(null);
  });

  it('handles profile update error', async () => {
    mockUserService.getProfile.mockResolvedValue(mockProfile);
    mockUserService.updateProfile.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updates = { level: 'Advanced' as const };

    await expect(async () => {
      await act(async () => {
        await result.current.updateProfile(updates);
      });
    }).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to update profile');
    });
  });

  it('throws error when updating profile without authenticated user', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useProfile());

    const updates = { level: 'Advanced' as const };

    await expect(async () => {
      await act(async () => {
        await result.current.updateProfile(updates);
      });
    }).rejects.toThrow('User not authenticated or profile not loaded');
  });

  it('throws error when updating profile without loaded profile', async () => {
    mockUserService.getProfile.mockResolvedValue(null);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updates = { level: 'Advanced' as const };

    await expect(async () => {
      await act(async () => {
        await result.current.updateProfile(updates);
      });
    }).rejects.toThrow('User not authenticated or profile not loaded');
  });

  it('refreshes profile successfully', async () => {
    mockUserService.getProfile
      .mockResolvedValueOnce(mockProfile)
      .mockResolvedValueOnce({ ...mockProfile, streak: 10 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile?.streak).toBe(5);

    await act(async () => {
      await result.current.refreshProfile();
    });

    expect(result.current.profile?.streak).toBe(10);
    expect(mockUserService.getProfile).toHaveBeenCalledTimes(2);
  });

  it('reloads profile when user changes', async () => {
    mockUserService.getProfile.mockResolvedValue(mockProfile);

    const { result, rerender } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockUserService.getProfile).toHaveBeenCalledWith('test-user-123');

    // Change user
    const newUser = { ...mockUser, uid: 'new-user-456' };
    mockUseAuth.mockReturnValue({
      user: newUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });

    rerender();

    await waitFor(() => {
      expect(mockUserService.getProfile).toHaveBeenCalledWith('new-user-456');
    });
  });
});