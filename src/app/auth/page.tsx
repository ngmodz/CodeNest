'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm, SignUpForm } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if already authenticated
  if (user) {
    router.push('/');
    return null;
  }

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {mode === 'signin' ? (
        <SignInForm
          onSuccess={handleSuccess}
          onSwitchToSignUp={() => setMode('signup')}
        />
      ) : (
        <SignUpForm
          onSuccess={handleSuccess}
          onSwitchToSignIn={() => setMode('signin')}
        />
      )}
    </div>
  );
}