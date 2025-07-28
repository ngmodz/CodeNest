'use client';

import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button';
  lines?: number;
}

export function LoadingSkeleton({ 
  className = '', 
  variant = 'text',
  lines = 1 
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';
  
  const variants = {
    text: 'h-4',
    card: 'h-32',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10'
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${variants.text}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: index * 0.1
            }}
            style={{
              width: index === lines - 1 ? '75%' : '100%'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatType: 'reverse'
      }}
    />
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className = '' }: CardSkeletonProps) {
  return (
    <div className={`p-6 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <LoadingSkeleton variant="text" className="mb-4" />
      <LoadingSkeleton variant="text" lines={3} className="mb-4" />
      <LoadingSkeleton variant="button" className="w-24" />
    </div>
  );
}

interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className = '' }: DashboardSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <LoadingSkeleton variant="text" className="w-48 h-8" />
        <LoadingSkeleton variant="avatar" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
      
      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton className="h-64" />
        <CardSkeleton className="h-64" />
      </div>
    </div>
  );
}