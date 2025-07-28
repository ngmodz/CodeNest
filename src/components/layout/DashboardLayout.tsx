'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen || isDesktop} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title will be handled by individual pages */}
            <div className="flex-1 lg:hidden"></div>

            {/* User info for desktop */}
            <div className="hidden lg:flex items-center space-x-4">
              {profileLoading ? (
                <div className="flex items-center space-x-3">
                  <LoadingSkeleton variant="avatar" />
                  <div>
                    <LoadingSkeleton variant="text" className="w-24 h-4 mb-1" />
                    <LoadingSkeleton variant="text" className="w-16 h-3" />
                  </div>
                </div>
              ) : profile ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Welcome back!
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {profile.streak} day streak • {profile.totalXP} XP
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.displayName?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}