'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [preferredLanguage, setPreferredLanguage] = useState<'JavaScript' | 'Python' | 'Java' | 'C++' | 'C'>('JavaScript');
  
  // Initialize form with user data when it loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
    
    if (profile) {
      setSkillLevel(profile.level);
      setPreferredLanguage(profile.preferredLanguage);
    }
  }, [user, profile]);

  const handleSaveChanges = async () => {
    try {
      // Update profile logic would go here
      await updateProfile({
        level: skillLevel,
        preferredLanguage: preferredLanguage
      });
      // Could add a success notification here
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Could add an error notification here
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Account Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="display-name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <input
                    id="display-name-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Coding Preferences
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="skill-level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Skill Level
                  </label>
                  <select 
                    id="skill-level"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')}
                  >
                    <option key="Beginner" value="Beginner">Beginner</option>
                    <option key="Intermediate" value="Intermediate">Intermediate</option>
                    <option key="Advanced" value="Advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="preferred-language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Language
                  </label>
                  <select 
                    id="preferred-language"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as 'JavaScript' | 'Python' | 'Java' | 'C++' | 'C')}
                  >
                    <option key="JavaScript" value="JavaScript">JavaScript</option>
                    <option key="Python" value="Python">Python</option>
                    <option key="Java" value="Java">Java</option>
                    <option key="C++" value="C++">C++</option>
                    <option key="C" value="C">C</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Appearance
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Theme
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose your preferred color scheme
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
                Cancel
              </button>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {user?.displayName?.[0] || (user?.email && user.email[0].toUpperCase()) || 'U'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.displayName || 'Developer User'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile?.level || 'Intermediate'} Developer
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Stats
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total XP</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile?.totalXP || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Problems Solved</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile?.solvedProblems?.length || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Streak</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile?.streak || 0} days
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Today
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Account Actions
              </h3>
              
              <div className="space-y-3">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  Export Data
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  Reset Progress
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}