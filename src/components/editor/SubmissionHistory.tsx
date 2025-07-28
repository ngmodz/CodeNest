'use client';

import React, { useState, useEffect } from 'react';
import { SubmissionDocument, TestResult } from '@/types';
import { submissionService } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface SubmissionHistoryProps {
  problemId?: string;
  className?: string;
  maxHeight?: string;
}

export default function SubmissionHistory({
  problemId,
  className = '',
  maxHeight = 'max-h-96'
}: SubmissionHistoryProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await submissionService.getUserSubmissions(user.uid, 50);
        
        if (result.success && result.data) {
          // Filter by problemId if provided
          const filteredSubmissions = problemId
            ? result.data.filter(sub => sub.problemId === problemId)
            : result.data;
          
          setSubmissions(filteredSubmissions);
        } else {
          setError(result.error?.message || 'Failed to fetch submissions');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user, problemId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'Wrong Answer':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'Time Limit Exceeded':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'Runtime Error':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'Compilation Error':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'Wrong Answer':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'Time Limit Exceeded':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Runtime Error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'Compilation Error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatTimestamp = (timestamp: any) => {
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const formatExecutionTime = (time?: number) => {
    if (time === undefined) return 'N/A';
    return `${time.toFixed(2)}ms`;
  };

  const formatMemoryUsage = (bytes?: number) => {
    if (bytes === undefined) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const calculatePassedTests = (testResults: TestResult[]) => {
    const passed = testResults.filter(result => result.passed).length;
    return `${passed}/${testResults.length}`;
  };

  if (!user) {
    return (
      <div className={`${className} text-center py-8`}>
        <p className="text-gray-500 dark:text-gray-400">Please sign in to view submission history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${className} space-y-3`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-red-600 dark:text-red-400">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium mb-1">No submissions yet</p>
          <p className="text-sm">
            {problemId ? 'No submissions for this problem' : 'Start solving problems to see your submission history'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`space-y-3 overflow-y-auto ${maxHeight}`}>
        <AnimatePresence>
          {submissions.map((submission) => (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div
                className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setExpandedSubmission(
                  expandedSubmission === submission.id ? null : submission.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center space-x-1 ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)}
                      <span>{submission.status}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {submission.language}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {calculatePassedTests(submission.testResults)} tests passed
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatExecutionTime(submission.executionTime)}</span>
                    <span>{formatMemoryUsage(submission.memoryUsage)}</span>
                    <span>{formatTimestamp(submission.submittedAt)}</span>
                    <svg
                      className={`w-4 h-4 transform transition-transform ${
                        expandedSubmission === submission.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedSubmission === submission.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-4 space-y-4">
                      {/* Code */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Submitted Code
                        </h4>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-60 border">
                          {submission.code}
                        </pre>
                      </div>

                      {/* Test Results Summary */}
                      {submission.testResults.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Test Results ({calculatePassedTests(submission.testResults)})
                          </h4>
                          <div className="space-y-2">
                            {submission.testResults.map((result, index) => (
                              <div
                                key={index}
                                className={`p-2 rounded border text-xs ${
                                  result.passed
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium ${
                                    result.passed 
                                      ? 'text-green-700 dark:text-green-300' 
                                      : 'text-red-700 dark:text-red-300'
                                  }`}>
                                    Test {index + 1}: {result.passed ? 'Passed' : 'Failed'}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {formatExecutionTime(result.executionTime)}
                                  </span>
                                </div>
                                {!result.passed && result.error && (
                                  <div className="mt-1 text-red-600 dark:text-red-400">
                                    Error: {result.error}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Submission Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Language:</span>
                          <div className="font-medium">{submission.language}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Execution Time:</span>
                          <div className="font-medium">{formatExecutionTime(submission.executionTime)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Memory Usage:</span>
                          <div className="font-medium">{formatMemoryUsage(submission.memoryUsage)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                          <div className="font-medium">{formatTimestamp(submission.submittedAt)}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
