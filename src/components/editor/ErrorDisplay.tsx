'use client';

import React from 'react';
import { ProgrammingLanguage } from '@/types';
import { motion } from 'framer-motion';
import CodeEditor from './CodeEditor';

interface ErrorDisplayProps {
  error: string;
  language: ProgrammingLanguage;
}

export default function ErrorDisplay({ error, language }: ErrorDisplayProps) {
  // Extract line number if error message contains it
  const errorLines = error.split('\n');
  const lineNumberRegex = /:(\d+)(?::|$)/;
  
  // Try to extract line and column information from common error formats
  let lineNumber: number | null = null;
  let errorMessage = error;
  
  // Process error message to extract line numbers
  for (const line of errorLines) {
    const match = line.match(lineNumberRegex);
    if (match && match[1]) {
      lineNumber = parseInt(match[1], 10);
      break;
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-red-300 dark:border-red-800 rounded-md overflow-hidden"
    >
      <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 border-b border-red-300 dark:border-red-800">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">
            Compilation Error
          </h3>
        </div>
      </div>
      
      <div className="p-4 bg-white dark:bg-gray-900">
        {lineNumber ? (
          <div className="mb-2 flex items-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-red-600 dark:text-red-400">
              Error at line {lineNumber}
            </span>
          </div>
        ) : null}
        
        {/* Use syntax highlighting for the error message */}
        <div className="max-h-64 overflow-y-auto rounded-md">
          <CodeEditor
            language={language}
            code={error}
            onChange={() => {}} // Read-only
            height="auto"
            readOnly={true}
          />
        </div>
        
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-1 font-medium">Common fixes:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Check for syntax errors like missing brackets or semicolons</li>
            <li>Verify variable declarations before usage</li>
            <li>Ensure function calls have the correct number of arguments</li>
            <li>Look for type mismatches in expressions</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
} 