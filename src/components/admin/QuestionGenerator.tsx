'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';

interface GenerateQuestionRequest {
  userLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  topic: string;
  previousProblems?: string[];
}

interface GeneratedQuestion {
  title: string;
  description: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  topic: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
  hints?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
}

interface QuestionGeneratorProps {
  onQuestionGenerated: (question: GeneratedQuestion) => void;
  onSwitchToPreview: () => void;
}

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

const TOPICS_BY_LEVEL = {
  Beginner: ['Loops', 'Strings', 'Lists', 'Variables', 'Conditionals'],
  Intermediate: ['Recursion', 'Dictionaries', 'Sorting', 'Two Pointers', 'Binary Search'],
  Advanced: ['Trees', 'Dynamic Programming', 'Graphs', 'Backtracking', 'Greedy'],
};

export function QuestionGenerator({ onQuestionGenerated, onSwitchToPreview }: QuestionGeneratorProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<GenerateQuestionRequest>({
    userLevel: 'Beginner',
    topic: 'Loops',
    previousProblems: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousProblemsText, setPreviousProblemsText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get user's auth token from Firebase auth
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('Authentication required');
      }
      
      const token = await firebaseUser.getIdToken();

      // Parse previous problems from text
      const previousProblems = previousProblemsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const requestBody = {
        ...formData,
        previousProblems,
      };

      const response = await fetch('/api/generateQuestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate question');
      }

      const data = await response.json();
      if (data.success && data.question) {
        onQuestionGenerated(data.question);
        onSwitchToPreview();
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const availableTopics = TOPICS_BY_LEVEL[formData.userLevel];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI Question Generator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Generate coding questions using AI based on difficulty level and topic
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Difficulty Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  setFormData({ 
                    ...formData, 
                    userLevel: level,
                    topic: TOPICS_BY_LEVEL[level][0]
                  });
                }}
                className={`p-3 text-center rounded-lg border transition-colors ${
                  formData.userLevel === level
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="font-medium">{level}</div>
                <div className="text-sm opacity-75">
                  {level === 'Beginner' && 'Basic concepts'}
                  {level === 'Intermediate' && 'Problem solving'}
                  {level === 'Advanced' && 'Complex algorithms'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Topic Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Topic
          </label>
          <select
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {availableTopics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        {/* Previous Problems */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Previous Problems to Avoid (Optional)
          </label>
          <textarea
            value={previousProblemsText}
            onChange={(e) => setPreviousProblemsText(e.target.value)}
            placeholder="Enter problem titles, one per line&#10;Example:&#10;Two Sum&#10;Reverse String&#10;Valid Parentheses"
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI will try to avoid generating questions similar to these
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Generation Error
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Generating Question...
              </div>
            ) : (
              'Generate Question'
            )}
          </button>
        </div>
      </form>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 How it works
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Select the difficulty level and topic for the question</li>
          <li>• Optionally add previous problems to avoid duplicates</li>
          <li>• AI will generate a unique coding question with test cases</li>
          <li>• Review and edit the question in the Preview tab before saving</li>
        </ul>
      </div>
    </div>
  );
}
