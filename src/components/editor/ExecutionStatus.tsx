'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ExecutionStatusProps {
  status: 'idle' | 'compiling' | 'running' | 'completed' | 'error';
  language: string;
}

const statusMessages = {
  idle: 'Ready to run code',
  compiling: 'Compiling your code...',
  running: 'Running test cases...',
  completed: 'Execution completed',
  error: 'Execution failed'
};

const statusIcons = {
  idle: (
    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  compiling: (
    <svg className="w-5 h-5 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
  running: (
    <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  completed: (
    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

export default function ExecutionStatus({ status, language }: ExecutionStatusProps) {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');
  
  // Animation for loading dots
  useEffect(() => {
    if (status === 'compiling' || status === 'running') {
      const interval = setInterval(() => {
        setDots(prev => prev.length < 3 ? prev + '.' : '');
      }, 500);
      
      return () => clearInterval(interval);
    }
    
    setDots('');
  }, [status]);
  
  // Simulated progress bar for running status
  useEffect(() => {
    if (status === 'running') {
      const interval = setInterval(() => {
        setProgress(prev => {
          // Slowly increment but never reach 100%
          if (prev < 90) return prev + Math.random() * 5;
          return prev;
        });
      }, 300);
      
      return () => clearInterval(interval);
    } else if (status === 'completed') {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [status]);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-center">
        <div className="mr-3">
          {statusIcons[status]}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {statusMessages[status]}{status === 'compiling' || status === 'running' ? dots : ''}
          </h3>
          {(status === 'compiling' || status === 'running') && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {status === 'compiling' ? `Compiling ${language} code` : 'Executing against test cases'}
            </p>
          )}
        </div>
      </div>
      
      {(status === 'running' || status === 'completed') && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              style={{ width: `${progress}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
} 