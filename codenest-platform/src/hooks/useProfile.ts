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

  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userProfile = await userService.getProfile(user.uid);
      setProfile(userProfile);
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