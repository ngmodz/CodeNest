'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function PracticePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Practice
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Solve coding problems and improve your skills
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Coding Interface Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              The practice interface with Monaco Editor, problem descriptions, and code execution is currently being developed.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-lg mx-auto">
              <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                What's Coming:
              </h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 text-left">
                <li>• Monaco Editor for code writing</li>
                <li>• Split-view problem interface</li>
                <li>• Real-time code execution</li>
                <li>• Test case validation</li>
                <li>• Multiple programming languages</li>
                <li>• Submission tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}