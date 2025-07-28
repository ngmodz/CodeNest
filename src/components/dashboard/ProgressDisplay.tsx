'use client';

import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface ProgressDisplayProps {
  className?: string;
}

interface ProgressStat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
  description?: string;
}

export function ProgressDisplay({ className = '' }: ProgressDisplayProps) {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <LoadingSkeleton variant="text" className="w-32 h-6 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="text-center">
              <LoadingSkeleton variant="text" className="w-12 h-8 mb-2 mx-auto" />
              <LoadingSkeleton variant="text" className="w-16 h-4 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate XP progress to next level
  const getXPProgress = () => {
    const currentXP = profile?.totalXP || 0;
    const xpPerLevel = 100;
    const currentLevel = Math.floor(currentXP / xpPerLevel) + 1;
    const xpInCurrentLevel = currentXP % xpPerLevel;
    const xpToNextLevel = xpPerLevel - xpInCurrentLevel;
    const progressPercentage = (xpInCurrentLevel / xpPerLevel) * 100;

    return {
      currentLevel,
      xpInCurrentLevel,
      xpToNextLevel,
      progressPercentage,
      totalXP: currentXP
    };
  };

  const xpProgress = getXPProgress();

  // Format last active date
  const formatLastActive = () => {
    if (!profile?.lastActiveDate) return 'Never';
    
    const date = new Date(profile.lastActiveDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  const stats: ProgressStat[] = [
    {
      label: 'Current Streak',
      value: `${profile?.streak || 0}`,
      icon: '🔥',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      description: 'days in a row'
    },
    {
      label: 'Problems Solved',
      value: profile?.solvedProblems?.length || 0,
      icon: '✅',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: 'total completed'
    },
    {
      label: 'Current Level',
      value: xpProgress.currentLevel,
      icon: '⭐',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      description: `${xpProgress.xpToNextLevel} XP to next`
    },
    {
      label: 'Last Active',
      value: formatLastActive(),
      icon: '📅',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      description: 'last practice session'
    }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Your Progress
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {profile?.level || 'Beginner'} Level
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Level {xpProgress.currentLevel} Progress
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {xpProgress.xpInCurrentLevel}/100 XP
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress.progressPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {xpProgress.xpToNextLevel} XP needed for Level {xpProgress.currentLevel + 1}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-3`}>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {stat.label}
            </div>
            {stat.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {stat.description}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Achievement Badges */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Recent Achievements
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile?.streak && profile.streak >= 7 && (
            <motion.div
              className="flex items-center px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full text-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <span className="mr-1">🔥</span>
              Week Warrior
            </motion.div>
          )}
          {profile?.solvedProblems && profile.solvedProblems.length >= 10 && (
            <motion.div
              className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.1 }}
            >
              <span className="mr-1">🏆</span>
              Problem Solver
            </motion.div>
          )}
          {xpProgress.currentLevel >= 3 && (
            <motion.div
              className="flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.2 }}
            >
              <span className="mr-1">⭐</span>
              Rising Star
            </motion.div>
          )}
          {(!profile?.streak || profile.streak < 7) && (!profile?.solvedProblems || profile.solvedProblems.length < 10) && xpProgress.currentLevel < 3 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              Keep practicing to unlock achievements! 🎯
            </div>
          )}
        </div>
      </div>
    </div>
  );
}