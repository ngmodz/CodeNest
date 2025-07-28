'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '@/types';
import { userService } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';

interface ProfileManagerProps {
  initialProfile?: UserProfile;
  onProfileUpdate?: (profile: UserProfile) => void;
}

const SKILL_LEVELS = [
  { value: 'Beginner' as const, label: 'Beginner', icon: '🌱' },
  { value: 'Intermediate' as const, label: 'Intermediate', icon: '🚀' },
  { value: 'Advanced' as const, label: 'Advanced', icon: '⚡' }
];

const LANGUAGES = [
  { value: 'Python' as const, label: 'Python', icon: '🐍' },
  { value: 'JavaScript' as const, label: 'JavaScript', icon: '🟨' },
  { value: 'Java' as const, label: 'Java', icon: '☕' },
  { value: 'C++' as const, label: 'C++', icon: '⚙️' },
  { value: 'C' as const, label: 'C', icon: '🔧' }
];

const THEMES = [
  { value: 'light' as const, label: 'Light', icon: '☀️' },
  { value: 'dark' as const, label: 'Dark', icon: '🌙' }
];

export default function ProfileManager({ initialProfile, onProfileUpdate }: ProfileManagerProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    level: initialProfile?.level || 'Beginner' as UserProfile['level'],
    preferredLanguage: initialProfile?.preferredLanguage || 'Python' as UserProfile['preferredLanguage'],
    theme: initialProfile?.theme || 'light' as UserProfile['theme']
  });

  useEffect(() => {
    if (!initialProfile && user) {
      loadProfile();
    }
  }, [user, initialProfile]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await userService.getProfile(user.uid);
      if (result.success && result.data) {
        const userProfile = result.data;
        setProfile(userProfile);
        setFormData({
          level: userProfile.level,
          preferredLanguage: userProfile.preferredLanguage,
          theme: userProfile.theme
        });
      } else {
        setError(result.error?.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updates = {
        level: formData.level,
        preferredLanguage: formData.preferredLanguage,
        theme: formData.theme
      };

      await userService.updateProfile(user.uid, updates);
      
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      
      setSuccessMessage('Profile updated successfully!');
      onProfileUpdate?.(updatedProfile);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!profile) return false;
    return (
      profile.level !== formData.level ||
      profile.preferredLanguage !== formData.preferredLanguage ||
      profile.theme !== formData.theme
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 dark:text-gray-300">Profile not found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Profile Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your coding preferences and account settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Skill Level Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Skill Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SKILL_LEVELS.map((level) => (
              <motion.button
                key={level.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFormData({ ...formData, level: level.value })}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  formData.level === level.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <span className="text-xl block mb-1">{level.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {level.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Preferred Language Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Preferred Programming Language
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {LANGUAGES.map((language) => (
              <motion.button
                key={language.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFormData({ ...formData, preferredLanguage: language.value })}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  formData.preferredLanguage === language.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <span className="text-xl block mb-1">{language.icon}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {language.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Theme Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Interface Theme
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {THEMES.map((theme) => (
              <motion.button
                key={theme.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFormData({ ...formData, theme: theme.value })}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  formData.theme === theme.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <span className="text-2xl block mb-2">{theme.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {theme.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Profile Stats */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Your Progress
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {profile.streak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Day Streak
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {profile.totalXP}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total XP
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {profile.solvedProblems.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Problems Solved
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {new Date(profile.lastActiveDate).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Last Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg"
        >
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg"
        >
          <p className="text-green-700 dark:text-green-300 text-sm">{successMessage}</p>
        </motion.div>
      )}

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={!hasChanges() || saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Saving...</span>
            </span>
          ) : (
            'Save Changes'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}