'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from './AuthModal';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
        ></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Show authentication modal by default
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to CodeNest
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Please sign in to access your coding practice platform
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // If authentication is not required or user is authenticated
  return <>{children}</>;
}

// Higher-order component version for easier usage
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requireAuth?: boolean }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requireAuth={options?.requireAuth}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}