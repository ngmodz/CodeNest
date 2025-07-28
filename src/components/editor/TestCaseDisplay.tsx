'use client';

import React, { useState } from 'react';
import { TestCase, Example } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface TestCaseDisplayProps {
  examples: Example[];
  testCases?: TestCase[];
  showHiddenTests?: boolean;
  className?: string;
}

export default function TestCaseDisplay({
  examples,
  testCases = [],
  showHiddenTests = false,
  className = ''
}: TestCaseDisplayProps) {
  const [activeTab, setActiveTab] = useState<'examples' | 'test-cases'>('examples');
  const [expandedExample, setExpandedExample] = useState<number>(0);
  const [expandedTestCase, setExpandedTestCase] = useState<number | null>(null);

  // Filter test cases based on visibility
  const visibleTestCases = testCases.filter(tc => !tc.isHidden || showHiddenTests);
  const publicTestCases = testCases.filter(tc => !tc.isHidden);
  const hiddenTestCases = testCases.filter(tc => tc.isHidden);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('examples')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'examples'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Examples ({examples.length})
        </button>
        {publicTestCases.length > 0 && (
          <button
            onClick={() => setActiveTab('test-cases')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'test-cases'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Test Cases ({publicTestCases.length}
            {showHiddenTests && hiddenTestCases.length > 0 && ` + ${hiddenTestCases.length} hidden`})
          </button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'examples' && (
          <motion.div
            key="examples"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {examples.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No examples available for this problem.</p>
              </div>
            ) : (
              examples.map((example, index) => (
                <ExampleCard
                  key={index}
                  example={example}
                  index={index}
                  isExpanded={expandedExample === index}
                  onToggle={() => setExpandedExample(expandedExample === index ? -1 : index)}
                />
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'test-cases' && (
          <motion.div
            key="test-cases"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {visibleTestCases.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No test cases available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Public Test Cases */}
                {publicTestCases.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Public Test Cases
                    </h4>
                    <div className="space-y-2">
                      {publicTestCases.map((testCase, index) => (
                        <TestCaseCard
                          key={index}
                          testCase={testCase}
                          index={index}
                          isExpanded={expandedTestCase === index}
                          onToggle={() => setExpandedTestCase(expandedTestCase === index ? null : index)}
                          isHidden={false}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden Test Cases (only shown if showHiddenTests is true) */}
                {showHiddenTests && hiddenTestCases.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Hidden Test Cases
                    </h4>
                    <div className="space-y-2">
                      {hiddenTestCases.map((testCase, index) => (
                        <TestCaseCard
                          key={`hidden-${index}`}
                          testCase={testCase}
                          index={publicTestCases.length + index}
                          isExpanded={expandedTestCase === publicTestCases.length + index}
                          onToggle={() => {
                            const targetIndex = publicTestCases.length + index;
                            setExpandedTestCase(expandedTestCase === targetIndex ? null : targetIndex);
                          }}
                          isHidden={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ExampleCardProps {
  example: Example;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExampleCard({ example, index, isExpanded, onToggle }: ExampleCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div
        className="px-4 py-3 bg-gray-50 dark:bg-gray-800 cursor-pointer flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={onToggle}
      >
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Example {index + 1}
        </h4>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</p>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto border">
                  {example.input}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Output:</p>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto border">
                  {example.output}
                </pre>
              </div>
              {example.explanation && (
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Explanation:</p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-blue-800">
                    {example.explanation}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TestCaseCardProps {
  testCase: TestCase;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isHidden: boolean;
}

function TestCaseCard({ testCase, index, isExpanded, onToggle, isHidden }: TestCaseCardProps) {
  return (
    <div className={`border rounded-lg overflow-hidden ${
      isHidden 
        ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div
        className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors ${
          isHidden
            ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center">
          {isHidden && (
            <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Test Case {index + 1} {isHidden && '(Hidden)'}
          </h4>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</p>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto border">
                  {testCase.input}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output:</p>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto border">
                  {testCase.expectedOutput}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
