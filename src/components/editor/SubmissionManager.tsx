// Submission management component for handling code execution and evaluation
'use client';

import React, { useState, useEffect } from 'react';
import { TestCase, TestResult } from '@/types';
import { useSubmission } from '@/hooks/useSubmission';
import { motion, AnimatePresence } from 'framer-motion';
import ExecutionResult from './ExecutionResult';

interface SubmissionManagerProps {
  code: string;
  language: string;
  problemId: string;
  testCases: TestCase[];
  onSubmissionComplete?: (submissionId: string, verdict: string) => void;
  onRunComplete?: (results: TestResult[]) => void;
  className?: string;
}

export default function SubmissionManager({
  code,
  language,
  problemId,
  testCases,
  onSubmissionComplete,
  onRunComplete,
  className = ''
}: SubmissionManagerProps) {
  const {
    isRunning,
    isSubmitting,
    runResults,
    submissionResult,
    error,
    executionTime,
    memoryUsage,
    runCode,
    submitCode,
    clearResults,
    clearError
  } = useSubmission();

  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'run' | 'submit'>('run');

  // Show results when they become available
  useEffect(() => {
    if (runResults || submissionResult) {
      setShowResults(true);
    }
  }, [runResults, submissionResult]);

  // Notify parent components of completion
  useEffect(() => {
    if (runResults && onRunComplete) {
      onRunComplete(runResults);
    }
  }, [runResults, onRunComplete]);

  useEffect(() => {
    if (submissionResult?.success && submissionResult.submissionId && submissionResult.verdict) {
      onSubmissionComplete?.(submissionResult.submissionId, submissionResult.verdict);
    }
  }, [submissionResult, onSubmissionComplete]);

  const handleRun = async () => {
    clearError();
    setActiveTab('run');
    await runCode(code, language, testCases);
  };

  const handleSubmit = async () => {
    clearError();
    setActiveTab('submit');
    await submitCode(code, language, problemId, testCases);
  };

  const handleClearResults = () => {
    clearResults();
    setShowResults(false);
  };

  const getVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case 'Accepted':
        return 'text-green-600 dark:text-green-400';
      case 'Wrong Answer':
        return 'text-red-600 dark:text-red-400';
      case 'Time Limit Exceeded':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'Runtime Error':
        return 'text-orange-600 dark:text-orange-400';
      case 'Compilation Error':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getVerdictIcon = (verdict?: string) => {
    switch (verdict) {
      case 'Accepted':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'Wrong Answer':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const publicTestCases = testCases.filter(tc => !tc.isHidden);
  const hasPublicTests = publicTestCases.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting || !hasPublicTests}
            className={`px-4 py-2 rounded-md font-medium transition-all flex items-center space-x-2 ${
              !hasPublicTests
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : isRunning
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            }`}
            title={!hasPublicTests ? 'No public test cases available' : ''}
          >
            {isRunning ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Running...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-10-9h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
                </svg>
                <span>Run ({publicTestCases.length} tests)</span>
              </>
            )}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className={`px-4 py-2 rounded-md font-medium transition-all flex items-center space-x-2 ${
              isSubmitting
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Submit ({testCases.length} tests)</span>
              </>
            )}
          </button>
        </div>

        {(runResults || submissionResult) && (
          <button
            onClick={handleClearResults}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4"
          >
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <h4 className="text-red-800 dark:text-red-200 font-medium">Error</h4>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 ml-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display */}
      <AnimatePresence>
        {showResults && (runResults || submissionResult) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Submission Result Header */}
            {submissionResult?.success && (
              <div className={`p-4 rounded-lg border ${
                submissionResult.verdict === 'Accepted'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${getVerdictColor(submissionResult.verdict)}`}>
                      {getVerdictIcon(submissionResult.verdict)}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${getVerdictColor(submissionResult.verdict)}`}>
                        {submissionResult.verdict}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Submission ID: {submissionResult.submissionId}
                      </p>
                    </div>
                  </div>
                  
                  {submissionResult.executionStats && (
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>Avg Time: {submissionResult.executionStats.averageExecutionTime.toFixed(2)}ms</div>
                      <div>Max Time: {submissionResult.executionStats.maxExecutionTime.toFixed(2)}ms</div>
                      <div>Avg Memory: {(submissionResult.executionStats.averageMemoryUsage / 1024).toFixed(2)}KB</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Test Results */}
            {(runResults || submissionResult?.testResults) && (
              <ExecutionResult
                results={runResults || submissionResult?.testResults || []}
                executionTime={executionTime || undefined}
                memoryUsage={memoryUsage || undefined}
                status={submissionResult?.verdict}
                isSubmission={activeTab === 'submit'}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Messages */}
      {!hasPublicTests && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-yellow-800 dark:text-yellow-200 font-medium">No Public Test Cases</h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                This problem has no public test cases available for running. You can only submit your solution for evaluation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
