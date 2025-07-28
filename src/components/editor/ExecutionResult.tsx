'use client';

import React from 'react';
import { TestResult, SubmissionStatus } from '@/types';
import { motion } from 'framer-motion';

interface ExecutionResultProps {
  results: TestResult[];
  executionTime?: number;
  memoryUsage?: number;
  status?: SubmissionStatus;
  isSubmission?: boolean;
}

export default function ExecutionResult({
  results,
  executionTime,
  memoryUsage,
  status = 'Accepted',
  isSubmission = false,
}: ExecutionResultProps) {
  // Calculate summary stats
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const allPassed = totalTests === passedTests;
  
  // Format memory usage to a readable format
  const formatMemory = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className={`p-4 rounded-md ${
        allPassed 
          ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' 
          : 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {allPassed ? (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 mr-3"
              >
                <svg className="w-5 h-5 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-800 mr-3"
              >
                <svg className="w-5 h-5 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.div>
            )}
            <div>
              <h3 className={`font-semibold ${allPassed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {isSubmission ? status : (allPassed ? 'All Tests Passed' : 'Some Tests Failed')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {passedTests} of {totalTests} tests passing
              </p>
            </div>
          </div>
          
          {(executionTime !== undefined || memoryUsage !== undefined) && (
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {executionTime !== undefined && (
                <div>Execution Time: {executionTime.toFixed(2)}ms</div>
              )}
              {memoryUsage !== undefined && (
                <div>Memory Usage: {formatMemory(memoryUsage)}</div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Detailed test results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <TestResultItem 
            key={index} 
            result={result} 
            index={index} 
            isSubmission={isSubmission}
          />
        ))}
      </div>
    </div>
  );
}

interface TestResultItemProps {
  result: TestResult;
  index: number;
  isSubmission: boolean;
}

function TestResultItem({ result, index, isSubmission }: TestResultItemProps) {
  const [expanded, setExpanded] = React.useState(!result.passed);
  
  return (
    <div className={`border rounded-md overflow-hidden ${
      result.passed 
        ? 'border-green-200 dark:border-green-900' 
        : 'border-red-200 dark:border-red-900'
    }`}>
      <div 
        className={`px-4 py-3 flex justify-between items-center cursor-pointer ${
          result.passed 
            ? 'bg-green-50 dark:bg-green-900/10' 
            : 'bg-red-50 dark:bg-red-900/10'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          {result.passed ? (
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className={`font-medium ${result.passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            Test Case {index + 1}: {result.passed ? 'Passed' : 'Failed'}
          </span>
        </div>
        
        <div className="flex items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
            {result.executionTime.toFixed(2)}ms
          </span>
          <svg 
            className={`w-5 h-5 text-gray-400 transform transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-200 dark:border-gray-700"
        >
          <div className="p-4 space-y-3">
            {/* Only show input for non-submissions or failures */}
            {(!isSubmission || !result.passed) && (
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {result.input}
                </pre>
              </div>
            )}
            
            {/* Only show expected/actual for failures */}
            {!result.passed && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output:</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                    {result.expectedOutput}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Your Output:</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                    {result.actualOutput}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Show output for passed tests */}
            {result.passed && (
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Output:</p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {result.actualOutput}
                </pre>
              </div>
            )}
            
            {/* Error message if any */}
            {result.error && (
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Error:</p>
                <pre className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs font-mono whitespace-pre-wrap overflow-x-auto text-red-800 dark:text-red-300">
                  {result.error}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
} 