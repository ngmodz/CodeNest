'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ChallengePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Daily Challenge 🔥
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Take on today's coding challenge and maintain your streak
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Challenge Status */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Today's Challenge
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Daily challenges with AI-generated problems are being developed. This will include personalized difficulty based on your skill level.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Features in Development:
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• AI-generated daily problems</li>
                    <li>• Difficulty matching your skill level</li>
                    <li>• Streak tracking and rewards</li>
                    <li>• Challenge history and statistics</li>
                    <li>• Milestone celebrations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Current Streak
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  5
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  days in a row
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                This Week
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {day}
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      index < 5 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {index < 5 ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}