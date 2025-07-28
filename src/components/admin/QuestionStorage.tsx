'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';

interface StoredQuestion {
  id: string;
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
  metadata: {
    createdAt: string;
    createdBy: string;
    isPublished: boolean;
  };
}

export function QuestionStorage() {
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user's auth token
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('Authentication required');
      }
      
      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/questions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load questions');
      }

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
      // For now, show mock data if API fails
      setQuestions(mockQuestions);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const selectAllQuestions = () => {
    const filteredQuestionIds = filteredQuestions.map(q => q.id);
    setSelectedQuestions(new Set(filteredQuestionIds));
  };

  const clearSelection = () => {
    setSelectedQuestions(new Set());
  };

  const deleteSelectedQuestions = async () => {
    if (selectedQuestions.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedQuestions.size} question(s)?`)) {
      return;
    }

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('Authentication required');
      }
      
      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/questions/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionIds: Array.from(selectedQuestions),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete questions');
      }

      // Remove deleted questions from local state
      setQuestions(prevQuestions => 
        prevQuestions.filter(q => !selectedQuestions.has(q.id))
      );
      setSelectedQuestions(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete questions');
    }
  };

  const publishQuestion = async (questionId: string) => {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('Authentication required');
      }
      
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`/api/questions/${questionId}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish question');
      }

      // Update local state
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q.id === questionId
            ? { ...q, metadata: { ...q.metadata, isPublished: true } }
            : q
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish question');
    }
  };

  // Filter questions based on search and filters
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.topic.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = filterDifficulty === 'all' || question.difficulty === filterDifficulty;
    const matchesTopic = filterTopic === 'all' || question.topic === filterTopic;

    return matchesSearch && matchesDifficulty && matchesTopic;
  });

  // Get unique topics for filter
  const uniqueTopics = Array.from(new Set(questions.map(q => q.topic))).sort();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Question Storage
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and organize your generated coding questions
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <div className="text-red-700 dark:text-red-300">{error}</div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Difficulty Filter */}
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Difficulties</option>
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          {/* Topic Filter */}
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Topics</option>
            {uniqueTopics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedQuestions.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
            <span className="text-blue-700 dark:text-blue-300">
              {selectedQuestions.size} question(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Clear
              </button>
              <button
                onClick={deleteSelectedQuestions}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredQuestions.length} of {questions.length} questions
          </div>
          
          {filteredQuestions.length > 0 && (
            <button
              onClick={selectAllQuestions}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Select All
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium mb-2">No Questions Found</h3>
            <p>
              {searchTerm || filterDifficulty !== 'all' || filterTopic !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Generate some questions to get started'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedQuestions.has(question.id)}
                  onChange={() => toggleQuestionSelection(question.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {question.title}
                      </h3>
                      
                      <div className="flex items-center space-x-4 mb-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          question.difficulty === 'Basic' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                          question.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {question.difficulty}
                        </span>
                        
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {question.topic}
                        </span>
                        
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          {question.testCases.length} test cases
                        </span>

                        {question.metadata.isPublished && (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                            Published
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {question.description.substring(0, 150)}...
                      </p>
                      
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        Created {new Date(question.metadata.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {!question.metadata.isPublished && (
                        <button
                          onClick={() => publishQuestion(question.id)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:border-blue-400 dark:text-blue-400 dark:border-blue-600"
                        >
                          Publish
                        </button>
                      )}
                      
                      <button
                        onClick={() => {/* TODO: Open question details */}}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded hover:border-gray-400 dark:text-gray-400 dark:border-gray-600"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Mock data for development - remove when API is ready
const mockQuestions: StoredQuestion[] = [
  {
    id: '1',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'Basic',
    topic: 'Arrays',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false },
      { input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: true }
    ],
    hints: ['Try using a hash map to store complements'],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    metadata: {
      createdAt: '2025-01-28T10:00:00Z',
      createdBy: 'admin',
      isPublished: true
    }
  },
  {
    id: '2',
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    difficulty: 'Basic',
    topic: 'Strings',
    examples: [
      {
        input: 's = "()"',
        output: 'true'
      }
    ],
    constraints: ['1 <= s.length <= 10^4'],
    testCases: [
      { input: '"()"', expectedOutput: 'true', isHidden: false },
      { input: '"()[]{}"\t', expectedOutput: 'true', isHidden: false },
      { input: '"(]"', expectedOutput: 'false', isHidden: true }
    ],
    metadata: {
      createdAt: '2025-01-28T09:00:00Z',
      createdBy: 'admin',
      isPublished: false
    }
  }
];
