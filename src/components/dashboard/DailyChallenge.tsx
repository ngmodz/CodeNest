'use client';

import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface DailyChallengeProps {
  className?: string;
}

export function DailyChallenge({ className = '' }: DailyChallengeProps) {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <LoadingSkeleton variant="text" className="w-48 h-6 mb-4" />
        <LoadingSkeleton variant="text" lines={3} className="mb-4" />
        <LoadingSkeleton variant="button" className="w-32" />
      </div>
    );
  }

  // Mock daily challenge data based on user level
  const getDailyChallengeByLevel = () => {
    const challenges = {
      Beginner: {
        title: "Sum of Two Numbers",
        description: "Write a function that takes two numbers and returns their sum. This is a great way to practice basic function syntax and arithmetic operations.",
        difficulty: "Basic",
        estimatedTime: "5-10 minutes",
        topic: "Basic Math",
        points: 10
      },
      Intermediate: {
        title: "Find Missing Number",
        description: "Given an array containing n distinct numbers taken from 0, 1, 2, ..., n, find the one that is missing from the array.",
        difficulty: "Intermediate", 
        estimatedTime: "15-20 minutes",
        topic: "Arrays",
        points: 25
      },
      Advanced: {
        title: "Binary Tree Maximum Path Sum",
        description: "Given a non-empty binary tree, find the maximum path sum. A path is defined as any sequence of nodes from some starting node to any node in the tree along the parent-child connections.",
        difficulty: "Advanced",
        estimatedTime: "30-45 minutes", 
        topic: "Trees",
        points: 50
      }
    };

    return challenges[profile?.level || 'Beginner'];
  };

  const challenge = getDailyChallengeByLevel();

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">🔥</span>
          Daily Challenge
        </h2>
        <div className="flex items-center space-x-2">
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${challenge.difficulty === 'Basic' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : ''}
            ${challenge.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : ''}
            ${challenge.difficulty === 'Advanced' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : ''}
          `}>
            {challenge.difficulty}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            +{challenge.points} XP
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {challenge.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          {challenge.description}
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {challenge.estimatedTime}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {challenge.topic}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Complete today's challenge to maintain your {profile?.streak || 0} day streak!
        </div>
        <motion.button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Challenge
        </motion.button>
      </div>
    </motion.div>
  );
}