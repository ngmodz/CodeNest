'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { userService } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  hasProfile: boolean;
  createProfile: (profileData: Omit<UserProfile, 'uid'>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TEMPORARY: Mock profile for development - remove when implementing real auth
  const SKIP_AUTH = true;
  const mockProfile: UserProfile = {
    uid: 'mock-user-123',
    level: 'Intermediate',
    preferredLanguage: 'JavaScript',
    theme: 'dark',
    streak: 5,
    lastActiveDate: new Date().toISOString(),
    totalXP: 1250,
    solvedProblems: ['problem-1', 'problem-2', 'problem-3'],
  };

  const loadProfile = async () => {
    if (SKIP_AUTH) {
      setProfile(mockProfile);
      setLoading(false);
      return;
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await userService.getProfile(user.uid);
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError(result.error?.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Omit<UserProfile, 'uid'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setError(null);

    try {
      await userService.createProfile(user.uid, profileData);
      const newProfile: UserProfile = {
        uid: user.uid,
        ...profileData
      };
      setProfile(newProfile);
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create profile');
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      throw new Error('User not authenticated or profile not loaded');
    }

    setError(null);

    try {
      await userService.updateProfile(user.uid, updates);
      setProfile({ ...profile, ...updates });
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      throw err;
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    hasProfile: profile !== null,
    createProfile,
    updateProfile,
    refreshProfile
  };
}