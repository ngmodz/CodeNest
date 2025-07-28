'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';
import { DailyChallenge } from '@/components/dashboard/DailyChallenge';
import { TopicFilter } from '@/components/dashboard/TopicFilter';
import { ProgressDisplay } from '@/components/dashboard/ProgressDisplay';
import { useProfile } from '@/hooks/useProfile';

export default function DashboardPage() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back! Ready to code today?
          </p>
        </div>

        {/* Progress Display */}
        <ProgressDisplay />

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Challenge */}
          <DailyChallenge />

          {/* Topic Filter */}
          <TopicFilter 
            onTopicSelect={(topic) => {
              console.log('Selected topic:', topic);
              // TODO: Navigate to practice page with topic filter
            }}
            onDifficultySelect={(difficulty) => {
              console.log('Selected difficulty:', difficulty);
              // TODO: Navigate to practice page with difficulty filter
            }}
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Profile setup completed
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome to CodeNest!
              </p>
            </div>
            {profile?.solvedProblems && profile.solvedProblems.length > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Solved {profile.solvedProblems.length} problems
                </p>
              </div>
            )}
            {profile?.streak && profile.streak > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profile.streak} day coding streak! 🔥
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}