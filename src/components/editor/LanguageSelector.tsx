'use client';

import React from 'react';
import { ProgrammingLanguage, PROGRAMMING_LANGUAGES } from '@/types';

interface LanguageSelectorProps {
  selectedLanguage: ProgrammingLanguage;
  onLanguageChange: (language: ProgrammingLanguage) => void;
  disabled?: boolean;
}

export default function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  disabled = false
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="language-selector" className="text-sm font-medium text-gray-700 dark:text-gray-200">
        Language:
      </label>
      <select
        id="language-selector"
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value as ProgrammingLanguage)}
        disabled={disabled}
        className="block w-32 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {PROGRAMMING_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
} 