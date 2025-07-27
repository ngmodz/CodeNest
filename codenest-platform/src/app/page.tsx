'use client';

import { ProtectedRoute } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';

function DashboardContent() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              CodeNest Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user?.displayName || user?.email}
              </span>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🎉 Authentication System Working!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You have successfully signed in to CodeNest. The Firebase authentication system is now ready.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                  What&apos;s Next?
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>✅ Firebase Auth configuration complete</li>
                  <li>✅ Email/password and Google OAuth working</li>
                  <li>✅ Protected routes implemented</li>
                  <li>✅ Authentication context and hooks ready</li>
                  <li>✅ Unit tests passing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
