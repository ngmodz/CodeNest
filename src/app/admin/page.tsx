'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { QuestionGenerator, QuestionPreview, QuestionStorage } from '@/components/admin';

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

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('generator');
  const [generatedQuestion, setGeneratedQuestion] = useState<GeneratedQuestion | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSkeleton />
      </div>
    );
  }

  // Basic admin check - in a real app, you'd have proper role-based access
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('test');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'generator', label: 'Question Generator', icon: '🤖' },
    { id: 'preview', label: 'Preview & Edit', icon: '👁️' },
    { id: 'storage', label: 'Question Storage', icon: '💾' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Generate, preview, and manage coding questions
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {activeTab === 'generator' && (
              <QuestionGenerator 
                onQuestionGenerated={setGeneratedQuestion}
                onSwitchToPreview={() => setActiveTab('preview')}
              />
            )}
            
            {activeTab === 'preview' && (
              <QuestionPreview 
                question={generatedQuestion}
                onQuestionUpdated={setGeneratedQuestion}
                onSwitchToStorage={() => setActiveTab('storage')}
              />
            )}
            
            {activeTab === 'storage' && (
              <QuestionStorage />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
