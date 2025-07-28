'use client';

import React from 'react';
import { TestResult, ProgrammingLanguage, SubmissionStatus } from '@/types';
import ExecutionResult from './ExecutionResult';
import ErrorDisplay from './ErrorDisplay';
import ExecutionStatus from './ExecutionStatus';

interface OutputDisplayProps {
  results?: TestResult[] | null;
  compilationError?: string | null;
  isLoading?: boolean;
  executionTime?: number;
  memoryUsage?: number;
  status?: SubmissionStatus;
  isSubmission?: boolean;
  executionStatus?: 'idle' | 'compiling' | 'running' | 'completed' | 'error';
  language: ProgrammingLanguage;
}

export default function OutputDisplay({ 
  results, 
  compilationError, 
  isLoading = false,
  executionTime,
  memoryUsage,
  status = 'Accepted',
  isSubmission = false,
  executionStatus = 'idle',
  language
}: OutputDisplayProps) {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 overflow-auto">
      {isLoading ? (
        <ExecutionStatus 
          status={executionStatus || 'running'} 
          language={language}
        />
      ) : compilationError ? (
        <ErrorDisplay 
          error={compilationError} 
          language={language}
        />
      ) : results && results.length > 0 ? (
        <ExecutionResult
          results={results}
          executionTime={executionTime}
          memoryUsage={memoryUsage}
          status={status}
          isSubmission={isSubmission}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-64">
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Run your code to see the results here
          </p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            onClick={() => {
              // This is just a visual cue, actual run functionality is in CodingInterface
              // It would be triggered by the parent component
            }}
          >
            Run Code
          </button>
        </div>
      )}
    </div>
  );
} 