'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';

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

interface QuestionPreviewProps {
  question: GeneratedQuestion | null;
  onQuestionUpdated: (question: GeneratedQuestion) => void;
  onSwitchToStorage: () => void;
}

export function QuestionPreview({ question, onQuestionUpdated, onSwitchToStorage }: QuestionPreviewProps) {
  const [editedQuestion, setEditedQuestion] = useState<GeneratedQuestion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (question) {
      setEditedQuestion({ ...question });
    }
  }, [question]);

  const handleSave = async () => {
    if (!editedQuestion) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Get user's auth token
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('Authentication required');
      }
      
      const token = await firebaseUser.getIdToken();

      // Save question to Firestore (you'll need to create this API endpoint)
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: editedQuestion,
          metadata: {
            createdAt: new Date().toISOString(),
            createdBy: firebaseUser.uid,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save question');
      }

      onQuestionUpdated(editedQuestion);
      setSaveSuccess(true);
      setIsEditing(false);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!editedQuestion) return;
    
    setEditedQuestion({
      ...editedQuestion,
      [field]: value,
    });
  };

  const handleExampleChange = (index: number, field: string, value: string) => {
    if (!editedQuestion) return;

    const newExamples = [...editedQuestion.examples];
    newExamples[index] = {
      ...newExamples[index],
      [field]: value,
    };

    setEditedQuestion({
      ...editedQuestion,
      examples: newExamples,
    });
  };

  const handleTestCaseChange = (index: number, field: string, value: string | boolean) => {
    if (!editedQuestion) return;

    const newTestCases = [...editedQuestion.testCases];
    newTestCases[index] = {
      ...newTestCases[index],
      [field]: value,
    };

    setEditedQuestion({
      ...editedQuestion,
      testCases: newTestCases,
    });
  };

  const addExample = () => {
    if (!editedQuestion) return;

    setEditedQuestion({
      ...editedQuestion,
      examples: [
        ...editedQuestion.examples,
        { input: '', output: '', explanation: '' }
      ],
    });
  };

  const removeExample = (index: number) => {
    if (!editedQuestion) return;

    setEditedQuestion({
      ...editedQuestion,
      examples: editedQuestion.examples.filter((_, i) => i !== index),
    });
  };

  const addTestCase = () => {
    if (!editedQuestion) return;

    setEditedQuestion({
      ...editedQuestion,
      testCases: [
        ...editedQuestion.testCases,
        { input: '', expectedOutput: '', isHidden: true }
      ],
    });
  };

  const removeTestCase = (index: number) => {
    if (!editedQuestion) return;

    setEditedQuestion({
      ...editedQuestion,
      testCases: editedQuestion.testCases.filter((_, i) => i !== index),
    });
  };

  if (!question || !editedQuestion) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium mb-2">No Question to Preview</h3>
          <p>Generate a question first to see the preview and editing options.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Question Preview & Editor
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Review and edit the generated question before saving
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Question'}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Question'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {saveError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <div className="text-red-700 dark:text-red-300">{saveError}</div>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <div className="text-green-700 dark:text-green-300">
            Question saved successfully! 🎉
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editedQuestion.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {editedQuestion.title}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            {isEditing ? (
              <select
                value={editedQuestion.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            ) : (
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                editedQuestion.difficulty === 'Basic' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                editedQuestion.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
              }`}>
                {editedQuestion.difficulty}
              </span>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Topic
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedQuestion.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <div className="text-gray-900 dark:text-white font-medium">
                {editedQuestion.topic}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          {isEditing ? (
            <textarea
              value={editedQuestion.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
            />
          ) : (
            <div className="prose dark:prose-dark max-w-none">
              <pre className="whitespace-pre-wrap text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                {editedQuestion.description}
              </pre>
            </div>
          )}
        </div>

        {/* Examples */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Examples
            </label>
            {isEditing && (
              <button
                onClick={addExample}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                + Add Example
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {editedQuestion.examples.map((example, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Example {index + 1}
                  </span>
                  {isEditing && editedQuestion.examples.length > 1 && (
                    <button
                      onClick={() => removeExample(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Input</label>
                    {isEditing ? (
                      <textarea
                        value={example.input}
                        onChange={(e) => handleExampleChange(index, 'input', e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                        {example.input}
                      </pre>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Output</label>
                    {isEditing ? (
                      <textarea
                        value={example.output}
                        onChange={(e) => handleExampleChange(index, 'output', e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                        {example.output}
                      </pre>
                    )}
                  </div>
                </div>
                
                {example.explanation && (
                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Explanation</label>
                    {isEditing ? (
                      <textarea
                        value={example.explanation}
                        onChange={(e) => handleExampleChange(index, 'explanation', e.target.value)}
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                        {example.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Test Cases Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Cases Summary
          </label>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {editedQuestion.testCases.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {editedQuestion.testCases.filter(tc => !tc.isHidden).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Public</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {editedQuestion.testCases.filter(tc => tc.isHidden).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Hidden</div>
              </div>
            </div>
          </div>
        </div>

        {/* Complexity Information */}
        {(editedQuestion.timeComplexity || editedQuestion.spaceComplexity) && (
          <div className="grid grid-cols-2 gap-4">
            {editedQuestion.timeComplexity && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Complexity
                </label>
                <div className="text-gray-900 dark:text-white font-mono">
                  {editedQuestion.timeComplexity}
                </div>
              </div>
            )}
            
            {editedQuestion.spaceComplexity && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Space Complexity
                </label>
                <div className="text-gray-900 dark:text-white font-mono">
                  {editedQuestion.spaceComplexity}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
