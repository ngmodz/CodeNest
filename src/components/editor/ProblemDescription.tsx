'use client';

import React from 'react';
import { CodingProblem, Example as ExampleType } from '@/types';

interface ProblemDescriptionProps {
  problem: CodingProblem;
}

export default function ProblemDescription({ problem }: ProblemDescriptionProps) {
  return (
    <div className="p-4 overflow-y-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">{problem.title}</h1>
      
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          problem.difficulty === 'Basic' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : problem.difficulty === 'Intermediate' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {problem.difficulty}
        </span>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {problem.topic}
        </span>
      </div>
      
      <div className="prose dark:prose-invert max-w-none mb-6">
        <p className="whitespace-pre-line">{problem.description}</p>
      </div>
      
      {problem.constraints.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Constraints</h3>
          <ul className="list-disc pl-5 space-y-1">
            {problem.constraints.map((constraint, index) => (
              <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                {constraint}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {problem.examples.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Examples</h3>
          <div className="space-y-4">
            {problem.examples.map((example, index) => (
              <Example key={index} example={example} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ExampleProps {
  example: ExampleType;
  index: number;
}

function Example({ example, index }: ExampleProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="font-medium">Example {index + 1}</span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm font-mono whitespace-pre-wrap">
            {example.input}
          </pre>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output:</p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm font-mono whitespace-pre-wrap">
            {example.output}
          </pre>
        </div>
        {example.explanation && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explanation:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {example.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 