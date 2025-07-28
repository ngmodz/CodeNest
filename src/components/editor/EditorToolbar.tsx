'use client';

import React from 'react';
import LanguageSelector from './LanguageSelector';
import { ProgrammingLanguage } from '@/types';

interface EditorToolbarProps {
  language: ProgrammingLanguage;
  onLanguageChange: (language: ProgrammingLanguage) => void;
  onRun: () => void;
  onSubmit: () => void;
  isProcessing?: boolean;
  readOnly?: boolean;
}

export default function EditorToolbar({
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  isProcessing = false,
  readOnly = false
}: EditorToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <LanguageSelector 
        selectedLanguage={language}
        onLanguageChange={onLanguageChange}
        disabled={readOnly || isProcessing}
      />
      
      <div className="flex space-x-2 mt-2 sm:mt-0">
        <button
          onClick={onRun}
          disabled={isProcessing || readOnly}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Running...' : 'Run Code'}
        </button>
        
        <button
          onClick={onSubmit}
          disabled={isProcessing || readOnly}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
} 