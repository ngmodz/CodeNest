'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '@/types';
import { userService } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';

interface ProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
}

const SKILL_LEVELS = [
  {
    value: 'Beginner' as const,
    title: 'Beginner',
    description: 'New to programming or just starting out',
    icon: '🌱'
  },
  {
    value: 'Intermediate' as const,
    title: 'Intermediate',
    description: 'Comfortable with basic concepts, ready for challenges',
    icon: '🚀'
  },
  {
    value: 'Advanced' as const,
    title: 'Advanced',
    description: 'Experienced programmer looking for complex problems',
    icon: '⚡'
  }
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

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    level: '' as UserProfile['level'] | '',
    preferredLanguage: '' as UserProfile['preferredLanguage'] | '',
    theme: 'light' as UserProfile['theme']
  });

  const steps = [
    {
      title: 'Choose Your Skill Level',
      description: 'Help us personalize your coding experience',
      field: 'level' as const
    },
    {
      title: 'Select Preferred Language',
      description: 'Which programming language would you like to focus on?',
      field: 'preferredLanguage' as const
    },
    {
      title: 'Pick Your Theme',
      description: 'Choose your preferred interface theme',
      field: 'theme' as const
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!formData.level || !formData.preferredLanguage) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profileData: Omit<UserProfile, 'uid'> = {
        level: formData.level,
        preferredLanguage: formData.preferredLanguage,
        theme: formData.theme,
        streak: 0,
        lastActiveDate: new Date().toISOString(),
        totalXP: 0,
        solvedProblems: []
      };

      await userService.createProfile(user.uid, profileData);
      
      const completeProfile: UserProfile = {
        uid: user.uid,
        ...profileData
      };

      onComplete(completeProfile);
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number) => {
    const field = steps[step].field;
    return formData[field] !== '';
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-2xl"
      >
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome to CodeNest!
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {currentStepData.description}
          </p>

          {/* Step 0: Skill Level */}
          {currentStep === 0 && (
            <div className="space-y-4">
              {SKILL_LEVELS.map((level) => (
                <motion.button
                  key={level.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData({ ...formData, level: level.value })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    formData.level === level.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{level.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {level.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {level.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Step 1: Programming Language */}
          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {LANGUAGES.map((language) => (
                <motion.button
                  key={language.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, preferredLanguage: language.value })}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    formData.preferredLanguage === language.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-3xl block mb-2">{language.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {language.label}
                  </span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Step 2: Theme */}
          {currentStep === 2 && (
            <div className="grid grid-cols-2 gap-4">
              {THEMES.map((theme) => (
                <motion.button
                  key={theme.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, theme: theme.value })}
                  className={`p-6 rounded-lg border-2 text-center transition-all ${
                    formData.theme === theme.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-4xl block mb-3">{theme.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {theme.label}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg"
          >
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            disabled={!isStepValid(currentStep) || loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {loading ? (
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
                <span>Creating...</span>
              </span>
            ) : currentStep === steps.length - 1 ? (
              'Complete Setup'
            ) : (
              'Next'
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}