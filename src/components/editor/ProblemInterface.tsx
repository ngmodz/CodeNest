'use client';

import React, { useState } from 'react';
import { CodingProblem, ProgrammingLanguage } from '@/types';
import ProblemDescription from './ProblemDescription';
import CodingInterface from './CodingInterface';

interface ProblemInterfaceProps {
  problem: CodingProblem;
  initialCode?: string;
  readOnly?: boolean;
}

export default function ProblemInterface({
  problem,
  initialCode = '',
  readOnly = false
}: ProblemInterfaceProps) {
  // State for mobile view toggle
  const [showDescription, setShowDescription] = useState(true);

  return (
    <div className="h-full flex flex-col">
      {/* Mobile toggle controls - only visible on small screens */}
      <div className="lg:hidden flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowDescription(true)}
          className={`flex-1 py-3 text-center font-medium text-sm ${
            showDescription
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Problem
        </button>
        <button
          onClick={() => setShowDescription(false)}
          className={`flex-1 py-3 text-center font-medium text-sm ${
            !showDescription
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Code
        </button>
      </div>

      {/* Main content area with responsive split view */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Problem description panel - hidden on mobile when not active */}
        <div 
          className={`
            ${showDescription ? 'flex' : 'hidden'} lg:flex lg:w-1/2 
            border-r border-gray-200 dark:border-gray-700
            flex-col overflow-hidden
          `}
        >
          <ProblemDescription problem={problem} />
        </div>

        {/* Coding interface panel - hidden on mobile when description is shown */}
        <div 
          className={`
            ${!showDescription ? 'flex' : 'hidden'} lg:flex lg:w-1/2 
            flex-col overflow-hidden
          `}
        >
          <CodingInterface 
            initialCode={initialCode} 
            problemId={problem.id}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
} 